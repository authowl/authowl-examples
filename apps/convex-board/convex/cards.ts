import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

/**
 * The whole Convex-side integration is `ctx.auth.getUserIdentity()`.
 *
 * Convex verified the AuthOwl JWT against your project's JWKS before this code
 * ran, so `identity.subject` is a trustworthy user id and the optional claims
 * (`name`, `email`) are trustworthy too. No client input is involved.
 */

const columns = v.union(v.literal('todo'), v.literal('doing'), v.literal('done'));
export type Column = 'todo' | 'doing' | 'done';

type Identity = { id: string; name: string };

async function requireIdentity(ctx: QueryCtx | MutationCtx): Promise<Identity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Sign in to use the board.');
  const name =
    identity.name?.trim() || identity.email?.split('@')[0] || `owl-${identity.subject.slice(0, 4)}`;
  return { id: identity.subject, name };
}

/** Cards in one column, already ranked. */
async function columnCards(ctx: QueryCtx | MutationCtx, column: Column): Promise<Doc<'cards'>[]> {
  return ctx.db
    .query('cards')
    .withIndex('by_column', (q) => q.eq('column', column))
    .collect();
}

/**
 * The rank that puts a card immediately before `beforeId` — or at the end of
 * the column when it is null. Averaging neighbours means a move rewrites one
 * row instead of renumbering the column.
 */
function rankFor(cards: Doc<'cards'>[], beforeId: Id<'cards'> | null): number {
  const ranked = [...cards].sort((a, b) => a.order - b.order);
  const last = ranked[ranked.length - 1];
  if (!beforeId) return (last?.order ?? 0) + 1;

  const index = ranked.findIndex((card) => card._id === beforeId);
  if (index === -1) return (last?.order ?? 0) + 1;

  const next = ranked[index]!.order;
  const previous = index === 0 ? next - 2 : ranked[index - 1]!.order;
  return (previous + next) / 2;
}

/**
 * The board. Public on purpose: signed-out visitors see an empty board rather
 * than an error, and the UI invites them to sign in.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const cards = await ctx.db.query('cards').collect();
    return cards
      .sort((a, b) => a.order - b.order)
      .map((card) => ({
        id: card._id,
        title: card.title,
        column: card.column,
        authorName: card.authorName,
        /** Only the author may delete — the UI hides what the server would refuse. */
        isMine: identity?.subject === card.authorId,
      }));
  },
});

export const add = mutation({
  args: { title: v.string(), column: columns },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const title = args.title.replace(/\s+/g, ' ').trim().slice(0, 140);
    if (!title) throw new Error('A card needs a title.');

    await ctx.db.insert('cards', {
      authorId: identity.id,
      authorName: identity.name,
      title,
      column: args.column,
      order: rankFor(await columnCards(ctx, args.column), null),
    });
  },
});

/** Anyone signed in may move any card — it is a team board. */
export const move = mutation({
  args: { id: v.id('cards'), column: columns, beforeId: v.optional(v.id('cards')) },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const card = await ctx.db.get(args.id);
    if (!card) throw new Error('That card is gone.');

    const siblings = (await columnCards(ctx, args.column)).filter((c) => c._id !== args.id);
    await ctx.db.patch(args.id, {
      column: args.column,
      order: rankFor(siblings, args.beforeId ?? null),
    });
  },
});

export const rename = mutation({
  args: { id: v.id('cards'), title: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const title = args.title.replace(/\s+/g, ' ').trim().slice(0, 140);
    if (!title) throw new Error('A card needs a title.');
    await ctx.db.patch(args.id, { title });
  },
});

/** Deleting is author-only, and the check happens here — not in the browser. */
export const remove = mutation({
  args: { id: v.id('cards') },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const card = await ctx.db.get(args.id);
    if (!card) return;
    if (card.authorId !== identity.id) throw new Error('Only the author can delete this card.');
    await ctx.db.delete(args.id);
  },
});

/** What Convex extracted from the token — handy while wiring things up. */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      subject: identity.subject,
      issuer: identity.issuer,
      name: identity.name ?? null,
      email: identity.email ?? null,
    };
  },
});

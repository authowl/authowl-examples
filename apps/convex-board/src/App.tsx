import { useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@authowl/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { useThemeToggle } from './theme';
import { MoonIcon, OwlMark, PlusIcon, SunIcon, TrashIcon } from './components/icons';

type Column = 'todo' | 'doing' | 'done';

type Card = {
  id: Id<'cards'>;
  title: string;
  column: Column;
  authorName: string;
  isMine: boolean;
};

const COLUMNS: { key: Column; label: string; hint: string }[] = [
  { key: 'todo', label: 'Backlog', hint: 'Someday' },
  { key: 'doing', label: 'In progress', hint: 'Right now' },
  { key: 'done', label: 'Done', hint: 'Shipped' },
];

export function App() {
  const { theme, toggle } = useThemeToggle();
  const convexAuth = useConvexAuth();

  // A live subscription: every browser watching this board re-renders the
  // instant anyone commits a mutation. No polling, no refetching.
  const cards = useQuery(api.cards.list) as Card[] | undefined;
  const identity = useQuery(api.cards.whoami);

  const addCard = useMutation(api.cards.add);
  const moveCard = useMutation(api.cards.move);
  const removeCard = useMutation(api.cards.remove);
  const renameCard = useMutation(api.cards.rename);

  const [dragging, setDragging] = useState<Id<'cards'> | null>(null);
  const [dropTarget, setDropTarget] = useState<Column | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (promise: Promise<unknown>) =>
    promise.catch((thrown: unknown) =>
      setError(thrown instanceof Error ? thrown.message.replace(/^.*Error:\s*/, '') : 'Something went wrong.'),
    );

  function drop(column: Column, beforeId?: Id<'cards'>) {
    const id = dragging;
    setDragging(null);
    setDropTarget(null);
    if (id && id !== beforeId) void run(moveCard({ id, column, beforeId }));
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="brand">
            <OwlMark size={30} idPrefix="nav" />
            Owl Board
            <span className="brand__sub">/ Convex</span>
          </span>

          <span
            className="live"
            data-live={convexAuth.isAuthenticated}
            title={identity ? `JWT issuer: ${identity.issuer}` : undefined}
          >
            <i aria-hidden="true" />
            {convexAuth.isLoading
              ? 'Connecting…'
              : convexAuth.isAuthenticated
                ? 'Live · Convex verified your token'
                : 'Read-only · signed out'}
          </span>

          <div className="topbar__actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <p className="banner" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              ×
            </button>
          </p>
        )}

        <SignedOut>
          <section className="gate">
            <div className="gate__pitch">
              <h1>
                One shared board,
                <br />
                <em>updating live</em>.
              </h1>
              <p>
                Convex verifies your AuthOwl JWT against the project&rsquo;s public JWKS — no shared
                secret and no call back to AuthOwl on each request. Open this page in two browsers
                to watch the board sync.
              </p>
            </div>
            <div className="gate__card">
              <SignIn />
            </div>
          </section>
        </SignedOut>

        <div className="board">
          {COLUMNS.map((column) => {
            const columnCards = (cards ?? []).filter((card) => card.column === column.key);

            return (
              <section
                key={column.key}
                className="column"
                data-drop={dropTarget === column.key}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  setDropTarget(column.key);
                }}
                onDragLeave={() => setDropTarget((current) => (current === column.key ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  drop(column.key);
                }}
              >
                <header className="column__head">
                  <h2>{column.label}</h2>
                  <span className="count">{columnCards.length}</span>
                </header>

                <div className="column__body">
                  {cards === undefined ? (
                    <>
                      <div className="skeleton" />
                      <div className="skeleton" />
                    </>
                  ) : columnCards.length === 0 ? (
                    <p className="column__empty">{column.hint}</p>
                  ) : (
                    columnCards.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        canEdit={convexAuth.isAuthenticated}
                        dragging={dragging === card.id}
                        onDragStart={() => setDragging(card.id)}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropTarget(null);
                        }}
                        onDropBefore={() => drop(column.key, card.id)}
                        onMove={(direction) => {
                          const index = COLUMNS.findIndex((c) => c.key === card.column);
                          const next = COLUMNS[index + direction];
                          if (next) void run(moveCard({ id: card.id, column: next.key }));
                        }}
                        onRename={(title) => void run(renameCard({ id: card.id, title }))}
                        onDelete={() => void run(removeCard({ id: card.id }))}
                      />
                    ))
                  )}
                </div>

                <SignedIn>
                  <Composer onAdd={(title) => void run(addCard({ title, column: column.key }))} />
                </SignedIn>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="footnote">
        Every mutation reads its author from <code>ctx.auth.getUserIdentity()</code> — the identity
        Convex extracted from the verified JWT.
      </footer>
    </div>
  );
}

function CardTile({
  card,
  canEdit,
  dragging,
  onDragStart,
  onDragEnd,
  onDropBefore,
  onMove,
  onRename,
  onDelete,
}: {
  card: Card;
  canEdit: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropBefore: () => void;
  onMove: (direction: -1 | 1) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <article
      className="card"
      draggable={canEdit}
      data-dragging={dragging}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => canEdit && event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDropBefore();
      }}
    >
      {editing ? (
        <input
          className="card__edit"
          defaultValue={card.title}
          autoFocus
          maxLength={140}
          aria-label="Card title"
          onBlur={(event) => {
            const value = event.currentTarget.value.trim();
            if (value && value !== card.title) onRename(value);
            setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <p
          className="card__title"
          onDoubleClick={() => canEdit && setEditing(true)}
          title={canEdit ? 'Double-click to rename' : undefined}
        >
          {card.title}
        </p>
      )}

      <footer className="card__foot">
        <span className="byline">
          <span className="avatar" aria-hidden="true">
            {card.authorName.slice(0, 1).toUpperCase()}
          </span>
          {card.authorName}
        </span>

        {canEdit && (
          <span className="card__tools">
            {/* Keyboard-reachable equivalents of the drag gesture. */}
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onMove(-1)}
              disabled={card.column === 'todo'}
              aria-label={`Move "${card.title}" left`}
            >
              ‹
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onMove(1)}
              disabled={card.column === 'done'}
              aria-label={`Move "${card.title}" right`}
            >
              ›
            </button>
            {/* Author-only, and the server enforces the same rule. */}
            {card.isMine && (
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                onClick={onDelete}
                aria-label={`Delete "${card.title}"`}
              >
                <TrashIcon size={13} />
              </button>
            )}
          </span>
        )}
      </footer>
    </article>
  );
}

function Composer({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('');

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        const value = title.trim();
        if (!value) return;
        setTitle('');
        onAdd(value);
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a card"
        maxLength={140}
        aria-label="New card"
      />
      <button type="submit" className="icon-btn" disabled={!title.trim()} aria-label="Add card">
        <PlusIcon />
      </button>
    </form>
  );
}

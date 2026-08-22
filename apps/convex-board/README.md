<p align="center">
  <img src="../../.github/assets/authowl-banner.png" alt="AuthOwl" width="640">
</p>

<h1 align="center">📋 Owl Board</h1>

<p align="center">
  A shared kanban board that updates live in every open browser. Convex verifies your AuthOwl
  JWT <b>statelessly</b> against the project's JWKS — powered by
  <b><code>@authowl/convex</code></b>.
</p>

<p align="center">
  <img alt="Convex" src="https://img.shields.io/badge/Convex-1.x-EE342F?logo=convex&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <a href="https://www.npmjs.com/package/@authowl/convex"><img alt="@authowl/convex" src="https://img.shields.io/npm/v/@authowl/convex?label=%40authowl%2Fconvex&logo=npm&logoColor=white&color=CB3837"></a>
</p>

---

## Run it

**1. AuthOwl** - in the [dashboard](https://dashboard.authowl.dev):

- open **Configure -> JWT templates**, enable the environment's **JWT issuer**, and create the
  **Convex** preset with the template name `convex`;
- open **Configure -> Domains** and allow `http://localhost:5174` as an origin; and
- copy a publishable key from the same project. A key from another AuthOwl project returns `401`
  from public config even if it otherwise looks valid.

Create the local environment file before linking Convex, then fill the two AuthOwl values:

```bash
cp .env.example .env.local
```

**2. Convex** - link a deployment and tell it whose tokens to trust:

```bash
npm install
npx convex dev --once          # first run links a deployment and writes VITE_CONVEX_URL

npx convex env set AUTHOWL_ISSUER_URL <jwtIssuer.issuer>
npx convex env set AUTHOWL_PROJECT_ID <jwtIssuer.aud>
npx convex dev --once          # deploy after the two server-side values exist
```

Both values appear on the JWT templates page and in your project's public config `jwtIssuer`
block. Copy the issuer **exactly** - `localhost` and `127.0.0.1` are different JWT issuers even
on the same machine.

The first `convex dev --once` can stop after linking with a missing-environment-variable error.
That is expected on a fresh deployment: set the two Convex variables, then run it again.

**3. The app**

```bash
npm run dev                    # → http://localhost:5174
```

Open it in two browsers, sign in as two people, and drag a card. Both boards move.

> Convex Cloud has to reach your JWKS URL. If AuthOwl is running only on your laptop, use a
> tunnel or point at the hosted deployment.

## What to look at

| File | Why |
| --- | --- |
| [`src/main.tsx`](src/main.tsx) | `<ConvexProviderWithAuthOwl>` — the one-line swap from Clerk |
| [`convex/auth.config.ts`](convex/auth.config.ts) | The custom-JWT verifier Convex uses |
| [`convex/cards.ts`](convex/cards.ts) | `ctx.auth.getUserIdentity()` in every mutation |
| [`convex/schema.ts`](convex/schema.ts) | Cards, ranked by a fractional `order` |

## The swap from Clerk

If you have used `ConvexProviderWithClerk`, this is the same shape:

```tsx
<AuthOwlProvider publishableKey={pk} apiUrl={apiUrl}>
  <ConvexProviderWithAuthOwl client={convex} useAuth={useAuth}>
    <App />
  </ConvexProviderWithAuthOwl>
</AuthOwlProvider>
```

`useAuth` comes from `@authowl/react` and has the shape Convex expects. Nothing else in your
Convex code changes.

Hover the green live-status pill after sign-in to see the exact issuer Convex
read from the verified token. That value comes from `cards:whoami`, not from
client configuration.

## Identity on the Convex side

Convex verifies the token against your JWKS **before** your function runs, so the identity is
already trustworthy when you read it:

```ts
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error('Sign in to use the board.');

await ctx.db.insert('cards', {
  authorId: identity.subject,        // the AuthOwl user id
  authorName: identity.name ?? …,    // from the verified claims
  // …
});
```

There is no shared secret and no request-time call to AuthOwl. Convex fetches the public
JWKS and checks the signature itself.

Authorization rules this board demonstrates:

- **Reading is public** — signed-out visitors see the board, read-only.
- **Any signed-in member may add and move cards** — it is a team board.
- **Only the author may delete.** The button is hidden for other people's cards *and* the
  mutation refuses. `convex/cards.ts` is the one that matters.

## About `convex/_generated/`

It is committed, per Convex's own recommendation, so a fresh clone typechecks and builds
before you have run anything. `npx convex dev` regenerates it against your deployment.

## License

MIT. Take it.

<p align="center">
  <img src=".github/assets/authowl-banner.png" alt="AuthOwl — authentication that never sleeps" width="820">
</p>

<p align="center">
  <b>Four complete apps, three AuthOwl SDKs, zero boilerplate to copy.</b><br>
  Fork one, drop in your publishable key, and you have real authentication running in about two minutes.
</p>

<p align="center">
  <a href="https://authowl.dev">authowl.dev</a> &nbsp;·&nbsp;
  <a href="https://github.com/mstfash/authowl-sdk">SDK</a> &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/org/authowl">npm</a>
</p>

<p align="center">
  <a href="https://github.com/mstfash/authowl-examples/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/mstfash/authowl-examples/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@authowl/react"><img alt="@authowl/react" src="https://img.shields.io/npm/v/@authowl/react?label=%40authowl%2Freact&logo=npm&logoColor=white&color=CB3837"></a>
  <a href="https://www.npmjs.com/package/@authowl/next"><img alt="@authowl/next" src="https://img.shields.io/npm/v/@authowl/next?label=%40authowl%2Fnext&logo=npm&logoColor=white&color=CB3837"></a>
  <a href="https://www.npmjs.com/package/@authowl/convex"><img alt="@authowl/convex" src="https://img.shields.io/npm/v/@authowl/convex?label=%40authowl%2Fconvex&logo=npm&logoColor=white&color=CB3837"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A520.12-3C873A?logo=node.js&logoColor=white">
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-3fa34d"></a>
</p>

---

## The examples

Each one is a real app, not a login screen with a `console.log` behind it.

| App | Stack | The SDK it shows off |
| --- | --- | --- |
| **[🦉 Owl Todo](apps/react-todo)** - local todo list with filters, inline edit, and progress | Vite · React 19 · browser-only SPA | **`@authowl/react`** - provider, hooks, drop-in auth, and account settings with no app server |
| **[🏢 Owl Org](apps/react-org)** - organization invitations, switching, roles, and membership management | Vite · React 19 · browser-only SPA | **`@authowl/react`** - organization hooks and components across owner, admin, member, and invitee flows |
| **[✍️ Owl Blog](apps/nextjs-blog)** - public feed, drafts, likes, and editor | Next.js 16 · App Router | **`@authowl/next`** - optional `auth()` in a Server Component and protected server actions |
| **[📋 Owl Board](apps/convex-board)** — shared kanban that syncs live between browsers | Vite · React 19 · Convex | **`@authowl/convex`** — a one-line drop-in replacement for `ConvexProviderWithClerk` |

All four use **`@authowl/react`** for the sign-in UI, and all four ship the same
handwritten design system: light + dark, keyboard-reachable, no CSS framework to learn.

Every app is **standalone** — its own `package.json`, its own README, no workspace, no
root install. `cd` into one and it works.

---

## The entire integration

Not an excerpt. This is genuinely all of it.

### Next.js — `@authowl/next`

```tsx
// app/providers.tsx - the client half
import { createAuthOwlNextFetch } from '@authowl/next/client';

const authOwlFetch = createAuthOwlNextFetch({
  publishableKey: PUBLISHABLE_KEY,
  apiUrl: API_URL,
});

<AuthOwlProvider
  publishableKey={PUBLISHABLE_KEY}
  apiUrl={API_URL}
  fetch={authOwlFetch}
  appearance={{ theme }}
>
  {children}
</AuthOwlProvider>
```

```ts
// app/api/authowl/session/route.ts - the same-origin server bridge
import { createAuthOwlSessionBridge } from '@authowl/next/server';

export const POST = createAuthOwlSessionBridge();
```

```tsx
// app/page.tsx - public data plus an optional server session
import { auth } from '@authowl/next/server';

const session = await auth();
const posts = await listPublished();
const mine = session ? await listByAuthor(session.user.id) : [];
```

```tsx
// app/sign-in/[[...sign-in]]/page.tsx — the whole sign-in screen
<SignIn resetPasswordUrl="/reset-password" redirectTo="/" />
```

### React SPA - `@authowl/react`

```tsx
<AuthOwlProvider publishableKey={pk} apiUrl={apiUrl}>
  <App />
</AuthOwlProvider>
```

```tsx
const { user, isSignedIn } = useUser();
const key = `authowl-example:todos:${user.id}`;
localStorage.setItem(key, JSON.stringify(todos));
```

### Convex — `@authowl/convex`

```tsx
<AuthOwlProvider publishableKey={pk} apiUrl={apiUrl}>
  <ConvexProviderWithAuthOwl client={convex} useAuth={useAuth}>
    <App />
  </ConvexProviderWithAuthOwl>
</AuthOwlProvider>
```

```ts
// convex/cards.ts — Convex already verified the JWT before this ran
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error('Sign in to use the board.');
await ctx.db.insert('cards', { authorId: identity.subject, /* … */ });
```

---

## Quick start

**1. Create a project** at [authowl.dev](https://authowl.dev) and copy its publishable key
(`pk_test_…`). It is safe to ship in a browser bundle — it is scoped to one environment and
to the origins you allow-list.

**2. Allow the example's origin** in the dashboard, so the browser may call the API:

| App | Origin to allow |
| --- | --- |
| Owl Todo | `http://localhost:5173` |
| Owl Org | `http://localhost:5175` |
| Owl Blog | `http://localhost:3000` |
| Owl Board | `http://localhost:5174` |

**3. Run one.**

```bash
git clone https://github.com/mstfash/authowl-examples.git
cd authowl-examples/apps/react-todo

npm install
cp .env.example .env.local     # paste your key + API URL
npm run dev                    # http://localhost:5173
```

Forget a value and the app renders a setup screen telling you which one, instead of a stack
trace.

> **Only Owl Board needs the project's JWT issuer switched on.** Owl Todo uses the browser
> session, and Owl Blog reads that session on the Next.js server with `auth()`.

Prefer to scaffold from scratch? `npx authowl` logs you in, detects your Next.js or Vite
app, and wires the same setup transactionally.

---

## Which package do I need?

| Package | Use it when |
| --- | --- |
| [`@authowl/react`](https://www.npmjs.com/package/@authowl/react) | You render UI in React. Provider, hooks, and drop-in `<SignIn/>`, `<SignUp/>`, `<UserButton/>`, `<UserProfile/>`, passkeys, MFA, organizations. |
| [`@authowl/next`](https://www.npmjs.com/package/@authowl/next) | You need the session on the **server** — Server Components, route handlers, server actions. |
| [`@authowl/core`](https://www.npmjs.com/package/@authowl/core) | Anything else. Framework-agnostic client, plus `@authowl/core/server` for JWT verification and the typed Admin API. |
| [`@authowl/convex`](https://www.npmjs.com/package/@authowl/convex) | Your backend is Convex. |
| [`authowl`](https://www.npmjs.com/package/authowl) | The CLI: `npx authowl` for login and project scaffolding. |

---

## What the SDK handles so the examples don't

None of these apps contain a password field, an OTP input, a QR code, or a session
refresher. `<SignIn/>` reads your project's public config and renders exactly the methods
you switched on:

- password · magic link · email OTP · phone OTP · passkeys · social · enterprise SSO
- MFA enrolment and challenge, backup codes
- password reset, email verification, consent gates
- account settings, device and session management, organization switching
- English and Arabic, with RTL handled automatically

Turn a method on in the dashboard and it appears — no code change in these apps.

### Two ways to mount all this

| | Embedded components *(what these examples use)* | Hosted account portal |
| --- | --- | --- |
| Where it runs | Inside your app, on your domain, in your design | On AuthOwl, at a URL you link to |
| You write | A route per surface, one component in each | A link |
| Covers | Everything the SDK exports | Sign in · Sign up · Unauthorized sign-in · **Reset password · Verify email** · User profile · Sign out |

The portal covers the two emailed-link landing pages too — it mounts the very same
`<ResetPassword/>` and `<VerifyEmail/>` components, wrapped in your project's branding.

**So why do the examples mount their own?** Two practical reasons, neither of them "the
portal can't":

1. The portal is **opt-in** per project and needs an accounts domain configured. An example
   that depended on it would not run for most people who fork this.
2. Its origin is not published in the SDK's public config, so an app cannot discover it —
   you would paste another URL into your env.

If you have the portal enabled, delete `app/reset-password/` and `app/verify-email/` and
point the props at the portal URLs from **Settings → Account portal** instead:

```tsx
<SignIn resetPasswordUrl="https://accounts.yourdomain.com/reset-password" />
<SignUp verifyEmailUrl="https://accounts.yourdomain.com/verify-email" />
```

Either way the props must be set — see
[Owl Blog's note](apps/nextjs-blog/README.md#password-reset-and-email-verification) for
what silently breaks if they are not.

---

## Security notes worth copying

The examples are written the way production code should be, and each one demonstrates the
same rule from a different angle:

- **The user id always comes from a verified session**, never from the request body. Owl
  Blog re-checks `auth()` inside every server action; Owl Board reads
  `ctx.auth.getUserIdentity()` inside each mutation.
- **A browser-only demo is honest about its boundary.** Owl Todo keeps demo data in
  per-account local storage; it does not pretend client storage is server authorization.
- **Ownership checks live on the server.** Owl Blog's "delete" is a query filtered by author
  id, so another user's id simply never matches. Owl Board hides the delete button for cards
  you did not write *and* refuses the mutation.
- **The SDK adapts to the browser's cookie policy.** It prefers AuthOwl's HttpOnly cookie.
  When a browser blocks the cross-site cookie, the paired bearer transport keeps the session
  working; the Next.js example immediately validates and projects that session into its own
  host-only HttpOnly cookie before server rendering or server actions rely on it.

---

## Repo layout

```
authowl-examples/
├── apps/
│   ├── nextjs-blog/     # @authowl/next - App Router, server actions
│   ├── react-todo/      # @authowl/react - browser-only Vite SPA
│   └── convex-board/    # @authowl/convex — realtime, stateless verification
├── .github/workflows/   # CI: typecheck + build every app on every push
└── LICENSE              # MIT — copy anything you like
```

---

## Troubleshooting

<details>
<summary><b>"origin not allowed" in the console</b></summary>

The publishable key is valid but the page's origin is not on the project's allow-list. Add
`http://localhost:3000` / `:5173` / `:5174` in the dashboard, then reload.
</details>

<details>
<summary><b>The sign-in form only offers a password, and a dev warning mentions public config</b></summary>

The SDK could not fetch your project's public config, so it fell back to a password-only
form. Usually a wrong `apiUrl`, a key pointing at a deleted project, or a disallowed origin.
</details>

<details>
<summary><b><code>getToken()</code> returns null (Owl Board)</b></summary>

The project's **JWT issuer** is off. Turn it on in **Settings → JWT issuer** — that is what
mints the token Convex verifies against.
</details>

<details>
<summary><b>Convex says the token was rejected</b></summary>

`convex/auth.config.ts` must match your project's `jwtIssuer` block exactly. Copy the issuer
verbatim: `localhost` and `127.0.0.1` are different JWT issuers even when they resolve to
the same machine.
</details>

---

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). If you build something
with AuthOwl worth showing off, we would love to link it.

## License

[MIT](./LICENSE) — fork it, ship it, no attribution required.

# 🦉 Owl Org — organizations, seats, teams, and custom permissions

A deliberately plain React SPA whose only job is to **exercise every organization
surface `@authowl/react` exposes** and show you the raw result of each call.

Not a product demo. A bench.

```bash
npm install
cp .env.example .env.local     # publishable key + API URL
npm run dev                    # http://localhost:5175
```

## What it covers

| Panel | Exercises |
| --- | --- |
| **Claim inspector** | `useOrganization()` state, the advisory session claim, and the verified JWT claim side by side — including `roles[]` and whether `has()` agrees with every role in it |
| **Organizations** | `list` · `setActive` · `delete`, plus `<CreateOrganization/>` and `<OrganizationProfile/>` |
| **Member seats** | `listMembers` · `inviteMember` · `listInvitations` · `cancelInvitation` · `updateMemberRole` · `removeMember` · `leave` · `listRoles` |
| **My invitations** | `listUserInvitations` · `acceptInvitation` · `rejectInvitation` |
| **Emailed-link invitation** | `useOrganizationInvitation()` — the `?authowl_invitation=<id>` redemption path, without needing a mailbox |
| **Teams** | `listTeams` · `setActiveTeam` (including clearing it) |
| **Permission gates** | `<Protect>` and `has()` / `hasPermission()`, each with a matching negative control |
| **Call transcript** | Every call above, with its input and its raw result |

## Testing the emailed-link invitation without a mailbox

The invitation email links to your own page carrying `?authowl_invitation=<id>`. You do not
need the email to exercise it — invite an address from the Member seats panel, copy the
invitation id, and open:

```
http://localhost:5175/?authowl_invitation=<id>
```

`AuthOwlProvider` stashes the id and strips it from the URL, so it survives the sign-up
redirects. Visiting it while signed in as somebody else exercises the `wrong_account` branch.

Note that `invitationPrompt` defaults to `true`, so the SDK's own `<InvitationPrompt/>` dialog
renders alongside this bench's hook-driven panel — both read the same stash. Headless apps
pass `invitationPrompt={false}`.

## The two things worth knowing before you read a result

**Nothing here is a security boundary.** `has()`, `hasPermission()`, and `<Protect>`
all read the *local session claim*. They are UX affordances. Real authorization is
enforced server-side over the verified token — see `@authowl/next`'s server `has()`.

**Claims are snapshots.** `permissions` and `teams` come from the session as it was
minted. A role or team changed in the dashboard does not necessarily appear in an
already-open session. The claim inspector exists to make that lag visible: change
something in the dashboard, then watch whether the session column moves on
`setActive`, on reload, or only after a fresh sign-in.

## What the dashboard has to provide

Three things this app cannot do for itself:

1. **Organizations / teams** switched on under **Settings → Auth methods**, and
   `http://localhost:5175` on the project's allowed origins.
2. **Features and custom permissions** (`org:<feature>:<action>`) and the **custom
   roles** that carry them, under **Organizations → Features / Roles**.
3. **Teams.** There is no client-side `createTeam` — teams are created per
   organization in the dashboard. The app can only list them and pick an active one.

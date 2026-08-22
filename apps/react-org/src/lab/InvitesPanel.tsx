import * as React from 'react';
import { useAuthClient, useOrganizationInvitation } from '@authowl/react';
import type { OrganizationUserInvitation } from '@authowl/react';
import { Empty, Panel, useCallLog } from './kit';

/**
 * The invitations addressed to ME, by both routes that exist.
 *
 * `listUserInvitations()` is the in-app directory - it needs no emailed link,
 * which is what lets the bench drive multi-user flows without a mailbox.
 *
 * `useOrganizationInvitation()` is the other one: the emailed link lands on
 * whatever page the inviting admin was on, carrying `?authowl_invitation=<id>`.
 * `AuthOwlProvider` stashes that id on mount and strips it from the URL, so it
 * survives the sign-up redirects the invitee still has to complete. Open this
 * app with that parameter to exercise it.
 */
type InvitesState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; invites: OrganizationUserInvitation[] };

export function InvitesPanel() {
  const client = useAuthClient();
  const { run } = useCallLog();
  // One value, not a nullable list plus a boolean that must be kept in step
  // with it. The states are mutually exclusive, so the type says so.
  const [state, setState] = React.useState<InvitesState>({ kind: 'loading' });

  const refresh = React.useCallback(async () => {
    const data = await run('organization.listUserInvitations()', undefined, () =>
      client.organization.listUserInvitations(),
    );
    // `data ?? []` would be the bug this panel exists to demonstrate against: a
    // failed read is not an empty list, and reporting "nothing pending" over a
    // refusal asserts something the call never established.
    setState(data === null ? { kind: 'failed' } : { kind: 'loaded', invites: data });
  }, [client, run]);

  const invites = state.kind === 'loaded' ? state.invites : null;

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <LinkInvitation />
      <Panel
        title="My invitations"
        subtitle="Accept or reject in-app - no emailed link in the loop."
        actions={
          <button type="button" className="btn" onClick={() => void refresh()}>
            Refresh
          </button>
        }
      >
        {invites?.length ? (
          <table className="grid">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Role</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td>
                    {invite.organizationName}
                    <br />
                    <code className="dim">{invite.id}</code>
                  </td>
                  <td>
                    <code>{invite.role}</code>
                  </td>
                  <td>{invite.status}</td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={() =>
                        void run(
                          'organization.acceptInvitation()',
                          { invitationId: invite.id },
                          () => client.organization.acceptInvitation({ invitationId: invite.id }),
                        ).then(refresh)
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() =>
                        void run(
                          'organization.rejectInvitation()',
                          { invitationId: invite.id },
                          () => client.organization.rejectInvitation({ invitationId: invite.id }),
                        ).then(refresh)
                      }
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : state.kind === 'failed' ? (
          <>
            <p className="error">
              Could not read your invitations, so this panel does not know whether any are
              pending. The transcript below has the exact refusal.
            </p>
            <p className="row-actions">
              <button type="button" className="btn" onClick={() => void refresh()}>
                Try again
              </button>
            </p>
          </>
        ) : state.kind === 'loading' ? (
          <Empty>Loading&hellip;</Empty>
        ) : (
          <Empty>Nothing pending for this account.</Empty>
        )}
      </Panel>
    </>
  );
}

/**
 * The invitation this browser arrived carrying, if any.
 *
 * Renders nothing while the hook is idle - which is the normal case, and the
 * reason this sits above the directory rather than replacing it.
 */
function LinkInvitation() {
  const { invitation, status, accept, dismiss } = useOrganizationInvitation();
  const { run } = useCallLog();

  if (status === 'idle') {
    return null;
  }

  return (
    <Panel
      title="Invitation from the emailed link"
      subtitle="?authowl_invitation=<id> - captured by the provider, redeemed here."
    >
      <p className="hint">
        status: <code>{status}</code>
      </p>
      {invitation ? (
        <p>
          <strong>{invitation.organizationName}</strong> as <code>{invitation.role}</code>
          {invitation.inviterEmail ? <> - invited by {invitation.inviterEmail}</> : null}
        </p>
      ) : null}
      {status === 'wrong_account' ? (
        <p className="error">
          This session belongs to a different address than the one invited. Note that the SDK
          never names the invited address here - `getInvitation` is recipient-only.
        </p>
      ) : null}
      {status === 'verify_email' ? (
        <p className="error">The server is asking for a verified email before redeeming.</p>
      ) : null}
      {status === 'gone' ? (
        <p className="error">The invitation is expired or already used.</p>
      ) : null}
      <div className="row-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={status !== 'ready'}
          onClick={() =>
            void run('useOrganizationInvitation().accept()', { id: invitation?.id }, async () => {
              // The hook resolves a plain boolean, not the client's ActionResult
              // shape - adapt it so it lands in the transcript like every other call.
              const joined = await accept();
              return joined
                ? { data: { joined }, error: null }
                : { data: null, error: { message: 'accept() resolved false' } };
            })
          }
        >
          Accept
        </button>
        <button type="button" className="btn" onClick={dismiss}>
          Dismiss (local only)
        </button>
      </div>
    </Panel>
  );
}

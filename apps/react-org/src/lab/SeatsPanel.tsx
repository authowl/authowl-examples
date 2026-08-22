import * as React from 'react';
import { useAuthClient, useOrganization, useUser } from '@authowl/react';
import type {
  OrganizationInvitation,
  OrganizationMemberWithUser,
  OrganizationRoleSummary,
} from '@authowl/react';
import { Empty, Panel, useCallLog } from './kit';

const BUILT_IN_ROLES = ['owner', 'admin', 'member'];

/**
 * Member seats: who occupies one, who has been invited to one, and every
 * transition between the two - invite, accept, cancel, change role, remove, leave.
 */
export function SeatsPanel() {
  const client = useAuthClient();
  const { run } = useCallLog();
  const { organization } = useOrganization();
  const { user } = useUser();

  const [members, setMembers] = React.useState<OrganizationMemberWithUser[] | null>(null);
  const [total, setTotal] = React.useState<number | null>(null);
  const [invitations, setInvitations] = React.useState<OrganizationInvitation[] | null>(null);
  const [roles, setRoles] = React.useState<OrganizationRoleSummary[] | null>(null);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('member');

  const refresh = React.useCallback(async () => {
    if (!organization) {
      setMembers(null);
      setInvitations(null);
      setRoles(null);
      return;
    }
    const membersData = await run('organization.listMembers()', undefined, () =>
      client.organization.listMembers(),
    );
    setMembers(membersData?.members ?? []);
    setTotal(membersData?.total ?? null);

    const invites = await run('organization.listInvitations()', undefined, () =>
      client.organization.listInvitations(),
    );
    setInvitations(invites ?? []);

    const roleList = await run('organization.listRoles()', undefined, () =>
      client.organization.listRoles(),
    );
    setRoles(roleList ?? []);
  }, [client, organization, run]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!organization) {
    return (
      <Panel title="Member seats" subtitle="Members and invitations for the active organization.">
        <Empty>Set an active organization first.</Empty>
      </Panel>
    );
  }

  const roleOptions = [...BUILT_IN_ROLES, ...(roles ?? []).map((r) => r.role)];

  return (
    <Panel
      title="Member seats"
      subtitle={`${total ?? members?.length ?? 0} member(s), ${invitations?.length ?? 0} invitation(s) in ${organization.name}.`}
      actions={
        <button type="button" className="btn" onClick={() => void refresh()}>
          Refresh
        </button>
      }
    >
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim()) return;
          void run('organization.inviteMember()', { email: email.trim(), role }, () =>
            client.organization.inviteMember({ email: email.trim(), role }),
          ).then(() => {
            setEmail('');
            void refresh();
          });
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          aria-label="Invite email"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Invite role">
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r}
              {BUILT_IN_ROLES.includes(r) ? '' : ' (custom)'}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--primary">
          Invite
        </button>
      </form>
      <p className="hint">
        Roles offered: the three built-ins plus whatever <code>listRoles()</code> returns
        (this project's custom roles). {roles?.length ? `${roles.length} custom role(s) found.` : 'No custom roles found yet.'}
      </p>

      <h3>Members</h3>
      {members?.length ? (
        <table className="grid">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isMe = member.userId === user?.id;
              return (
                <tr key={member.id}>
                  <td>
                    {member.user.email}
                    {isMe ? <span className="tag">you</span> : null}
                    <br />
                    <code className="dim">{member.userId}</code>
                  </td>
                  <td>
                    <select
                      value={member.role}
                      aria-label={`Role for ${member.user.email}`}
                      onChange={(e) =>
                        void run(
                          'organization.updateMemberRole()',
                          { memberId: member.id, role: e.target.value },
                          () =>
                            client.organization.updateMemberRole({
                              memberId: member.id,
                              role: e.target.value,
                            }),
                        ).then(refresh)
                      }
                    >
                      {[...new Set([...roleOptions, member.role])].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      onClick={() =>
                        void run(
                          'organization.removeMember()',
                          // `user.email` is nullable since core 0.16 - the server may
                          // withhold it - so fall back to the member id, which the
                          // same parameter accepts.
                          { memberIdOrEmail: member.user.email ?? member.id },
                          () =>
                            client.organization.removeMember({
                              memberIdOrEmail: member.user.email ?? member.id,
                            }),
                        ).then(refresh)
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Empty>No members returned.</Empty>
      )}

      <h3>Outgoing invitations</h3>
      {invitations?.length ? (
        <table className="grid">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {invitations.map((invite) => (
              <tr key={invite.id}>
                <td>
                  {invite.email}
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
                    className="btn btn--sm"
                    onClick={() =>
                      void run(
                        'organization.cancelInvitation()',
                        { invitationId: invite.id },
                        () => client.organization.cancelInvitation({ invitationId: invite.id }),
                      ).then(refresh)
                    }
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>No invitations outstanding.</Empty>
      )}

      <p className="hint">
        <button
          type="button"
          className="text-button"
          onClick={() =>
            void run('organization.leave()', { organizationId: organization.id }, () =>
              client.organization.leave({ organizationId: organization.id }),
            ).then(refresh)
          }
        >
          Leave this organization
        </button>{' '}
        - the member's own exit, distinct from being removed.
      </p>
    </Panel>
  );
}

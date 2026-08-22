import * as React from 'react';
import { useAuthClient, useOrganization } from '@authowl/react';
import type { OrganizationTeam } from '@authowl/react';
import { Empty, Panel, useCallLog } from './kit';

/**
 * Teams are pure grouping - being on one grants nothing. The client can only
 * READ them and pick an active one; creating a team is a dashboard-side action,
 * so the ids below have to be resolved back to names through `listTeams()`.
 */
export function TeamsPanel() {
  const client = useAuthClient();
  const { run } = useCallLog();
  const { organization, teams: claimedTeams, activeTeamId } = useOrganization();
  const [teams, setTeams] = React.useState<OrganizationTeam[] | null>(null);

  const refresh = React.useCallback(async () => {
    if (!organization) {
      setTeams(null);
      return;
    }
    const data = await run('organization.listTeams()', undefined, () =>
      client.organization.listTeams(),
    );
    setTeams(data ?? []);
  }, [client, organization, run]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!organization) {
    return (
      <Panel title="Teams" subtitle="Sub-groups inside the active organization.">
        <Empty>Set an active organization first.</Empty>
      </Panel>
    );
  }

  return (
    <Panel
      title="Teams"
      subtitle="listTeams / setActiveTeam. Grouping only - never an authority check."
      actions={
        <button type="button" className="btn" onClick={() => void refresh()}>
          Refresh
        </button>
      }
    >
      {teams?.length ? (
        <table className="grid">
          <thead>
            <tr>
              <th>Team</th>
              <th>Id</th>
              <th>On my claim?</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const onClaim = claimedTeams.includes(team.id);
              const active = team.id === activeTeamId;
              return (
                <tr key={team.id} className={active ? 'is-active' : undefined}>
                  <td>
                    {team.name} {active ? <span className="tag">active</span> : null}
                  </td>
                  <td>
                    <code className="dim">{team.id}</code>
                  </td>
                  <td>
                    <span className={`verdict verdict--${onClaim ? 'yes' : 'no'}`}>
                      {String(onClaim)}
                    </span>
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={active}
                      onClick={() =>
                        void run('organization.setActiveTeam()', { teamId: team.id }, () =>
                          client.organization.setActiveTeam({ teamId: team.id }),
                        ).then(refresh)
                      }
                    >
                      Set active
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Empty>
          No teams in this organization. Teams have no client-side create - add one in the
          dashboard under Organizations &rarr; {organization.name} &rarr; Teams.
        </Empty>
      )}

      <p className="hint">
        <button
          type="button"
          className="text-button"
          onClick={() =>
            void run('organization.setActiveTeam()', { teamId: null }, () =>
              client.organization.setActiveTeam({ teamId: null }),
            ).then(refresh)
          }
        >
          setActiveTeam(null)
        </button>{' '}
        clears it. Switching organization is documented to clear it too - worth verifying.
      </p>
    </Panel>
  );
}

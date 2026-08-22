import * as React from 'react';
import {
  CreateOrganization,
  OrganizationList,
  OrganizationProfile,
  useAuthClient,
  useOrganization,
} from '@authowl/react';
import type { Organization } from '@authowl/react';
import { Empty, Panel, useCallLog } from './kit';

/** Create, list, switch, and manage organizations through the raw client. */
export function OrgsPanel() {
  const client = useAuthClient();
  const { run } = useCallLog();
  const { organization } = useOrganization();
  const [orgs, setOrgs] = React.useState<Organization[] | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showList, setShowList] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const data = await run('organization.list()', undefined, () => client.organization.list());
    setOrgs(data ?? []);
  }, [client, run]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const setActive = (organizationId: string | null) =>
    run('organization.setActive()', { organizationId }, () =>
      client.organization.setActive({ organizationId }),
    );

  return (
    <Panel
      title="Organizations"
      subtitle="list / setActive / create / delete, plus the drop-in components."
      actions={
        <>
          <button type="button" className="btn" onClick={() => void refresh()}>
            Refresh
          </button>
          <button type="button" className="btn" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Hide create' : '<CreateOrganization/>'}
          </button>
          <button type="button" className="btn" onClick={() => setShowProfile((v) => !v)}>
            {showProfile ? 'Hide profile' : '<OrganizationProfile/>'}
          </button>
          <button type="button" className="btn" onClick={() => setShowList((v) => !v)}>
            {showList ? 'Hide list' : '<OrganizationList/>'}
          </button>
        </>
      }
    >
      {orgs === null ? (
        <Empty>Loading…</Empty>
      ) : orgs.length === 0 ? (
        <Empty>No organizations yet. Create one to begin.</Empty>
      ) : (
        <table className="grid">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Id</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => {
              const active = org.id === organization?.id;
              return (
                <tr key={org.id} className={active ? 'is-active' : undefined}>
                  <td>
                    {org.name} {active ? <span className="tag">active</span> : null}
                  </td>
                  <td>
                    <code>{org.slug}</code>
                  </td>
                  <td>
                    <code className="dim">{org.id}</code>
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={active}
                      onClick={() => void setActive(org.id).then(refresh)}
                    >
                      Set active
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      onClick={() =>
                        void run('organization.delete()', { organizationId: org.id }, () =>
                          client.organization.delete({ organizationId: org.id }),
                        ).then(refresh)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="hint">
        <button type="button" className="text-button" onClick={() => void setActive(null).then(refresh)}>
          setActive(null)
        </button>{' '}
        clears the active organization - the personal-account state.
      </p>

      {showCreate ? (
        <div className="embed">
          <CreateOrganization onCreated={() => void refresh()} />
        </div>
      ) : null}

      {showList ? (
        <div className="embed">
          <OrganizationList onOrganizationChange={() => void refresh()} />
        </div>
      ) : null}

      {showProfile ? (
        <div className="embed">
          {organization ? (
            <OrganizationProfile
              onDeleted={() => void refresh()}
              onLeft={() => void refresh()}
            />
          ) : (
            <Empty>No active organization to profile.</Empty>
          )}
        </div>
      ) : null}
    </Panel>
  );
}

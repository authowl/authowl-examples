import * as React from 'react';
import { useAuth, useOrganization, useSession } from '@authowl/react';
import { Panel, Row, Rows, Json, Empty } from './kit';

/**
 * What the SESSION says vs what the TOKEN says.
 *
 * Both `permissions` and `teams` are claim snapshots. The SDK is explicit that
 * they are advisory and can lag a dashboard-side change, so this panel exists to
 * make the lag visible: change a role or a team in the dashboard, then watch
 * which of these two columns moves, and when.
 */
export function ClaimPanel() {
  const { organization, membership, teams, activeTeamId, has, hasPermission, isLoaded } =
    useOrganization();
  const { getToken, orgId } = useAuth();
  const session = useSession();
  const [claim, setClaim] = React.useState<unknown>(null);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const readToken = React.useCallback(async () => {
    setTokenError(null);
    try {
      const token = await getToken({ forceRefresh: true });
      if (!token) {
        setClaim(null);
        setTokenError('getToken() resolved null - is the project JWT issuer switched on?');
        return;
      }
      const [, payload] = token.split('.');
      setClaim(JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))));
    } catch (error) {
      setClaim(null);
      setTokenError(error instanceof Error ? error.message : String(error));
    }
  }, [getToken]);

  return (
    <Panel
      title="Claim inspector"
      subtitle="The advisory session claim beside the verified token claim. Both are snapshots."
      actions={
        <>
          <button type="button" className="btn" onClick={() => session.refetch()}>
            refetch session
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => session.refetch({ query: { disableCookieCache: true } })}
          >
            refetch (no cache)
          </button>
          <button type="button" className="btn" onClick={readToken}>
            Mint + decode token
          </button>
        </>
      }
    >
      <Rows>
        <Row label="isLoaded">{String(isLoaded)}</Row>
        <Row label="orgId (useAuth)">{orgId ?? <em>null</em>}</Row>
        <Row label="organization">
          {organization ? `${organization.name} (${organization.slug})` : <em>null</em>}
        </Row>
        <Row label="role (primary)">{membership?.role ?? <em>null</em>}</Row>
        <Row label="roles[] (every role held)">
          {membership?.roles?.length ? (
            membership.roles.map((r) => <code key={r}>{r} </code>)
          ) : (
            <em>absent - an older AuthOwl mints only `role`</em>
          )}
        </Row>
        <Row label="activeTeamId">{activeTeamId ?? <em>null</em>}</Row>
        <Row label="session.activeOrganizationId">
          {session.data?.session.activeOrganizationId ?? <em>null</em>}
        </Row>
        <Row label="session.activeTeamId">{session.data?.session.activeTeamId ?? <em>null</em>}</Row>
      </Rows>

      <h3>permissions[] (session claim)</h3>
      {membership?.permissions?.length ? (
        <ul className="chips">
          {membership.permissions.map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No permissions on the claim.</Empty>
      )}

      <h3>teams[] (session claim)</h3>
      {teams.length ? (
        <ul className="chips">
          {teams.map((t) => (
            <li key={t}>
              <code>{t}</code>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>
          No teams on the claim. Note the SDK's warning: an absent claim means "no proven
          team", not "provably no team".
        </Empty>
      )}

      <h3>Sanity checks on has()</h3>
      <p className="hint">
        <code>has(&#123;&#125;)</code> with no criterion must be <code>false</code>, and{' '}
        <code>hasPermission</code> must agree with <code>has</code> for the same id.
      </p>
      <Rows>
        <Row label="has({})">{String(has({}))}</Row>
        <Row label="has({ role: membership.role })">
          {membership ? String(has({ role: membership.role })) : <em>no membership</em>}
        </Row>
        <Row label="has() agrees on EVERY role in roles[]">
          {membership?.roles?.length
            ? String(membership.roles.every((r) => has({ role: r })))
            : <em>no roles[] on the claim</em>}
        </Row>
        <Row label="has vs hasPermission agree">
          {membership?.permissions?.length
            ? String(
                membership.permissions.every(
                  (p) => has({ permission: p }) === hasPermission({ permission: p }),
                ),
              )
            : <em>nothing to compare</em>}
        </Row>
      </Rows>

      <h3>Verified token claim</h3>
      {tokenError ? <p className="error">{tokenError}</p> : null}
      {claim ? <Json value={claim} /> : <Empty>Mint a token to compare it with the session.</Empty>}
    </Panel>
  );
}

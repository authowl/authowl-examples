import * as React from 'react';
import { Protect, useOrganization, useUser } from '@authowl/react';
import { Panel, Row, Rows, Verdict } from './kit';

const ROLE_CASES = ['owner', 'admin', 'member'];

/**
 * The gates, positive and negative side by side.
 *
 * A gate that lets the right person through proves little on its own; the test
 * that matters is that the SAME gate refuses everyone else. So every row here
 * renders `Protect` twice - once for the case that should pass, once for a case
 * that must not.
 */
export function GatesPanel() {
  const { membership, teams, has, hasPermission } = useOrganization();
  const { user } = useUser();
  const [permissionProbe, setPermissionProbe] = React.useState('org:todos:create');
  const [teamProbe, setTeamProbe] = React.useState('');

  return (
    <Panel
      title="Permission gates"
      subtitle="Protect + has(). Advisory only - the real boundary is server-side over the verified token."
    >
      <h3>Role gates</h3>
      <table className="grid">
        <thead>
          <tr>
            <th>role</th>
            <th>has()</th>
            <th>&lt;Protect role&gt;</th>
          </tr>
        </thead>
        <tbody>
          {ROLE_CASES.map((role) => (
            <tr key={role}>
              <td>
                <code>{role}</code>
              </td>
              <td>
                <Verdict ok={has({ role })} label="has" />
              </td>
              <td>
                <Protect role={role} fallback={<span className="gate gate--closed">blocked</span>}>
                  <span className="gate gate--open">rendered</span>
                </Protect>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Custom permission probe</h3>
      <div className="inline-form">
        <input
          value={permissionProbe}
          onChange={(e) => setPermissionProbe(e.target.value)}
          placeholder="org:feature:action"
          aria-label="Permission id"
        />
      </div>
      <Rows>
        <Row label="hasPermission()">
          <Verdict ok={hasPermission({ permission: permissionProbe })} label={permissionProbe} />
        </Row>
        <Row label="<Protect permission>">
          <Protect
            permission={permissionProbe}
            fallback={<span className="gate gate--closed">blocked</span>}
          >
            <span className="gate gate--open">rendered</span>
          </Protect>
        </Row>
        <Row label="negative control">
          <Protect
            permission="org:definitely:nonexistent"
            fallback={<span className="gate gate--closed">blocked (correct)</span>}
          >
            <span className="gate gate--open">RENDERED - this is a bug</span>
          </Protect>
        </Row>
      </Rows>

      <h3>Every permission on my claim</h3>
      {membership?.permissions?.length ? (
        <table className="grid">
          <thead>
            <tr>
              <th>permission</th>
              <th>hasPermission()</th>
              <th>&lt;Protect&gt;</th>
            </tr>
          </thead>
          <tbody>
            {membership.permissions.map((permission) => (
              <tr key={permission}>
                <td>
                  <code>{permission}</code>
                </td>
                <td>
                  <Verdict ok={hasPermission({ permission })} label="" />
                </td>
                <td>
                  <Protect
                    permission={permission}
                    fallback={<span className="gate gate--closed">blocked - INCONSISTENT</span>}
                  >
                    <span className="gate gate--open">rendered</span>
                  </Protect>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No permissions on the claim to cross-check.</p>
      )}

      <h3>Team gate</h3>
      <div className="inline-form">
        <select value={teamProbe} onChange={(e) => setTeamProbe(e.target.value)} aria-label="Team id">
          <option value="">(none)</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <Rows>
        <Row label="has({ teamId })">
          <Verdict ok={teamProbe ? has({ teamId: teamProbe }) : false} label={teamProbe || 'none'} />
        </Row>
        <Row label="<Protect teamId>">
          <Protect teamId={teamProbe} fallback={<span className="gate gate--closed">blocked</span>}>
            <span className="gate gate--open">rendered</span>
          </Protect>
        </Row>
        <Row label="<Protect condition> - true predicate">
          <Protect
            condition={(u) => Boolean(u.email)}
            fallback={<span className="gate gate--closed">blocked</span>}
          >
            <span className="gate gate--open">rendered</span>
          </Protect>
        </Row>
        <Row label="<Protect condition> - false predicate">
          <Protect
            condition={() => false}
            fallback={<span className="gate gate--closed">blocked (correct)</span>}
          >
            <span className="gate gate--open">RENDERED - this is a bug</span>
          </Protect>
        </Row>
        <Row label="condition sees the signed-in user">
          <code>{user?.email ?? 'none'}</code>
        </Row>
        <Row label="combined role + permission (AND)">
          <Verdict
            ok={has({ role: membership?.role ?? 'member', permission: permissionProbe })}
            label="both must hold"
          />
        </Row>
      </Rows>
    </Panel>
  );
}

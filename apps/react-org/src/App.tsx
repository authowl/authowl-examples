import * as React from 'react';
import {
  OrganizationSwitcher,
  useAuthClient,
  ResetPassword,
  SignIn,
  SignUp,
  UserButton,
  VerifyEmail,
  useOrganization,
  usePublicConfig,
  useUser,
} from '@authowl/react';
import type { Theme } from './theme';
import { CallLogProvider } from './lab/kit';
import { ClaimPanel } from './lab/ClaimPanel';
import { OrgsPanel } from './lab/OrgsPanel';
import { SeatsPanel } from './lab/SeatsPanel';
import { InvitesPanel } from './lab/InvitesPanel';
import { TeamsPanel } from './lab/TeamsPanel';
import { GatesPanel } from './lab/GatesPanel';
import { LogPanel } from './lab/LogPanel';

export function App({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { user, isSignedIn } = useUser();
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/reset-password') {
    return (
      <AuthScreen onToggleTheme={onToggleTheme} theme={theme}>
        <ResetPassword redirectTo="/" />
      </AuthScreen>
    );
  }

  if (path === '/verify-email') {
    return (
      <AuthScreen onToggleTheme={onToggleTheme} theme={theme}>
        <VerifyEmail redirectTo="/" />
      </AuthScreen>
    );
  }

  if (!isSignedIn || !user) {
    return <SignedOutScreen theme={theme} onToggleTheme={onToggleTheme} />;
  }

  return (
    <CallLogProvider>
      <Bench theme={theme} onToggleTheme={onToggleTheme} identity={user.email ?? user.id} />
    </CallLogProvider>
  );
}

function Bench({
  theme,
  onToggleTheme,
  identity,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  identity: string;
}) {
  const { config } = usePublicConfig();
  const { organization, membership } = useOrganization();
  const client = useAuthClient();

  // A bench affordance: the raw client on the console, so a probe can be run
  // against the live session without adding a button for it.
  React.useEffect(() => {
    (window as unknown as { authowl?: unknown }).authowl = client;
  }, [client]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Brand />
          <div className="topbar__actions">
            <OrganizationSwitcher showPersonalWorkspace />
            <button type="button" className="btn" onClick={onToggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="intro">
        <p>
          A working example of <strong>AuthOwl organizations</strong>: multi-tenant membership,
          seats and invitations, teams, and the permission checks a client is allowed to make.
        </p>
        <p>
          Every call goes through one wrapper, so the <strong>transcript at the bottom</strong> is
          the record &mdash; what was asked, and exactly what came back.
        </p>
        <ul className="try">
          <li><b>Try</b> switching the active organization, top right</li>
          <li><b>Try</b> inviting an address, then reading the claim</li>
          <li><b>Try</b> a permission that is not granted</li>
        </ul>
      </div>

      {config && !config.organizations ? (
        <p className="banner">
          This project reports <code>organizations: false</code>. Enable Organizations / teams
          under Configure &rarr; Auth methods, or every panel below will fail.
        </p>
      ) : null}

      <div className="layout">
        <Rail
          identity={identity}
          config={config}
          organization={organization}
          membership={membership}
        />

        <main className="work">
          <Section
            title="Identity"
            note="What the session and a freshly minted token each say about who you are. The claim is a snapshot, not a live read."
          >
            <ClaimPanel />
          </Section>

          <Section
            title="Tenancy"
            note="The organizations you belong to, who else is in them, and how people get in."
          >
            <div className="section__grid">
              <OrgsPanel />
              <TeamsPanel />
              <div className="span-all">
                <SeatsPanel />
              </div>
              <InvitesPanel />
            </div>
          </Section>

          <Section
            title="Authority"
            note="What the client believes you may do. Advisory only: the real boundary is your server, over the verified token."
          >
            <GatesPanel />
          </Section>

          <Section title="Evidence" note="Every organization call this page made, newest first.">
            <LogPanel />
          </Section>
        </main>
      </div>
    </div>
  );
}

function Rail({
  identity,
  config,
  organization,
  membership,
}: {
  identity: string;
  config: ReturnType<typeof usePublicConfig>['config'];
  organization: ReturnType<typeof useOrganization>['organization'];
  membership: ReturnType<typeof useOrganization>['membership'];
}) {
  return (
    <aside className="rail">
      <div className="rail__who">
        <span className="rail__eyebrow">Signed in as</span>
        <span className="rail__id mono">{identity}</span>
      </div>

      <div className="rail__group">
        <h3>Session</h3>
        <dl className="facts">
          <div>
            <dt>Organizations</dt>
            <dd>
              <span className={`pill ${config?.organizations ? 'pill--on' : 'pill--warn'}`}>
                {config ? (config.organizations ? 'enabled' : 'disabled') : '…'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Active org</dt>
            <dd>
              {organization ? (
                <span className="pill pill--brand">{organization.slug}</span>
              ) : (
                <span className="pill pill--off">personal</span>
              )}
            </dd>
          </div>
          <div>
            {/*
              What the project reports as its bot challenge, provider-agnostic.
              The widget itself is invisible and mounts inside the sign-in and
              sign-up forms - so the only visible sign it ran is that you got
              here. `null` means the project has none configured.
            */}
            <dt>Bot challenge</dt>
            <dd>
              {config?.captcha ? (
                <span className="pill pill--on">{config.captcha.provider}</span>
              ) : (
                <span className="pill pill--off">none</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>
              {membership?.role ? (
                <span className="pill pill--on">{membership.role}</span>
              ) : (
                <span className="pill pill--off">none</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rail__group">
        <h3>Permissions on the claim</h3>
        {membership?.permissions?.length ? (
          <ul className="chips">
            {membership.permissions.map((permission) => (
              <li key={permission}>
                <code>{permission}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">None. Advisory only &mdash; your server still verifies.</p>
        )}
      </div>

      <div className="rail__group">
        <h3>Teams on the claim</h3>
        {membership?.teams?.length ? (
          <ul className="chips">
            {membership.teams.map((team) => (
              <li key={team}>
                <code>{team}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">
            None proven. An absent claim means &ldquo;no proven team&rdquo;, not
            &ldquo;provably no team&rdquo;.
          </p>
        )}
      </div>
    </aside>
  );
}

function Brand() {
  return (
    <span className="brand">
      <span className="brand__mark" aria-hidden="true">
        &#9679;
      </span>
      Owl Org <span className="brand__sub">organizations bench</span>
    </span>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        <p className="section__note">{note}</p>
      </div>
      {children}
    </section>
  );
}

function SignedOutScreen({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [mode, setMode] = React.useState<'sign-in' | 'sign-up'>('sign-in');
  const origin = window.location.origin;

  return (
    <AuthScreen theme={theme} onToggleTheme={onToggleTheme}>
      {mode === 'sign-up' ? (
        <SignUp verifyEmailUrl={`${origin}/verify-email`} />
      ) : (
        <SignIn resetPasswordUrl={`${origin}/reset-password`} />
      )}
      <p className="auth__switch">
        <button
          type="button"
          className="text-button"
          onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}
        >
          {mode === 'sign-up' ? 'Sign in instead' : 'Create an account'}
        </button>
      </p>
    </AuthScreen>
  );
}

function AuthScreen({
  theme,
  onToggleTheme,
  children,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__card">
        <div className="auth__head">
          <Brand />
          <button type="button" className="btn" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <p className="auth__lede">
          A working example of AuthOwl organizations &mdash; membership, seats, invitations,
          teams, and permission checks. Sign in to explore it.
        </p>
        {children}
      </div>
    </main>
  );
}

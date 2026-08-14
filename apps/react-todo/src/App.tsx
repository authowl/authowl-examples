import * as React from 'react';
import {
  ResetPassword,
  SignIn,
  SignUp,
  UserButton,
  VerifyEmail,
  useUser,
} from '@authowl/react';
import type { Theme } from './theme';
import { OwlMark, MoonIcon, SunIcon } from './components/icons';
import { TodoApp } from './TodoApp';

type AuthMode = 'sign-in' | 'sign-up';

export function App({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/reset-password') {
    return (
      <AuthScreen theme={theme} onToggleTheme={onToggleTheme}>
        <ResetPassword redirectTo="/" />
      </AuthScreen>
    );
  }

  if (path === '/verify-email') {
    return (
      <AuthScreen theme={theme} onToggleTheme={onToggleTheme}>
        <VerifyEmail redirectTo="/" />
      </AuthScreen>
    );
  }

  if (!isLoaded) {
    return <AppLoading />;
  }

  if (!isSignedIn || !user) {
    return <SignedOutScreen theme={theme} onToggleTheme={onToggleTheme} />;
  }

  const identity = user.email ?? user.phoneNumber ?? user.id;
  const firstName = user.name?.trim().split(/\s+/)[0] ?? identity.split('@')[0] ?? 'there';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <span className="brand">
            <OwlMark size={30} idPrefix="nav" />
            Owl Todo
            <span className="brand__sub">/ React SPA</span>
          </span>
          <div className="topbar__actions">
            <ThemeButton theme={theme} onToggle={onToggleTheme} />
            <UserButton />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <TodoApp key={user.id} userId={user.id} name={firstName} />
          <p className="footnote">
            Signed in as <code>{identity}</code>
            <br />
            This is a browser-only SPA. Todos stay in this browser under a key scoped to your
            AuthOwl user id.
          </p>
        </div>
      </main>
    </div>
  );
}

function AppLoading() {
  return (
    <main className="app-loading" aria-busy="true" aria-label="Loading your account">
      <div className="app-loading__content" role="status">
        <OwlMark size={42} idPrefix="loading" />
        <span>Loading your account...</span>
      </div>
    </main>
  );
}

function SignedOutScreen({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [mode, setMode] = React.useState<AuthMode>('sign-in');
  const origin = window.location.origin;

  return (
    <AuthScreen theme={theme} onToggleTheme={onToggleTheme}>
      {mode === 'sign-up' ? (
        <SignUp verifyEmailUrl={`${origin}/verify-email`} />
      ) : (
        <SignIn resetPasswordUrl={`${origin}/reset-password`} />
      )}
      <p className="auth__switch">
        {mode === 'sign-up' ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" className="text-button" onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}>
          {mode === 'sign-up' ? 'Sign in' : 'Create an account'}
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
      <section className="auth__brand" aria-label="Owl Todo">
        <div className="auth__lockup">
          <OwlMark size={36} idPrefix="auth" />
          Owl Todo <span className="brand__sub">/ React SPA</span>
        </div>
        <div className="auth__pitch">
          <h1>
            Authentication for a <em>real client-only app.</em>
          </h1>
          <p>
            No API server, server actions, or framework middleware. This example shows the
            complete AuthOwl React flow in a Vite single-page application.
          </p>
          <ul className="auth__features">
            <li><CheckIcon /> Drop-in sign-in, sign-up, MFA, and account settings</li>
            <li><CheckIcon /> Session-aware UI with <code>useUser()</code></li>
            <li><CheckIcon /> Per-account local persistence for the demo data</li>
          </ul>
        </div>
        <p className="auth__meta">Browser-only by design. The Next.js example covers server authorization.</p>
      </section>
      <section className="auth__panel">
        <ThemeButton theme={theme} onToggle={onToggleTheme} className="auth__theme" />
        <div className="auth__card">{children}</div>
      </section>
    </main>
  );
}

function ThemeButton({
  theme,
  onToggle,
  className = '',
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`.trim()}
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthOwlProvider } from '@authowl/react';
// Geist is what the AuthOwl dashboard uses. Self-hosted rather than pulled from
// a CDN, so the bench renders the same offline.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@authowl/react/styles.css';
import './styles.css';
import { App } from './App';
import { useThemeToggle } from './theme';

const PUBLISHABLE_KEY = import.meta.env.VITE_AUTHOWL_PUBLISHABLE_KEY as string | undefined;
const API_URL = import.meta.env.VITE_AUTHOWL_API_URL as string | undefined;

function ConfiguredApp() {
  const { theme, toggle } = useThemeToggle();
  return (
    <AuthOwlProvider
      publishableKey={PUBLISHABLE_KEY!}
      apiUrl={API_URL!}
      locale="auto"
      appearance={{ theme }}
    >
      <App theme={theme} onToggleTheme={toggle} />
    </AuthOwlProvider>
  );
}

function SetupNotice() {
  const missing = [
    PUBLISHABLE_KEY ? null : 'VITE_AUTHOWL_PUBLISHABLE_KEY',
    API_URL ? null : 'VITE_AUTHOWL_API_URL',
  ].filter(Boolean);

  return (
    <main className="setup">
      <h1>Owl Org needs configuring</h1>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code> and fill in{' '}
        {missing.map((name) => (
          <code key={name}>{name}</code>
        ))}
        .
      </p>
      <p>
        The project must also have <strong>Organizations / teams</strong> enabled and{' '}
        <code>http://localhost:5175</code> on its allowed origins.
      </p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{PUBLISHABLE_KEY && API_URL ? <ConfiguredApp /> : <SetupNotice />}</StrictMode>,
);

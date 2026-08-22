import * as React from 'react';

/** Structural mirror of the SDK's `AuthActionResult` - every action returns this. */
export type ActionResult<T> = { data: T | null; error: unknown | null };

/* ------------------------------------------------------------------ *
 * Call log
 *
 * Every SDK call in this bench goes through `run`, so the transcript
 * below the panels IS the test evidence: what was called, with what,
 * and exactly what came back.
 * ------------------------------------------------------------------ */

export type CallEntry = {
  id: number;
  at: string;
  label: string;
  status: 'pending' | 'ok' | 'error';
  input?: unknown;
  output?: unknown;
};

type CallLog = {
  entries: CallEntry[];
  clear: () => void;
  run: <T>(
    label: string,
    input: unknown,
    call: () => Promise<ActionResult<T>>,
  ) => Promise<T | null>;
};

const CallLogContext = React.createContext<CallLog | null>(null);

let nextId = 1;

export function CallLogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<CallEntry[]>([]);

  const run = React.useCallback(
    async <T,>(label: string, input: unknown, call: () => Promise<ActionResult<T>>) => {
      const id = nextId++;
      const at = new Date().toLocaleTimeString();
      const started: CallEntry = { id, at, label, status: 'pending', input };
      setEntries((prev) => [started, ...prev].slice(0, 60));

      const settle = (status: 'ok' | 'error', output: unknown) =>
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status, output } : e)));

      try {
        const result = await call();
        if (result.error) {
          settle('error', result.error);
          return null;
        }
        settle('ok', result.data);
        return result.data;
      } catch (error) {
        // A thrown error is itself a finding: these actions are documented to
        // report failure on `result.error`, not by throwing.
        settle('error', {
          thrown: true,
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },
    [],
  );

  const value = React.useMemo(
    () => ({ entries, clear: () => setEntries([]), run }),
    [entries, run],
  );

  return <CallLogContext.Provider value={value}>{children}</CallLogContext.Provider>;
}

export function useCallLog(): CallLog {
  const value = React.useContext(CallLogContext);
  if (!value) throw new Error('useCallLog must be used inside <CallLogProvider>');
  return value;
}

/* ------------------------------------------------------------------ *
 * Presentational bits
 * ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  // Title and actions are stacked rather than opposed. Sharing one row meant a
  // panel with four header buttons squeezed its own title into 77px.
  return (
    <section className="panel">
      <header className="panel__head">
        <div className="panel__titles">
          <h2>{title}</h2>
          {subtitle ? <p className="panel__sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="rows">{children}</dl>;
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

export function Json({ value }: { value: unknown }) {
  return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
}

export function Verdict({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`verdict verdict--${ok ? 'yes' : 'no'}`}>
      {ok ? 'true' : 'false'} <span className="verdict__label">{label}</span>
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}

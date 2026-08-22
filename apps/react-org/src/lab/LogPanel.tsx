import { Empty, Panel, useCallLog } from './kit';

/** The transcript: every SDK call this bench made, newest first. */
export function LogPanel() {
  const { entries, clear } = useCallLog();

  return (
    <Panel
      title="Call transcript"
      subtitle="Every organization call and its raw result."
      actions={
        <button type="button" className="btn" onClick={clear}>
          Clear
        </button>
      }
    >
      {entries.length === 0 ? (
        <Empty>Nothing called yet.</Empty>
      ) : (
        <ol className="log">
          {entries.map((entry) => (
            <li key={entry.id} className={`log__row log__row--${entry.status}`}>
              <div className="log__head">
                <span className="log__status">{entry.status}</span>
                <code>{entry.label}</code>
                <span className="log__time">{entry.at}</span>
              </div>
              {entry.input !== undefined ? (
                <pre className="json json--sm">in: {JSON.stringify(entry.input)}</pre>
              ) : null}
              {entry.output !== undefined ? (
                <pre className="json json--sm">out: {JSON.stringify(entry.output, null, 1)}</pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

import type { SourceHit } from "../lib/api";

type Props = { hits: SourceHit[]; loading?: boolean };

export default function Sources({ hits, loading }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Sources</h3>
        {loading ? <span className="pill">retrieving…</span> : null}
      </div>
      {hits.length === 0 && !loading ? (
        <p className="muted">No sources yet. Ask something above.</p>
      ) : (
        <ul className="source-list">
          {hits.map((h, i) => (
            <li key={i} className="source-card">
              <div className="source-meta">
                <span className="pill">score {h.score?.toFixed(3)}</span>
                {h.source ? <span className="muted">• {h.source}</span> : null}
              </div>
              <p className="source-text">{h.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

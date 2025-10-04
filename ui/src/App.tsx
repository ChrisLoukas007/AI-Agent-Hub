import { useState } from "react";
import Chat from "./components/Chat";
import Sources from "./components/Sources";
import type { SourceHit } from "./lib/api";

export default function App() {
  const [hits, setHits] = useState<SourceHit[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  return (
    <div className="page">
      <header className="topbar">
        <h1>AI Agent Hub</h1>
        <span className="muted">RAG + Streaming</span>
      </header>

      <main className="grid">
        <div className="col">
          <Chat
            onSources={(h, loading) => {
              setHits(h);
              setLoadingSources(loading);
            }}
          />
        </div>
        <aside className="col narrow">
          <Sources hits={hits} loading={loadingSources} />
        </aside>
      </main>

      <footer className="footer">
        <span className="muted">
          API:{" "}
          <code>
            {import.meta.env.VITE_API_BASE || "http://localhost:8000"}
          </code>
        </span>
      </footer>
    </div>
  );
}

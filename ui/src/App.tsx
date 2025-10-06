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

      <main className="stack">
        <section className="col">
          <Chat
            onSources={(h, loading) => {
              setHits(h);
              setLoadingSources(loading);
            }}
          />
          <div className="below">
            <Sources hits={hits} loading={loadingSources} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="muted">
          Created by ChrisLoukas 007 &nbsp;
          <a
            href="https://github.com/ChrisLoukas007/AI-Agent-Hub"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0070f3", textDecoration: "underline" }}
          >
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

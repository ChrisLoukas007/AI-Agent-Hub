import React, { useEffect, useRef, useState } from "react";
import { retrieve, streamChat, type SourceHit } from "../lib/api";
import IngestHint from "./IngestHint";

type Props = {
  onSources: (hits: SourceHit[], loading: boolean) => void;
};

// remove “curl … /ingest …” code snippets and signal we should show the hint
function sanitizeAnswer(raw: string): { clean: string; showHint: boolean } {
  let show = false;
  let out = raw;

  // remove backticked code that contains 'curl' and '/ingest'
  const codeBlock = /```[\s\S]*?```/g; // triple backtick blocks
  out = out.replace(codeBlock, (block) => {
    if (/curl[\s\S]*\/ingest/i.test(block)) {
      show = true;
      return "";
    }
    return block;
  });

  const inlineCode = /`[^`]*`/g; // single backticks
  out = out.replace(inlineCode, (seg) => {
    if (/curl[\s\S]*\/ingest/i.test(seg)) {
      show = true;
      return "";
    }
    return seg;
  });

  // also remove the leading sentence that introduces that command
  out = out.replace(/To ingest a folder[,:\s]+[^.]*\./i, (m) => {
    show = true;
    return "";
  });

  // collapse double spaces that may result from removals
  out = out.replace(/\s{2,}/g, " ").trim();

  return { clean: out, showHint: show };
}

export default function Chat({ onSources }: Props) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [showIngestHint, setShowIngestHint] = useState(false);
  const [loading, setLoading] = useState<"idle" | "retrieving" | "streaming">(
    "idle"
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = document.getElementById("answer");
    if (el) el.scrollTop = el.scrollHeight;
  }, [answer, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;

    setAnswer("");
    setShowIngestHint(false);
    setLatencyMs(null);
    setLoading("retrieving");
    onSources([], true);

    const t0 = performance.now();
    let hits: SourceHit[] = [];
    try {
      hits = await retrieve(q, 4);
    } catch {
    } finally {
      onSources(hits, false);
      setLoading("streaming");
    }

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      for await (const tok of streamChat(q, 4)) {
        setAnswer((prev) => {
          const next = prev + tok;
          const { clean, showHint } = sanitizeAnswer(next);
          if (showHint) setShowIngestHint(true);
          return clean; // keep the cleaned text in state
        });
      }
      setLatencyMs(Math.round(performance.now() - t0));
    } catch {
      setAnswer((prev) =>
        prev ? prev + "\n\n[stream ended]" : "Error streaming."
      );
    } finally {
      setLoading("idle");
    }
  }

  function onStop() {
    controllerRef.current?.abort();
    setLoading("idle");
  }
  function onCopy() {
    navigator.clipboard.writeText(answer).catch(() => {});
  }

  const display =
    answer || (loading !== "idle" ? "…" : "Ask a question to get started.");

  return (
    <section className="panel">
      <form className="row" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Ask something…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading !== "idle"}>
          {loading === "idle" ? "Ask" : "Working…"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={onStop}
          disabled={loading === "idle"}
        >
          Stop
        </button>
      </form>

      <div className="answer-wrap">
        <div className="answer-header">
          <h3>Answer</h3>
          <div className="answer-tools">
            {latencyMs !== null ? (
              <span className="pill">{latencyMs} ms</span>
            ) : null}
            <button className="link" onClick={onCopy} disabled={!answer}>
              Copy
            </button>
          </div>
        </div>
        <pre id="answer" className="answer">
          {display}
        </pre>
      </div>

      {showIngestHint && (
        <IngestHint onClose={() => setShowIngestHint(false)} />
      )}
    </section>
  );
}

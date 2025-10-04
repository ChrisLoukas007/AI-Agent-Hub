import React, { useEffect, useRef, useState } from "react";
import { retrieve, streamChat, type SourceHit } from "../lib/api";

type Props = {
  onSources: (hits: SourceHit[], loading: boolean) => void;
};

export default function Chat({ onSources }: Props) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<"idle" | "retrieving" | "streaming">(
    "idle"
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // auto-scroll the answer panel while streaming
    const el = document.getElementById("answer");
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [answer, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;

    setAnswer("");
    setLatencyMs(null);
    setLoading("retrieving");
    onSources([], true);

    const t0 = performance.now();

    // 1) prefetch sources (fast) to display alongside streaming
    let hits: SourceHit[] = [];
    try {
      hits = await retrieve(q, 4);
    } catch (err) {
      // ignore; still stream the answer
    } finally {
      onSources(hits, false);
      setLoading("streaming");
    }

    // 2) stream the model answer
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      for await (const tok of streamChat(q, 4)) {
        setAnswer((prev) => prev + tok);
      }
      setLatencyMs(Math.round(performance.now() - t0));
    } catch (err) {
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
          title="Stop streaming"
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
          {answer ||
            (loading !== "idle" ? "…" : "Ask a question to get started.")}
        </pre>
      </div>
    </section>
  );
}

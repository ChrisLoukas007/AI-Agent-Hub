const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export type SourceHit = { text: string; score: number; source?: string };

export async function retrieve(q: string, topK = 4): Promise<SourceHit[]> {
  const r = await fetch(`${API_BASE}/retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q, top_k: topK }),
  });
  if (!r.ok) throw new Error(`/retrieve failed: ${r.status}`);
  const data = await r.json();
  return (data.hits ?? []).map((h: any) => ({
    text: h.text,
    score: h.score,
    source: h.source,
  }));
}

/**
 * Streams tokens from POST /chat which returns text/event-stream.
 * The server sends lines like: "data: {json}\n\n"
 * Each JSON is a ChatChunk: { token: string, done?: boolean }
 */
export async function* streamChat(q: string, topK = 4): AsyncGenerator<string> {
  const r = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream", // <-- helps some proxies
    },
    body: JSON.stringify({ q, top_k: topK }),
  });
  if (!r.ok || !r.body) throw new Error(`/chat failed: ${r.status}`);

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  // Parse one SSE frame (between blank lines)
  const parseFrame = (frame: string) => {
    // Ignore comments/heartbeats (lines starting with ":")
    const lines = frame
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith(":"));

    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        // Multiple data lines are concatenated with \n per SSE spec
        data += (data ? "\n" : "") + line.slice(5).trim();
      }
    }
    return { event, data };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // Split on blank line delimiter between events
    const frames = buf.split(/\r?\n\r?\n/);
    buf = frames.pop() || ""; // keep partial event in buffer

    for (const f of frames) {
      const { event, data } = parseFrame(f);
      if (!data) continue;

      // Your server sends JSON: {"token":"...","done":false}
      let payload: any;
      try {
        payload = JSON.parse(data);
      } catch {
        // Fallback if someone sends plain text
        payload = { token: data };
      }

      if (event === "token" || typeof payload.token === "string") {
        yield payload.token as string;
      }
      if (event === "done" || payload.done === true) {
        return;
      }
    }
  }

  // Optional: flush any trailing partial (rare)
  if (buf) {
    const { event, data } = parseFrame(buf);
    if (data) {
      try {
        const payload = JSON.parse(data);
        if (event === "token" && payload?.token) yield payload.token;
      } catch {}
    }
  }
}

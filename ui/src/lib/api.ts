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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q, top_k: topK }),
  });
  if (!r.ok || !r.body) throw new Error(`/chat failed: ${r.status}`);

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // Split on SSE event delimiters
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";

    for (const part of parts) {
      // Expect "data: {json}"
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const chunk = JSON.parse(jsonStr);
        if (chunk?.token) yield chunk.token as string;
        if (chunk?.done) return;
      } catch {
        // ignore parse glitches
      }
    }
  }

  // flush remainder if any (usually empty)
  if (buf.length) {
    const line = buf.split("\n").find((l) => l.startsWith("data:"));
    if (line) {
      try {
        const chunk = JSON.parse(line.slice(5).trim());
        if (chunk?.token) yield chunk.token as string;
      } catch {}
    }
  }
}

import json

import httpx

from .config import settings


async def stream_llm(prompt: str):
    url = f"{settings.ollama_host}/api/generate"

    payload = {
        "model": settings.llm_model,  # which model to run
        "prompt": prompt,  # the full prompt (with any RAG context)
        "stream": True,  # tell Ollama to stream JSON lines
    }

    # Reasonable timeouts: total/connect/write/read
    timeout = httpx.Timeout(60.0, read=60.0)

    # Create a single async client for this request
    async with (
        httpx.AsyncClient(timeout=timeout) as client,
        client.stream("POST", url, json=payload) as r,  # Open a streaming POST request
    ):
        async for line in r.aiter_lines():  # Iterate over lines as Ollama sends them
            if not line:
                continue
            try:
                data = json.loads(line)  # Each line is a JSON object
            except Exception:
                # If a line isn't valid JSON, ignore and keep going
                continue

            # When present, 'response' carries the next chunk of text
            if "response" in data:
                yield data["response"]

            # Ollama signals completion with {"done": true}
            if data.get("done"):
                break

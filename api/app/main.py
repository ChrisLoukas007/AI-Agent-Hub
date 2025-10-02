# Import AsyncGenerator type for async streaming functions
from collections.abc import AsyncGenerator

# Import sleep to simulate delays (for mock streaming)
from time import sleep

# FastAPI is the main web framework for building the API
from fastapi import FastAPI

# JSONResponse is used to return JSON error responses
from fastapi.responses import JSONResponse

# EventSourceResponse enables Server-Sent Events (SSE) for streaming data to client
from sse_starlette.sse import EventSourceResponse

# Import our configuration settings (ports, model names, etc.)
from .config import settings

# Import our data models (ChatChunk, ChatRequest) for request/response validation
from .models.schemas import ChatChunk, ChatRequest

app = FastAPI(title="AI Agent Hub API", version="0.1.0")


# Health check endpoint - used to verify the API is running
@app.get("/health")
def health():
    return {"ok": True, "model": settings.llm_model}


# Mock function to simulate streaming tokens word-by-word
def _mock_stream_tokens(text: str):
    for w in text.split():
        yield w + " "
        sleep(0.03)


# SSE generator that converts tokens into ChatChunk objects and streams them
async def _sse_generator(prompt: str) -> AsyncGenerator[str, None]:
    # For each token from the mock stream
    for tok in _mock_stream_tokens(f"Echo: {prompt}"):
        # Convert ChatChunk to JSON and yield it (send to client)
        yield ChatChunk(token=tok).model_dump_json()

    # Signal that streaming is complete by sending final chunk with done=True
    yield ChatChunk(token="", done=True).model_dump_json()


# Chat endpoint - receives user questions and streams back responses
@app.post("/chat")
async def chat(req: ChatRequest):
    # req.q is the user's question from ChatRequest model
    # EventSourceResponse wraps the generator to enable SSE streaming
    # media_type tells the browser this is a Server-Sent Events stream
    return EventSourceResponse(_sse_generator(req.q), media_type="text/event-stream")


# Global exception handler - catches any unhandled errors in the API
@app.exception_handler(Exception)
async def unhandled(_, exc: Exception):
    # Return a 500 error with the exception message as JSON
    # The underscore (_) ignores the request parameter we don't need
    return JSONResponse(status_code=500, content={"error": str(exc)})

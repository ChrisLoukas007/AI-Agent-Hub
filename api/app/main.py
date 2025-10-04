# FastAPI is the main web framework for building the API

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# JSONResponse is used to return JSON error responses
from fastapi.responses import RedirectResponse

# EventSourceResponse enables Server-Sent Events (SSE) for streaming data to client
from sse_starlette.sse import EventSourceResponse

# Import our configuration settings (ports, model names, etc.)
from .config import settings
from .deps import stream_llm

# Import our data models (ChatChunk, ChatRequest) for request/response validation
from .models.schemas import ChatChunk, ChatRequest, IngestRequest
from .rag.ingest import ingest_path
from .rag.search import query_similarity

# Create the FastAPI app instance
app = FastAPI(title="AI Agent Hub API", version="0.1.0")

# Set up CORS middleware to allow cross-origin requests (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Build the prompt for the LLM using the question and retrieved context
def build_prompt(q: str, ctx: list[dict]) -> str:
    context_block = "\n\n".join([f"- {c['text']}" for c in ctx])
    return f"""You are a precise assistant. Answer ONLY using the Context below. 
If the answer isn't in the Context, say "I don’t have enough information."

Context:
{context_block}

Question: {q}
Answer:"""


@app.get("/", include_in_schema=False)
def root():
    # Send people to the interactive docs
    return RedirectResponse(url="/docs")


# Health check endpoint
@app.get("/health")
def health():
    return {"ok": True, "model": settings.llm_model}


# Internal function to handle the chat logic and stream responses
async def _llm_sse(q: str, top_k: int):
    # 1) Retrieve relevant context from vector DB
    ctx = query_similarity(q, top_k=top_k or 4)
    # 2) Build the full prompt with context + question
    prompt = build_prompt(q, ctx)
    # 3) Stream the LLM response back to the client
    async for tok in stream_llm(prompt):
        yield ChatChunk(token=tok).model_dump_json()
    # 4) Send a final "done" message to tell the client the stream is complete
    yield ChatChunk(token="", done=True).model_dump_json()


# Chat endpoint - receives user questions and streams back responses
@app.post("/chat")
async def chat(req: ChatRequest):
    # req.q is the user's question from ChatRequest model
    # EventSourceResponse wraps the generator to enable SSE streaming
    # media_type tells the browser this is a Server-Sent Events stream
    return EventSourceResponse(_llm_sse(req.q, req.top_k or 4), media_type="text/event-stream")


# Ingest endpoint - accepts a directory path or URL to ingest data from
@app.post("/ingest")
def ingest(req: IngestRequest):
    if not req.path and not req.url:
        return {"ingested": 0, "detail": "provide path or url"}
    if req.path:
        n = ingest_path(req.path)
        return {"ingested": n}
    # URL handling omitted for brevity
    return {"ingested": 0}


# quick retrieval helper (useful during dev)
@app.post("/retrieve")
def retrieve(req: ChatRequest):
    hits = query_similarity(req.q, top_k=req.top_k or 4)
    return {"hits": hits}

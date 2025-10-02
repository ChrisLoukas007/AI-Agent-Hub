from pydantic import BaseModel

# defines the shape of data that my API will receive and send.

# What the user sends to ask a question
class ChatRequest(BaseModel):
    q: str                      # Question (required, must be text)
    top_k: int | None = 4       # How many results to return (optional, default is 4)

# What my API sends back (for streaming responses)
class ChatChunk(BaseModel):
    token: str                  # A piece of text (one word or part of answer)
    done: bool = False          # Is this the last piece? (default: no)

# What the user sends to add documents to your database
class IngestRequest(BaseModel):
    path: str | None = None         # File path (optional)
    url: str | None = None          # Web URL (optional)
    collection: str | None = None   # Which database collection (optional)

# Import Qdrant client and models for vector database operations
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

# Import our app settings (database URL, collection name, etc.)
from ..config import settings

# Import function to convert text into embeddings (vectors)
from .embed import embed_texts


# Create and return a Qdrant client connected to our vector database
def get_client() -> QdrantClient:
    return QdrantClient(url=settings.vector_db_url)


# Make sure our collection exists in Qdrant, create it if it doesn't
def ensure_collection(dim: int = 384):
    client = get_client()

    # Get list of all existing collection names
    collections = [c.name for c in client.get_collections().collections]

    # If our collection doesn't exist yet, create it
    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            # Configure vectors: 384 dimensions, use cosine similarity for comparison
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )


# Store Vectors in Qdrant - Add or update data to the collection (inserting points)
def upsert_texts(texts: list[str], metas: list[dict] | None = None):
    # Make sure collection exists before adding data
    ensure_collection()
    client = get_client()

    # Convert all texts into embeddings (numerical vectors)
    vectors = embed_texts(texts)

    points = []
    # For each vector, create a point with text and optional metadata
    for i, vec in enumerate(vectors):
        # Start with the text itself
        payload = {"text": texts[i]}

        # Add any extra metadata if provided
        if metas and i < len(metas):
            payload.update(metas[i])

        # Create a point (Every point will have a unique string ID.)
        points.append(PointStruct(id=str(uuid.uuid4()), vector=vec, payload=payload))

    # Insert or update all points in the collection
    client.upsert(collection_name=settings.qdrant_collection, points=points)


# Turns the query text into a vector, asks Qdrant for the top-k nearest vectors,
# and returns their stored text + similarity score
def query_similarity(q: str, top_k: int = 4):
    ensure_collection()
    client = get_client()

    # Convert query text into an embedding vector
    qvec = embed_texts([q])[0]

    # Search for the top_k most similar vectors
    res = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=qvec,
        limit=top_k,  # How many results to return
        with_payload=True,  # Include the stored text and metadata
    )

    # Return results as a list of dictionaries with text and similarity score
    return [{"text": (r.payload or {}).get("text", ""), "score": r.score} for r in res]

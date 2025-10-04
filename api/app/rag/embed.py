# Turns texts into embedding vectors using a pre-trained model
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)  # Cache the model to avoid reloading on every call
def _model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def embed_texts(texts: list[str]) -> list[list[float]]:  # Embeds a list of texts into vectors
    embs = _model().encode(texts, normalize_embeddings=True)
    return np.asarray(embs).tolist()  # Convert to list of lists for JSON serialization

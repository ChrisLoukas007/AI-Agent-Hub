from pathlib import Path

from .search import upsert_texts


# Read all .txt files from a directory (and its subdirectories) and return their contents
# as a list of strings
def read_texts_from_path(path: str) -> list[str]:
    p = Path(path)
    texts = []
    for file in p.glob("**/*.txt"):
        texts.append(file.read_text(encoding="utf-8", errors="ignore"))
    return texts


# Ingest all .txt files from a directory into the vector database
def ingest_path(path: str):
    texts = read_texts_from_path(path)
    if not texts:
        return 0
    upsert_texts(texts, metas=[{"source": "file"} for _ in texts])
    return len(texts)

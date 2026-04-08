#!/usr/bin/env python3
"""Start ChromaDB server on localhost:8000, pre-creating the collection so the
server never needs to instantiate DefaultEmbeddingFunction (which downloads ONNX)."""
import uvicorn
from chromadb.server.fastapi import FastAPI
from chromadb.config import Settings
import chromadb

COLLECTION_NAME = "knowledge_base"
PERSIST_DIR = "./chromadb_data"

# Pre-create the collection via PersistentClient with no embedding function,
# so the FastAPI server finds it already exists and doesn't trigger
# DefaultEmbeddingFunction → ONNX download on first query.
_client = chromadb.PersistentClient(path=PERSIST_DIR)
try:
    coll = _client.get_collection(name=COLLECTION_NAME)
    print(f"Using existing collection '{COLLECTION_NAME}'")
except Exception:
    # embedding_function=None → collection has no server-side EF;
    # the JS client provides pre-computed MiniMax embeddings anyway.
    coll = _client.create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "IT Helpdesk Knowledge Base"},
        embedding_function=None,  # type: ignore[arg-type]
    )
    print(f"Created collection '{COLLECTION_NAME}' (no server-side embedding function)")

chroma = FastAPI(
    settings=Settings(
        chroma_server_http_port=8000,
        is_persistent=True,
        persist_directory=PERSIST_DIR,
        chroma_server_cors_allow_origins=["*"],
    )
)

if __name__ == "__main__":
    uvicorn.run(chroma._app, host="localhost", port=8000, log_level="warning")

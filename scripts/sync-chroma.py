#!/usr/bin/env python3
"""
Sync knowledge base chunks to ChromaDB using Ollama embeddings
Phase 1: Smart document chunking from OKO/*.md files

Features:
- Reads markdown files from OKO/ directory
- Chunks by ## headers (each ## section = one chunk)
- Adds metadata (title, doc_name, tags, chunk_index)
- Generates embeddings using Ollama nomic-embed-text
"""

import os
import re
import json
import httpx
from pathlib import Path
from typing import List, Dict, Tuple

# Config
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = os.getenv("CHROMA_PORT", "8000")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
TENANT = "default_tenant"
DATABASE = "default_database"
COLLECTION_NAME = "knowledge_base"
OKO_DIR = os.path.join(os.path.dirname(__file__), "..", "OKO")

# Chunking config
CHUNK_OVERLAP = 150  # Characters overlap between chunks
MIN_CHUNK_SIZE = 200  # Minimum chunk size in characters
MAX_CHUNK_SIZE = 1500  # Maximum chunk size in characters


def get_embedding(text: str) -> list:
    """Generate embedding using Ollama API and normalize"""
    response = httpx.post(
        f"{OLLAMA_HOST}/api/embeddings",
        json={
            "model": EMBEDDING_MODEL,
            "prompt": text
        },
        timeout=60.0
    )
    response.raise_for_status()
    data = response.json()
    embedding = data["embedding"]
    
    # Normalize the embedding (L2 norm)
    import math
    magnitude = math.sqrt(sum(x * x for x in embedding))
    if magnitude > 0:
        embedding = [x / magnitude for x in embedding]
    
    return embedding


def delete_collection(client: httpx.Client, name: str):
    """Delete existing collection"""
    try:
        response = client.get(
            f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections/{name}"
        )
        if response.status_code == 200:
            collection_id = response.json()["id"]
            client.delete(
                f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections/{name}"
            )
            print(f"Deleted old collection: {collection_id}")
    except Exception as e:
        print(f"Note: Could not delete collection: {e}")


def create_collection(client: httpx.Client, name: str) -> str:
    """Create new collection and return ID"""
    response = client.post(
        f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections",
        json={
            "name": name,
            "metadata": {"description": "IT Helpdesk Knowledge Base - Smart Chunked"}
        }
    )
    response.raise_for_status()
    return response.json()["id"]


def extract_title_from_content(content: str) -> str:
    """Extract a short title from chunk content"""
    # Remove markdown syntax
    text = re.sub(r'[#*`\[\]()]', '', content)
    # Take first 50 chars
    title = text.strip()[:50]
    return title + "..." if len(text) > 50 else title


def chunk_markdown_by_headers(content: str, doc_name: str) -> List[Dict]:
    """
    Split markdown content by ## headers into chunks.
    Each ## section becomes a chunk with metadata.
    """
    chunks = []
    
    # Split by ## headers (keep the header as part of chunk)
    sections = re.split(r'(?=##\s)', content)
    
    current_chunk = ""
    current_header = ""
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        # Check if this is a header section
        header_match = re.match(r'^(#{2,3})\s+(.+?)(?:\n|$)', section)
        
        if header_match:
            # Save previous chunk if exists
            if current_chunk.strip():
                chunks.append({
                    "content": current_chunk.strip(),
                    "header": current_header,
                })
            
            # Start new chunk with this header
            current_header = header_match.group(2).strip()
            current_chunk = section
        else:
            # Continuation of previous section
            # Add overlap from end of current_chunk
            if current_chunk and len(current_chunk) > CHUNK_OVERLAP:
                overlap_text = current_chunk[-CHUNK_OVERLAP:]
                # Don't start in the middle of a word
                if overlap_text and not overlap_text[0].isspace():
                    # Find next space
                    space_idx = overlap_text.find(' ')
                    if space_idx > 0:
                        overlap_text = overlap_text[space_idx+1:]
                current_chunk = overlap_text + "\n\n" + section
            else:
                current_chunk += "\n\n" + section
    
    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "header": current_header,
        })
    
    return chunks


def refine_chunk(chunk: str, max_size: int = MAX_CHUNK_SIZE) -> List[str]:
    """
    If chunk is too large, split by subsections (### or numbered lists)
    """
    if len(chunk) <= max_size:
        return [chunk]
    
    sub_chunks = []
    
    # Try to split by ### headers first
    if '### ' in chunk:
        parts = re.split(r'(?=###\s)', chunk)
        for part in parts:
            if len(part) <= max_size:
                sub_chunks.append(part.strip())
            else:
                # Split by numbered lists
                sub_chunks.extend(refine_by_numbers(part, max_size))
    else:
        # Split by numbered lists (1. 2. or 1) 2))
        sub_chunks.extend(refine_by_numbers(chunk, max_size))
    
    # Filter out too-small chunks and merge if needed
    result = []
    for sc in sub_chunks:
        sc = sc.strip()
        if not sc:
            continue
        if len(sc) < MIN_CHUNK_SIZE and result:
            # Merge with previous
            result[-1] += "\n\n" + sc
        else:
            result.append(sc)
    
    return result


def refine_by_numbers(text: str, max_size: int) -> List[str]:
    """Split large chunk by numbered list items"""
    # Match patterns like "1. ", "1、", "(1)", "①"
    pattern = r'(?=\(?[①②③④⑤⑥⑦⑧⑨⑩]?\s*\d+[.)、])'
    
    parts = re.split(pattern, text)
    chunks = []
    current = ""
    
    for part in parts:
        if len(current) + len(part) <= max_size:
            current += part
        else:
            if current.strip():
                chunks.append(current.strip())
            current = part
    
    if current.strip():
        chunks.append(current.strip())
    
    return chunks


def process_document(doc_path: Path) -> List[Dict]:
    """Process a single markdown document and return chunks"""
    print(f"\n📄 Processing: {doc_path.name}")
    
    with open(doc_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract metadata from filename
    doc_name = doc_path.stem  # filename without extension
    
    # Extract tags from doc_name
    tags = []
    if '账号' in doc_name or '密码' in doc_name:
        tags.append('账号权限')
    if '网络' in doc_name:
        tags.append('网络问题')
    if '打印' in doc_name:
        tags.append('打印机')
    if '软件' in doc_name:
        tags.append('软件安装')
    if '信息' in doc_name or '安全' in doc_name:
        tags.append('信息安全')
    if '入职' in doc_name or '离职' in doc_name:
        tags.append('入职离职')
    
    # Chunk by ## headers
    raw_chunks = chunk_markdown_by_headers(content, doc_name)
    print(f"   Found {len(raw_chunks)} sections")
    
    # Refine chunks (split oversized ones)
    all_chunks = []
    for chunk in raw_chunks:
        refined = refine_chunk(chunk['content'])
        for r in refined:
            r = r.strip()
            if len(r) >= MIN_CHUNK_SIZE:
                all_chunks.append({
                    "content": r,
                    "header": chunk['header'],
                    "doc_name": doc_name,
                    "tags": tags,
                })
    
    print(f"   Created {len(all_chunks)} chunks (size: {MIN_CHUNK_SIZE}-{MAX_CHUNK_SIZE} chars)")
    
    return all_chunks


def load_oko_documents() -> List[Dict]:
    """Load and chunk all markdown documents from OKO directory"""
    oko_path = Path(OKO_DIR)
    
    if not oko_path.exists():
        print(f"❌ OKO directory not found: {OKO_DIR}")
        return []
    
    all_chunks = []
    chunk_id = 0
    
    # Find all .md files, excluding index file
    md_files = sorted(oko_path.glob("*.md"))
    
    print(f"\n📚 Found {len(md_files)} markdown files in {OKO_DIR}")
    
    for md_file in md_files:
        # Skip index files
        if '说明' in md_file.name or '索引' in md_file.name or 'README' in md_file.name:
            print(f"⏭️  Skipping index: {md_file.name}")
            continue
        
        chunks = process_document(md_file)
        
        for i, chunk in enumerate(chunks):
            chunk_id += 1
            all_chunks.append({
                "id": f"oko-chunk-{chunk_id:04d}",
                "content": chunk["content"],
                "metadata": {
                    "doc_name": chunk["doc_name"],
                    "header": chunk.get("header", ""),
                    "tags": chunk.get("tags", []),
                    "chunk_index": i,
                    "source": "OKO",
                }
            })
    
    return all_chunks


def add_chunks_to_chroma(client: httpx.Client, collection_id: str, chunks: List[Dict]):
    """Add chunks to ChromaDB with metadata"""
    print(f"\n📊 Generating embeddings for {len(chunks)} chunks...")
    
    batch_size = 10  # Embed in batches
    
    for batch_start in range(0, len(chunks), batch_size):
        batch_end = min(batch_start + batch_size, len(chunks))
        batch = chunks[batch_start:batch_end]
        
        ids = []
        embeddings = []
        documents = []
        metadatas = []
        
        for chunk in batch:
            print(f"   Embedding [{batch_start + len(ids) + 1}/{len(chunks)}]: {chunk['id']}")
            
            # Generate embedding
            embedding = get_embedding(chunk["content"])
            
            ids.append(chunk["id"])
            embeddings.append(embedding)
            documents.append(chunk["content"])
            metadatas.append(chunk["metadata"])
        
        # Add batch to ChromaDB
        print(f"   Adding batch {batch_start//batch_size + 1} to ChromaDB...")
        
        response = client.post(
            f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections/{collection_id}/add",
            json={
                "ids": ids,
                "embeddings": embeddings,
                "documents": documents,
                "metadatas": metadatas
            }
        )
        
        if response.status_code != 200:
            print(f"   Error adding batch: {response.text}")
            response.raise_for_status()
    
    print(f"✅ Successfully added all {len(chunks)} chunks!")


def query_demo(client: httpx.Client, collection_id: str):
    """Demo queries to verify setup"""
    print("\n" + "="*60)
    print("🧪 Testing queries...")
    print("="*60)
    
    test_queries = [
        "电脑蓝屏怎么办",
        "打印机卡纸怎么处理",
        "如何申请账号权限",
        "网络连不上怎么排查",
        "密码忘记了怎么办",
    ]
    
    for query_text in test_queries:
        print(f"\n🔍 Query: '{query_text}'")
        
        try:
            query_embedding = get_embedding(query_text)
            
            response = client.post(
                f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections/{collection_id}/query",
                json={
                    "query_embeddings": [query_embedding],
                    "n_results": 3,
                    "include": ["documents", "distances", "metadatas"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                docs = data.get('documents', [[]])[0]
                dists = data.get('distances', [[]])[0]
                metas = data.get('metadatas', [[]])[0]
                
                print(f"   Found {len(docs)} results:")
                for i, (doc, dist, meta) in enumerate(zip(docs, dists, metas)):
                    similarity = max(0, 1 - dist)  # Convert distance to similarity
                    header = meta.get('header', 'N/A')
                    doc_name = meta.get('doc_name', 'N/A')
                    print(f"   {i+1}. [{similarity:.0%}] {header}")
                    print(f"      Doc: {doc_name}")
                    print(f"      Preview: {doc[:80].replace(chr(10), ' ')}...")
            else:
                print(f"   Query failed: {response.text}")
        except Exception as e:
            print(f"   Error: {e}")


def print_stats(chunks: List[Dict]):
    """Print statistics about the chunks"""
    print("\n" + "="*60)
    print("📊 Chunk Statistics")
    print("="*60)
    
    total_chars = sum(len(c["content"]) for c in chunks)
    avg_chars = total_chars // len(chunks) if chunks else 0
    
    # Count by doc
    doc_counts = {}
    for c in chunks:
        doc_name = c["metadata"].get("doc_name", "unknown")
        doc_counts[doc_name] = doc_counts.get(doc_name, 0) + 1
    
    print(f"\nTotal chunks: {len(chunks)}")
    print(f"Average chunk size: {avg_chars} characters")
    print(f"Size range: {MIN_CHUNK_SIZE} - {MAX_CHUNK_SIZE} characters")
    
    print(f"\nChunks by document:")
    for doc_name, count in sorted(doc_counts.items()):
        print(f"  • {doc_name}: {count} chunks")
    
    # All tags
    all_tags = set()
    for c in chunks:
        all_tags.update(c["metadata"].get("tags", []))
    
    print(f"\nTags covered: {', '.join(sorted(all_tags))}")


def main():
    print("="*60)
    print("ChromaDB Knowledge Base Sync - Phase 1")
    print("Smart Document Chunking from OKO/*.md")
    print("="*60)
    print(f"\nConfig:")
    print(f"  Ollama: {OLLAMA_HOST}")
    print(f"  Embedding Model: {EMBEDDING_MODEL}")
    print(f"  Chunk Size: {MIN_CHUNK_SIZE}-{MAX_CHUNK_SIZE} chars")
    print(f"  Overlap: {CHUNK_OVERLAP} chars")
    print(f"  OKO Directory: {OKO_DIR}")
    
    # Load and chunk documents
    print("\n" + "="*60)
    print("📖 Loading documents...")
    print("="*60)
    
    chunks = load_oko_documents()
    
    if not chunks:
        print("\n❌ No chunks generated. Please check OKO directory.")
        return
    
    print_stats(chunks)
    
    # Connect to ChromaDB
    with httpx.Client(timeout=60.0) as client:
        # Delete old collection
        print("\n" + "="*60)
        print("🗑️  Cleaning up old collection...")
        print("="*60)
        delete_collection(client, COLLECTION_NAME)
        
        # Create new collection
        print("\n" + "="*60)
        print(f"📁 Creating new collection '{COLLECTION_NAME}'...")
        print("="*60)
        collection_id = create_collection(client, COLLECTION_NAME)
        print(f"   Collection ID: {collection_id}")
        
        # Add chunks
        print("\n" + "="*60)
        print("⬆️  Adding chunks to ChromaDB...")
        print("="*60)
        add_chunks_to_chroma(client, collection_id, chunks)
        
        # Test queries
        query_demo(client, collection_id)
    
    print("\n" + "="*60)
    print("✅ Sync completed successfully!")
    print("="*60)
    print(f"\n💡 To use in RAG pipeline, query collection '{COLLECTION_NAME}'")


if __name__ == "__main__":
    main()

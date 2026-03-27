#!/usr/bin/env python3
"""Sync knowledge base chunks to ChromaDB using Ollama embeddings"""

import os
import sys
import json
import httpx

# Config
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = os.getenv("CHROMA_PORT", "8000")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
TENANT = "default_tenant"
DATABASE = "default_database"
COLLECTION_NAME = "knowledge_base"

# Knowledge base chunks (from seed data)
CHUNKS = [
    {
        "id": "doc-chunk-0",
        "content": """电脑蓝屏问题的解决方法：

1. 首先记录蓝屏错误代码（通常是 0x000000xx 格式）
2. 重启电脑，进入安全模式（开机时按 F8）
3. 检查最近是否安装了新软件或驱动
4. 如果有，请卸载后重新安装稳定版本驱动
5. 运行 Windows 内存诊断工具检查 RAM
6. 检查硬盘健康状态（使用 CrystalDiskInfo）"""
    },
    {
        "id": "doc-chunk-1", 
        "content": """网络连接不上的排查步骤：

1. 检查网线是否插好，或 WiFi 是否连接
2. 重启路由器和电脑
3. 检查网络适配器是否启用
4. 运行 ipconfig /release 和 ipconfig /renew 刷新 IP
5. 检查是否可以 ping 通网关
6. 如仍无法解决，联系 IT 部门"""
    },
    {
        "id": "doc-chunk-2",
        "content": """打印机无法连接的解决方案：

1. 检查打印机是否开机并连接
2. 确认电脑和打印机在同一个网络
3. 在控制面板中删除并重新添加打印机
4. 更新打印机驱动程序
5. 检查打印服务是否运行（services.msc）"""
    },
    {
        "id": "doc-chunk-3",
        "content": """账号权限申请流程：

1. 联系直属上级审批
2. 登录 IT 帮辅系统提交申请
3. 说明需要的系统权限
4. IT 部门会在 24 小时内处理
5. 审批通过后，权限会自动生效"""
    },
    {
        "id": "doc-chunk-4",
        "content": """软件安装申请流程：

1. 登录 IT 帮辅系统
2. 选择"软件安装申请"
3. 填写软件名称和用途
4. 等待部门经理和 IT 部门审批
5. 审批通过后，可以远程安装或自行下载"""
    }
]

def get_embedding(text: str) -> list:
    """Generate embedding using Ollama API"""
    response = httpx.post(
        f"{OLLAMA_HOST}/api/embeddings",
        json={
            "model": EMBEDDING_MODEL,
            "prompt": text
        },
        timeout=30.0
    )
    response.raise_for_status()
    data = response.json()
    return data["embedding"]

def delete_collection(client: httpx.Client, name: str):
    """Delete existing collection"""
    try:
        # Get collection ID first
        response = client.get(
            f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v2/tenants/{TENANT}/databases/{DATABASE}/collections/{name}"
        )
        if response.status_code == 200:
            collection_id = response.json()["id"]
            # Delete the collection
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
            "metadata": {"description": "IT Helpdesk Knowledge Base"}
        }
    )
    response.raise_for_status()
    return response.json()["id"]

def add_chunks(client: httpx.Client, collection_id: str, chunks: list):
    """Add chunks to collection"""
    ids = []
    embeddings = []
    documents = []
    metadatas = []
    
    print(f"Generating embeddings for {len(chunks)} chunks using Ollama ({EMBEDDING_MODEL})...")
    for i, chunk in enumerate(chunks):
        print(f"  Embedding chunk {i+1}/{len(chunks)}: {chunk['id']}")
        embedding = get_embedding(chunk["content"])
        print(f"    Generated embedding with {len(embedding)} dimensions")
        ids.append(chunk["id"])
        embeddings.append(embedding)
        documents.append(chunk["content"])
        metadatas.append({"source": "seed-data", "chunk_index": i})
    
    print(f"\nAdding chunks to ChromaDB...")
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
        print(f"Error: {response.text}")
        response.raise_for_status()
    
    print("Successfully added chunks!")

def query_demo(client: httpx.Client, collection_id: str):
    """Demo query to verify setup"""
    print("\n3. Testing query...")
    query_text = "电脑蓝屏怎么办"
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
        print(f"   Query: '{query_text}'")
        print(f"   Found {len(docs)} results:")
        for i, (doc, dist) in enumerate(zip(docs, dists)):
            similarity = 1 - dist  # Convert distance to similarity
            print(f"   - [{similarity:.2%} similarity] {doc[:80]}...")
    else:
        print(f"   Query failed: {response.text}")

def main():
    print("=" * 60)
    print("ChromaDB Knowledge Base Sync (using Ollama embeddings)")
    print("=" * 60)
    print(f"Ollama: {OLLAMA_HOST}")
    print(f"Embedding Model: {EMBEDDING_MODEL}")
    print()
    
    with httpx.Client(timeout=30.0) as client:
        # Delete old collection (with wrong dimension)
        print(f"1. Cleaning up old collection...")
        delete_collection(client, COLLECTION_NAME)
        
        # Create new collection
        print(f"\n2. Creating new collection '{COLLECTION_NAME}'...")
        collection_id = create_collection(client, COLLECTION_NAME)
        print(f"   Collection ID: {collection_id}")
        
        # Add chunks
        print(f"\n3. Adding {len(CHUNKS)} chunks...")
        add_chunks(client, collection_id, CHUNKS)
        
        # Test query
        query_demo(client, collection_id)
    
    print("\n" + "=" * 60)
    print("Sync completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()

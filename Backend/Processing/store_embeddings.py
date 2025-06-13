import os
import uuid
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

# Load environment variables
load_dotenv()

pinecone_api_key = os.getenv("PINECONE_API_KEY")

# Initialize Pinecone client
pc = Pinecone(api_key=pinecone_api_key)

def store_embeddings(embeddings, user_id, session_id, index_name="chatbot-index"):
    """
    Store embeddings in Pinecone index.
    """
    index = pc.Index(index_name)
    
    # Prepare vectors for upsert
    items = [
        {
            "id": str(uuid.uuid4()), 
            "values": emb["embedding"], 
            "metadata": {
                "text": emb["text"],
                "url": emb.get("url", ""),
                "filename": emb.get("filename", ""),
                "chunk_id": emb.get("chunk_id", -1),
                "source": emb.get("source", "unknown"),
                "original_filename": emb.get("original_filename", ""),
                "original_path": emb.get("original_path", ""),
                "user_id": user_id,
                "session_id": session_id,
                "type": "embedding"
            }
        }
        for emb in embeddings
    ]

    # Upsert vectors to user's namespace (namespace is created automatically)
    index.upsert(vectors=items, namespace=user_id)
    print(f"✅ Stored {len(items)} embeddings in index '{index_name}' namespace '{user_id}'")

def create_index_if_not_exists(index_name="chatbot-index", dimension=1024):
    """
    Create Pinecone index if it doesn't exist.
    Default dimension=1024 matches Cohere's embed-english-v3.0 model.
    """
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        print(f"✅ Created index '{index_name}' with dimension {dimension}")
    else:
        print(f"ℹ️  Index '{index_name}' already exists")

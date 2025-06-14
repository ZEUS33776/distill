import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try different pinecone import approaches for compatibility
try:
    # Using NEW API (pinecone>=7.0.0)
    from pinecone import Pinecone
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    
    if not pinecone_api_key:
        raise ValueError("PINECONE_API_KEY not found")
    
    pc = Pinecone(api_key=pinecone_api_key)
    
    # Test that the new API works by listing indexes
    try:
        indexes = pc.list_indexes()
        print(f"🔗 Using NEW Pinecone API - Found {len(indexes)} indexes")
        PINECONE_AVAILABLE = True
    except Exception as init_error:
        print(f"⚠️ NEW API initialization test failed: {init_error}")
        raise ImportError("New API failed initialization test")
        
except (ImportError, ValueError) as e:
    print(f"❌ Pinecone unavailable ({e}) - using database-only mode")
    
    # Create a dummy object that will always fail gracefully
    class DummyPinecone:
        def Index(self, name):
            raise Exception("Pinecone unavailable - using database-only mode")
        def list_indexes(self):
            return []
        def create_index(self, **kwargs):
            raise Exception("Pinecone unavailable - cannot create index")
    
    pc = DummyPinecone()
    PINECONE_AVAILABLE = False

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
    existing_indexes = [index.name for index in pc.list_indexes()]
    if index_name not in existing_indexes:
        from pinecone import ServerlessSpec
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")  # Match your existing index
        )
        print(f"✅ Created index '{index_name}' with dimension {dimension}")
    else:
        print(f"ℹ️  Index '{index_name}' already exists")

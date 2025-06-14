import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try different pinecone import approaches for compatibility
try:
    # Try new API first
    from pinecone import Pinecone
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    
    if not pinecone_api_key:
        raise ValueError("PINECONE_API_KEY not found")
    
    pc = Pinecone(api_key=pinecone_api_key)
    
    # Test that the new API works by listing indexes
    try:
        indexes = pc.list_indexes()
        print(f"🔗 Using NEW Pinecone API - Found {len(indexes)} indexes")
        PINECONE_NEW_API = True
    except Exception as init_error:
        print(f"⚠️ NEW API initialization test failed: {init_error}")
        raise ImportError("New API failed initialization test")
        
except (ImportError, ValueError) as e:
    print(f"🔗 NEW API unavailable ({e}), trying pinecone-client...")
    
    # Try pinecone-client package
    try:
        import pinecone
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        
        if not pinecone_api_key:
            print("❌ PINECONE_API_KEY not found")
            raise ValueError("API key missing")
        
        # Initialize without specifying environment - auto-detect
        pinecone.init(api_key=pinecone_api_key)
        
        # Test connection
        indexes = pinecone.list_indexes()
        print(f"🔗 Using pinecone-client API - Found {len(indexes)} indexes")
        
        pc = pinecone
        PINECONE_NEW_API = False
        
    except Exception as fallback_error:
        print(f"❌ All Pinecone APIs failed: {fallback_error}")
        # Create a dummy object that will always fail gracefully
        class DummyPinecone:
            def Index(self, name):
                raise Exception("Pinecone unavailable - using database-only mode")
            def list_indexes(self):
                return []
            def create_index(self, **kwargs):
                raise Exception("Pinecone unavailable - cannot create index")
        
        pc = DummyPinecone()
        PINECONE_NEW_API = False

def store_embeddings(embeddings, user_id, session_id, index_name="chatbot-index"):
    """
    Store embeddings in Pinecone index.
    """
    if PINECONE_NEW_API:
        index = pc.Index(index_name)
    else:
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
    if PINECONE_NEW_API:
        existing_indexes = [index.name for index in pc.list_indexes()]
        if index_name not in existing_indexes:
            from pinecone import ServerlessSpec
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="gcp", region="us-central1")
            )
            print(f"✅ Created index '{index_name}' with dimension {dimension}")
        else:
            print(f"ℹ️  Index '{index_name}' already exists")
    else:
        # Older API
        if index_name not in pc.list_indexes():
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine"
            )
            print(f"✅ Created index '{index_name}' with dimension {dimension}")
        else:
            print(f"ℹ️  Index '{index_name}' already exists")

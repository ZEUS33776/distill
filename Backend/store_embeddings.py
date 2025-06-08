import os
import uuid
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

pinecone_api_key = os.getenv("PINECONE_API_KEY")

# Initialize Pinecone client
pc = Pinecone(api_key=pinecone_api_key)

def store_embeddings(embeddings, index_name="chatbot-index"):
    """
    Store embeddings in Pinecone index.
    """
    index = pc.Index(index_name)

    # Prepare vectors for upsert
    items = [
        (str(uuid.uuid4()), emb["embedding"], {
            "text": emb["text"],
            "url": emb.get("url", ""),
            "filename": emb.get("filename", ""),
            "chunk_id": emb.get("chunk_id", -1)
        })
        for emb in embeddings
    ]

    index.upsert(vectors=items)
    print(f"✅ Stored {len(items)} embeddings in index '{index_name}'")

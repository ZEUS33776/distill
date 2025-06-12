import requests
import os
# import pinecone 
import uuid
from dotenv import load_dotenv

load_dotenv()


COHERE_API_KEY = os.getenv("COHERE_API_KEY") 
# PINECONE_API_KEY = os.getenv("PINECONE_API_KEY") 


# pinecone.init(api_key=PINECONE_API_KEY, environment="us-east-1-aws")
# index= pinecone.Index("chatbot-index")

headers = {
    "Authorization": f"Bearer {COHERE_API_KEY}",
    "Content-Type": "application/json"
}

def embed_text(texts):
    input_texts = [t if isinstance(t, str) else t["text"] for t in texts]

    data = {
        "texts": input_texts,
        "model": "embed-english-v3.0",
        "input_type": "search_document"
    }

    response = requests.post("https://api.cohere.ai/v1/embed", headers=headers, json=data)
    response.raise_for_status()

    embeddings = response.json()["embeddings"]
    
    # Return list of dicts with text + embedding
    return [{"text": input_texts[i], "embedding": embeddings[i]} for i in range(len(input_texts))]
def embed_query(text):
    input_texts = [text] if isinstance(text, str) else [t["text"] for t in text]

    data = {
        "texts": input_texts,
        "model": "embed-english-v3.0",
        "input_type": "search_query"
    }

    response = requests.post("https://api.cohere.ai/v1/embed", headers=headers, json=data)
    response.raise_for_status()

    embeddings = response.json()["embeddings"]
    return embeddings[0]

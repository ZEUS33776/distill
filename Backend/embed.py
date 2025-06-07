import requests
import os
from dotenv import load_dotenv

load_dotenv()
COHERE_API_KEY = os.getenv("COHERE_API_KEY")  # or paste it directly as string

headers = {
    "Authorization": f"Bearer {COHERE_API_KEY}",
    "Content-Type": "application/json"
}

def embed_text(texts):
    data = {
        "texts": texts,
        "model": "embed-english-v3.0",  # or use "embed-english-light-v3.0" for 128d embeddings
        "input_type": "search_document"  # or "search_query", "classification"
    }
    response = requests.post("https://api.cohere.ai/v1/embed", headers=headers, json=data)
    response.raise_for_status()
    return response.json()["embeddings"]

if __name__ == "__main__":
    texts = ["This is a test sentence.", "Another sentence."]
    embeddings = embed_text(texts)
    print(f"Embedding (first vector): {embeddings[0][:10]}...")  # first 10 dims
    print(f"Embedding length: {len(embeddings[0])}")  # 1024 or 128

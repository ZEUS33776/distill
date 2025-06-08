from yt_handler import process_youtube_video
from read_and_chunk import read_and_chunk_files
from fastapi import FastAPI,Body
from embed import embed_text
from fastapi.middleware.cors import CORSMiddleware
from store_embeddings import store_embeddings
import os


app= FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or set your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/process_youtube_video/")
def process_youtube_video_endpoint(url: str):
    """
    Endpoint to process a YouTube video URL and return the transcript.
    """
    try:
        transcript = process_youtube_video(url) 
        return {"transcript": transcript}
    except Exception as e:
        return {"error": str(e)}
    



@app.get("/read_and_chunk_files/")
def read_and_chunk_files_endpoint(folder_path: str, chunk_size: int = 500):
    """
    Endpoint to read and chunk text files in a specified folder.
    """
    try:
        chunks = read_and_chunk_files(folder_path, chunk_size)
        return {"chunks": chunks}
    except Exception as e:
        return {"error": str(e)}    
    

@app.post("/embed_text/")
def embed_text_endpoint(texts: list):
    """
    Endpoint to embed a list of texts using the Cohere API.
    """
    try:
        
        embeddings = embed_text(texts)
        return {"embeddings": embeddings}
    except Exception as e:
        return {"error": str(e)}
@app.post("/youtube_to_embeddings/")
def youtube_to_embeddings(
    url: str = Body(...),
    chunk_size: int = Body(500),
    batch_size: int = Body(64)
):
    """
    Full pipeline endpoint:
    - Process YouTube video URL to get transcript
    - Save transcript file with metadata
    - Read and chunk that file
    - Embed chunks in batches
    - Store embeddings to Pinecone
    """
    try:
        # Step 1: Save transcript (with metadata header)
        transcript = process_youtube_video(url)

        # Step 2: Chunk from file
        chunks = read_and_chunk_files(folder_path="./parsed_files", chunk_size=chunk_size)
        print(f"Chunks created: {len(chunks)}")

        # Step 3: Embed in batches
        embeddings_with_metadata = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            texts = [chunk["text"] for chunk in batch]
            print(f"Embedding batch {i//batch_size+1} of size {len(texts)}")
            batch_embeddings = embed_text(texts)

            for chunk, embedding in zip(batch, batch_embeddings):
                embeddings_with_metadata.append({
                    "chunk_id": chunk["chunk_id"],
                    "filename": chunk.get("filename"),
                    "source": chunk.get("source"),
                    "url": chunk.get("url"),
                    "text": chunk["text"],
                    "embedding": embedding["embedding"],
                })

        # ✅ Step 4: Store to Pinecone
        store_embeddings(embeddings_with_metadata)

        return {
            "num_chunks": len(embeddings_with_metadata),
            "first_vector": embeddings_with_metadata[0]
        }

    except Exception as e:
        return {"error": str(e)}

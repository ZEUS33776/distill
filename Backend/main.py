from yt_handler import process_youtube_video
from read_and_chunk import read_and_chunk_files
from fastapi import FastAPI,Body
from embed import embed_text
from fastapi.middleware.cors import CORSMiddleware



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
    batch_size: int = 64  # Safe limit for API batching
):
    """
    Full pipeline endpoint:
    - Process YouTube video URL to get transcript
    - Chunk transcript into parts of chunk_size
    - Embed each chunk in batches to avoid size limits
    - Return embeddings and chunks
    """
    try:
        # Step 1: Get transcript
        transcript = process_youtube_video(url)

        # Step 2: Chunk transcript into smaller chunks
        chunks = [transcript[i:i + chunk_size] for i in range(0, len(transcript), chunk_size)]
        print(f"Chunks created: {len(chunks)}, Example chunk length: {len(chunks[0])}")

        # Step 3: Batch-wise embedding
        all_embeddings = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            print(f"Sending batch {i // batch_size + 1} with {len(batch)} chunks...")
            batch_embeddings = embed_text(batch)
            all_embeddings.extend(batch_embeddings)

        return {
            "chunks": chunks,
            "embeddings": all_embeddings
        }
    except Exception as e:
        return {"error": str(e)}

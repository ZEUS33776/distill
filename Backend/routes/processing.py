from fastapi import APIRouter, Body
from pydantic import BaseModel
from Processing.read_and_chunk import read_and_chunk_files
from Processing.embed import embed_text
from Processing.store_embeddings import store_embeddings
from Ingestion.yt_handler import process_youtube_video

router = APIRouter()

class ContentToEmbeddingsRequest(BaseModel):
    chunk_size: int = 500
    batch_size: int = 64
    user_id: str
    session_id: str

@router.post("/content_to_embeddings/")
async def content_to_embeddings(request: ContentToEmbeddingsRequest):
    """
    Process all content in parsed_files folder:
    - Read and chunk all files in parsed_files
    - Embed chunks in batches
    - Store embeddings to Pinecone
    
    This route assumes content has already been ingested via 
    /process_youtube_video/ or /process_pdf/ routes.
    """
    try:
        # Step 1: Chunk all files in parsed_files
        chunks = read_and_chunk_files(folder_path="./parsed_files", chunk_size=request.chunk_size)
        print(f"Chunks created: {len(chunks)}")
        
        if not chunks:
            return {"error": "No content found in parsed_files. Please ingest content first."}

        # Step 2: Embed in batches
        embeddings_with_metadata = []
        for i in range(0, len(chunks), request.batch_size):
            batch = chunks[i:i + request.batch_size]
            texts = [chunk["text"] for chunk in batch]
            print(f"Embedding batch {i//request.batch_size+1} of size {len(texts)}")
            batch_embeddings = embed_text(texts)

            for chunk, embedding in zip(batch, batch_embeddings):
                embedding_entry = {
                    "chunk_id": chunk["chunk_id"],
                    "filename": chunk.get("filename"),
                    "source": chunk.get("source"),
                    "text": chunk["text"],
                    "user_id": request.user_id,
                    "session_id": request.session_id,
                    "embedding": embedding["embedding"],
                }
                
                # Add source-specific metadata
                if chunk.get("source") == "youtube":
                    embedding_entry["url"] = chunk.get("url", "")
                elif chunk.get("source") == "pdf":
                    embedding_entry["original_filename"] = chunk.get("original_filename", "")
                    embedding_entry["original_path"] = chunk.get("original_path", "")
                
                embeddings_with_metadata.append(embedding_entry)

        # Step 3: Store to Pinecone
        store_embeddings(embeddings_with_metadata, user_id=request.user_id,session_id=request.session_id)

        return {
            "success": True,
            "num_chunks": len(embeddings_with_metadata),
            "sources_processed": list(set(chunk.get("source", "unknown") for chunk in chunks)),
            "sample_chunk": {k: v for k, v in embeddings_with_metadata[0].items() if k != "embedding"} if embeddings_with_metadata else None
        }

    except Exception as e:
        return {"error": str(e)}


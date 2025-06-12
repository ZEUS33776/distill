from fastapi import APIRouter, Body
from Processing.read_and_chunk import read_and_chunk_files
from Processing.embed import embed_text
from Processing.store_embeddings import store_embeddings
from Ingestion.yt_handler import process_youtube_video

router = APIRouter()



@router.post("/content_to_embeddings/")
def content_to_embeddings(
    chunk_size: int = Body(500),
    batch_size: int = Body(64)
):
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
        chunks = read_and_chunk_files(folder_path="./parsed_files", chunk_size=chunk_size)
        print(f"Chunks created: {len(chunks)}")
        
        if not chunks:
            return {"error": "No content found in parsed_files. Please ingest content first."}

        # Step 2: Embed in batches
        embeddings_with_metadata = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            texts = [chunk["text"] for chunk in batch]
            print(f"Embedding batch {i//batch_size+1} of size {len(texts)}")
            batch_embeddings = embed_text(texts)

            for chunk, embedding in zip(batch, batch_embeddings):
                embedding_entry = {
                    "chunk_id": chunk["chunk_id"],
                    "filename": chunk.get("filename"),
                    "source": chunk.get("source"),
                    "text": chunk["text"],
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
        store_embeddings(embeddings_with_metadata)

        return {
            "success": True,
            "num_chunks": len(embeddings_with_metadata),
            "sources_processed": list(set(chunk.get("source", "unknown") for chunk in chunks)),
            "sample_chunk": {k: v for k, v in embeddings_with_metadata[0].items() if k != "embedding"} if embeddings_with_metadata else None
        }

    except Exception as e:
        return {"error": str(e)}

@router.post("/youtube_to_embeddings_legacy/")
def youtube_to_embeddings_legacy(
    url: str = Body(...),
    chunk_size: int = Body(500),
    batch_size: int = Body(64)
):
    """
    LEGACY: Full pipeline endpoint for YouTube only.
    Consider using /process_youtube_video/ followed by /content_to_embeddings/ instead.
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
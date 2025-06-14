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
    import time
    start_time = time.time()
    
    print(f"🔄 [EMBED-BACKEND] Embeddings processing request received")
    print(f"🔄 [EMBED-BACKEND] Request: {request}")
    print(f"🔄 [EMBED-BACKEND] User ID: {request.user_id}")
    print(f"🔄 [EMBED-BACKEND] Session ID: {request.session_id}")
    print(f"🔄 [EMBED-BACKEND] Chunk size: {request.chunk_size}")
    print(f"🔄 [EMBED-BACKEND] Batch size: {request.batch_size}")
    print(f"🔄 [EMBED-BACKEND] Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Step 1: Chunk all files in parsed_files
        print(f"🔄 [EMBED-BACKEND] Step 1: Reading and chunking files...")
        chunks = read_and_chunk_files(chunk_size=request.chunk_size)
        print(f"🔄 [EMBED-BACKEND] Chunks created: {len(chunks)}")
        
        if chunks:
            print(f"🔄 [EMBED-BACKEND] Sample chunk preview: {chunks[0]['text'][:100]}...")
            sources = list(set(chunk.get("source", "unknown") for chunk in chunks))
            print(f"🔄 [EMBED-BACKEND] Sources found: {sources}")
        
        if not chunks:
            print(f"❌ [EMBED-BACKEND] No content found in Parsed_files")
            return {"error": "No content found in Parsed_files. Please ingest content first."}

        # Step 2: Embed in batches
        print(f"🔄 [EMBED-BACKEND] Step 2: Creating embeddings...")
        embeddings_with_metadata = []
        total_batches = (len(chunks) + request.batch_size - 1) // request.batch_size
        
        for i in range(0, len(chunks), request.batch_size):
            batch_num = i//request.batch_size + 1
            batch = chunks[i:i + request.batch_size]
            texts = [chunk["text"] for chunk in batch]
            
            print(f"🔄 [EMBED-BACKEND] Processing batch {batch_num}/{total_batches} (size: {len(texts)})")
            batch_start = time.time()
            batch_embeddings = embed_text(texts)
            batch_time = time.time() - batch_start
            print(f"🔄 [EMBED-BACKEND] Batch {batch_num} embedded in {batch_time:.2f}s")

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
        print(f"🔄 [EMBED-BACKEND] Step 3: Storing {len(embeddings_with_metadata)} embeddings...")
        store_start = time.time()
        store_embeddings(embeddings_with_metadata, user_id=request.user_id, session_id=request.session_id)
        store_time = time.time() - store_start
        print(f"🔄 [EMBED-BACKEND] Embeddings stored in {store_time:.2f}s")

        processing_time = time.time() - start_time
        sources_processed = list(set(chunk.get("source", "unknown") for chunk in chunks))
        
        response_data = {
            "success": True,
            "chunks_processed": len(embeddings_with_metadata),
            "embeddings_created": len(embeddings_with_metadata),
            "sources_processed": sources_processed,
            "processing_time_seconds": round(processing_time, 2),
            "sample_chunk": {k: v for k, v in embeddings_with_metadata[0].items() if k != "embedding"} if embeddings_with_metadata else None
        }
        
        print(f"✅ [EMBED-BACKEND] Embeddings processing completed successfully!")
        print(f"✅ [EMBED-BACKEND] Total processing time: {processing_time:.2f}s")
        print(f"✅ [EMBED-BACKEND] Chunks processed: {len(embeddings_with_metadata)}")
        print(f"✅ [EMBED-BACKEND] Sources: {sources_processed}")
        print(f"✅ [EMBED-BACKEND] Sending response: {response_data}")

        return response_data

    except Exception as e:
        processing_time = time.time() - start_time
        print(f"❌ [EMBED-BACKEND] Embeddings processing failed!")
        print(f"❌ [EMBED-BACKEND] Error after: {processing_time:.2f}s")
        print(f"❌ [EMBED-BACKEND] Error type: {type(e).__name__}")
        print(f"❌ [EMBED-BACKEND] Error message: {str(e)}")
        print(f"❌ [EMBED-BACKEND] Error details: {repr(e)}")
        
        error_response = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "processing_time_seconds": round(processing_time, 2)
        }
        
        print(f"❌ [EMBED-BACKEND] Sending error response: {error_response}")
        return error_response


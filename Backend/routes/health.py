from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "PDF & YouTube Knowledge Base API",
        "endpoints": {
            "youtube": "/process_youtube_video/",
            "pdf": "/process_pdf/",
            "pdf_validate": "/validate_pdf/",
            "embeddings": "/content_to_embeddings/",
            "chunks": "/read_and_chunk_files/"
        },
        "status": "ready"
    } 
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    """
    Root endpoint providing API information.
    """
    return {
        "message": "Distill API is running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/",
            "llm": "/query-llm",
            "ingestion": ["/process_youtube_video/", "/process_pdf/", "/validate_pdf/"],
            "processing": ["/content_to_embeddings/", "/youtube_to_embeddings_legacy/"],
            "sessions": ["/create_session", "/update_session_topic"]
        }
    } 
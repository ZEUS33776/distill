from fastapi import APIRouter

router = APIRouter()

@router.get("/")
@router.head("/")
async def root():
    """
    Root endpoint providing API information.
    Supports both GET and HEAD methods for health checks.
    """
    return {
        "message": "Distill API is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "llm": "/query-llm",
            "ingestion": ["/process_youtube_video/", "/process_pdf/", "/validate_pdf/"],
            "processing": ["/content_to_embeddings/", "/youtube_to_embeddings_legacy/"],
            "sessions": ["/create_session", "/update_session_topic"]
        }
    }

@router.get("/health")
@router.head("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return {"status": "healthy", "message": "API is operational"} 
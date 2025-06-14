from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import router as auth_router
from routes.health import router as health_router
from routes.ingestion import router as ingestion_router
from routes.processing import router as processing_router
from routes.llm import router as llm_router
from Database.connection import db
from routes.handle_session import router as handle_session_router
from routes.study_sessions import router as study_sessions_router
from routes.session_results import router as session_results_router
from routes.user_profile import router as user_profile_router

app = FastAPI(
    title="PDF & YouTube Knowledge Base API",
    description="API for processing PDFs, YouTube videos, and querying with LLM",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or set your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup"""
    await db.create_pool()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool on shutdown"""
    print("🔄 Shutting down application...")
    try:
        await db.close_pool()
        print("✅ Application shutdown complete")
    except Exception as e:
        print(f"⚠️ Error during shutdown: {e}")
        # Force exit if needed
        import sys
        sys.exit(0)

# Include all route modules
app.include_router(health_router, tags=["Health"])
app.include_router(auth_router, tags=["Authentication"])
app.include_router(ingestion_router, tags=["Content Ingestion"])
app.include_router(processing_router, tags=["Text Processing"])
app.include_router(llm_router, tags=["LLM Queries"])
app.include_router(handle_session_router, tags=["Session Management"])
app.include_router(study_sessions_router, tags=["Study Sessions"])
app.include_router(session_results_router, tags=["Session Results"])
app.include_router(user_profile_router, tags=["User Profile"])
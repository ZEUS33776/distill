from fastapi import APIRouter
from pydantic import BaseModel
from Database.connection import db
from datetime import datetime
import uuid

router = APIRouter()

class CreateSessionRequest(BaseModel):
    user_id: str
    topic: str = "New chat"  # Default value if not provided

class UpdateSessionTopicRequest(BaseModel):
    session_id: str
    topic: str

@router.post("/create_session")
async def create_session(request: CreateSessionRequest):
    """
    Create a new session for a user (async version).
    """
    try:
        session_id = str(uuid.uuid4())
        
        # Use async database connection
        async with db.get_connection() as conn:
            await conn.execute(
                "INSERT INTO sessions (session_id, user_id, created_at, topic, is_active) VALUES ($1, $2, $3, $4, $5)",
                session_id, request.user_id, datetime.now(), request.topic, True
            )
        
        return {"session_id": session_id, "success": True}
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/update_session_topic")
async def update_session_topic(request: UpdateSessionTopicRequest):
    """
    Update the topic of an existing session (async version).
    """
    try:
        # Use async database connection
        async with db.get_connection() as conn:
            await conn.execute(
                "UPDATE sessions SET topic = $1 WHERE session_id = $2", 
                request.topic, request.session_id
            )
        
        return {"success": True, "message": "Session topic updated"}
    except Exception as e:
        return {"error": str(e)}

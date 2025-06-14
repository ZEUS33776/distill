from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from Database.connection import db
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

router = APIRouter()

class CreateSessionRequest(BaseModel):
    user_id: str
    topic: str = "New chat"  # Default value if not provided
    title: str = "New Chat"  # Default title

class UpdateSessionTopicRequest(BaseModel):
    session_id: str
    topic: str

class DeleteSessionRequest(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: Optional[str] = None  # Allow None values
    topic: Optional[str] = None  # Allow None values
    created_at: datetime
    is_active: bool

class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime

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
                "INSERT INTO sessions (session_id, user_id, created_at, title, topic, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
                session_id, request.user_id, datetime.now(), request.title, request.topic, True
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

@router.delete("/delete_session")
async def delete_session(request: DeleteSessionRequest):
    """
    Soft delete a chat session by setting is_active to false.
    """
    try:
        # Use async database connection
        async with db.get_connection() as conn:
            result = await conn.execute(
                "UPDATE sessions SET is_active = false WHERE session_id = $1",
                request.session_id
            )
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"success": True, "message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")

@router.get("/user/{user_id}/sessions", response_model=List[SessionResponse])
async def get_user_sessions(user_id: str):
    """
    Get all active chat sessions for a specific user.
    """
    try:
        print(f"🔍 Fetching sessions for user: {user_id}")
        
        async with db.get_connection() as conn:
            # First check if user exists and count total sessions
            total_sessions = await conn.fetchval(
                "SELECT COUNT(*) FROM sessions WHERE user_id = $1",
                user_id
            )
            print(f"📊 Total sessions for user {user_id}: {total_sessions}")
            
            active_sessions = await conn.fetchval(
                "SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND is_active = true",
                user_id
            )
            print(f"📊 Active sessions for user {user_id}: {active_sessions}")
            
            sessions = await conn.fetch(
                """
                SELECT session_id, user_id, title, topic, created_at, is_active
                FROM sessions 
                WHERE user_id = $1 AND is_active = true
                ORDER BY created_at DESC
                """,
                user_id
            )
            
            print(f"📋 Raw sessions from database: {len(sessions)} sessions")
            for i, session in enumerate(sessions):
                print(f"  Session {i+1}:")
                print(f"    ID: {session['session_id']}")
                print(f"    User: {session['user_id']}")
                print(f"    Title: {session['title']}")
                print(f"    Topic: {session['topic']}")
                print(f"    Created: {session['created_at']}")
                print(f"    Active: {session['is_active']}")
        
        result = []
        for session in sessions:
            session_dict = dict(session)
            # Convert UUID objects to strings
            session_dict['session_id'] = str(session_dict['session_id'])
            session_dict['user_id'] = str(session_dict['user_id'])
            # Handle None values for title and topic
            session_dict['title'] = session_dict['title'] or session_dict['topic'] or 'New Chat'
            session_dict['topic'] = session_dict['topic'] or 'New Chat'
            result.append(session_dict)
            
        print(f"✅ Returning {len(result)} sessions to frontend")
        return result
    except Exception as e:
        print(f"❌ Error fetching user sessions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}")

@router.get("/session/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: str):
    """
    Get all messages for a specific session.
    """
    try:
        async with db.get_connection() as conn:
            messages = await conn.fetch(
                """
                SELECT role, content, timestamp
                FROM messages 
                WHERE session_id = $1
                ORDER BY timestamp ASC
                """,
                session_id
            )
        
        result = []
        for message in messages:
            message_dict = dict(message)
            result.append(message_dict)
        return result
    except Exception as e:
        print(f"❌ Error fetching session messages: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")

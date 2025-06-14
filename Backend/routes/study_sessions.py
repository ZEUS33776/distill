from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from Database.connection import db
from datetime import datetime
from typing import Dict, Any, List, Union
import uuid

router = APIRouter(prefix="/study-sessions", tags=["study-sessions"])

class CreateStudySessionRequest(BaseModel):
    session_id: str
    user_id: str
    type: str  # 'quiz' or 'flashnotes'
    name: str
    content: Union[Dict[Any, Any], List[Any]]  # Allow both dict and list

class StudySessionResponse(BaseModel):
    id: int
    session_id: str
    user_id: str
    type: str
    name: str
    content: Union[Dict[Any, Any], List[Any]]  # Allow both dict and list
    created_at: datetime
    is_active: bool

@router.post("/create", response_model=Dict[str, Any])
async def create_study_session(request: CreateStudySessionRequest):
    """
    Create a new study session (quiz or flashnotes) for a user.
    """
    try:
        async with db.get_connection() as conn:
            import json
            study_session_id = await conn.fetchval(
                """
                INSERT INTO study_sessions (session_id, user_id, type, name, content, created_at, is_active) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING id
                """,
                request.session_id,
                request.user_id,
                request.type,
                request.name,
                json.dumps(request.content),  # Convert to JSON string
                datetime.now(),
                True
            )
        
        return {
            "success": True,
            "study_session_id": study_session_id,
            "message": f"Study session '{request.name}' created successfully"
        }
    except Exception as e:
        print(f"❌ Error creating study session: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating study session: {str(e)}")

@router.get("/user/{user_id}/quiz", response_model=List[StudySessionResponse])
async def get_user_quizzes(user_id: str):
    """
    Get all quiz study sessions for a specific user.
    """
    try:
        async with db.get_connection() as conn:
            quizzes = await conn.fetch(
                """
                SELECT id, session_id, user_id, type, name, content, created_at, is_active
                FROM study_sessions 
                WHERE user_id = $1 AND type = 'quiz' AND is_active = true
                ORDER BY created_at DESC
                """,
                user_id
            )
        
        import json
        result = []
        for quiz in quizzes:
            quiz_dict = dict(quiz)
            # Parse JSON content back to Python object
            if isinstance(quiz_dict['content'], str):
                quiz_dict['content'] = json.loads(quiz_dict['content'])
            result.append(quiz_dict)
        return result
    except Exception as e:
        print(f"❌ Error fetching user quizzes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching quizzes: {str(e)}")

@router.get("/user/{user_id}/flashnotes", response_model=List[StudySessionResponse])
async def get_user_flashnotes(user_id: str):
    """
    Get all flashnotes study sessions for a specific user.
    """
    try:
        async with db.get_connection() as conn:
            flashnotes = await conn.fetch(
                """
                SELECT id, session_id, user_id, type, name, content, created_at, is_active
                FROM study_sessions 
                WHERE user_id = $1 AND type = 'flashnotes' AND is_active = true
                ORDER BY created_at DESC
                """,
                user_id
            )
        
        import json
        result = []
        for flashnote in flashnotes:
            flashnote_dict = dict(flashnote)
            # Parse JSON content back to Python object
            if isinstance(flashnote_dict['content'], str):
                flashnote_dict['content'] = json.loads(flashnote_dict['content'])
            result.append(flashnote_dict)
        return result
    except Exception as e:
        print(f"❌ Error fetching user flashnotes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching flashnotes: {str(e)}")

@router.get("/user/{user_id}/all", response_model=List[StudySessionResponse])
async def get_all_user_study_sessions(user_id: str):
    """
    Get all study sessions (quiz and flashnotes) for a specific user.
    """
    try:
        async with db.get_connection() as conn:
            sessions = await conn.fetch(
                """
                SELECT id, session_id, user_id, type, name, content, created_at, is_active
                FROM study_sessions 
                WHERE user_id = $1 AND is_active = true
                ORDER BY created_at DESC
                """,
                user_id
            )
        
        import json
        result = []
        for session in sessions:
            session_dict = dict(session)
            # Parse JSON content back to Python object
            if isinstance(session_dict['content'], str):
                session_dict['content'] = json.loads(session_dict['content'])
            result.append(session_dict)
        return result
    except Exception as e:
        print(f"❌ Error fetching user study sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching study sessions: {str(e)}")

@router.get("/{study_session_id}", response_model=StudySessionResponse)
async def get_study_session(study_session_id: int):
    """
    Get a specific study session by ID.
    """
    try:
        async with db.get_connection() as conn:
            session = await conn.fetchrow(
                """
                SELECT id, session_id, user_id, type, name, content, created_at, is_active
                FROM study_sessions 
                WHERE id = $1 AND is_active = true
                """,
                study_session_id
            )
        
        if not session:
            raise HTTPException(status_code=404, detail="Study session not found")
        
        import json
        session_dict = dict(session)
        # Parse JSON content back to Python object
        if isinstance(session_dict['content'], str):
            session_dict['content'] = json.loads(session_dict['content'])
        return session_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching study session: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching study session: {str(e)}")

@router.delete("/{study_session_id}")
async def delete_study_session(study_session_id: int):
    """
    Soft delete a study session by setting is_active to false.
    """
    try:
        async with db.get_connection() as conn:
            result = await conn.execute(
                "UPDATE study_sessions SET is_active = false WHERE id = $1",
                study_session_id
            )
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Study session not found")
        
        return {"success": True, "message": "Study session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting study session: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting study session: {str(e)}") 
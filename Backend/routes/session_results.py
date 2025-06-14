from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from Database.connection import db
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

router = APIRouter(prefix="/session-results", tags=["session-results"])

class CreateSessionResultRequest(BaseModel):
    study_session_id: str  # Changed to str to support both numeric IDs and AI-generated hashes
    user_id: str
    session_type: str  # 'quiz' or 'flashnotes'
    session_name: str
    total_questions: int
    correct_answers: int = 0
    incorrect_answers: int = 0
    skipped_answers: int = 0
    accuracy_percentage: float = 0.0
    time_spent_seconds: int = 0
    difficulty_breakdown: Optional[Dict[str, Any]] = None
    detailed_results: Optional[List[Any]] = None

class SessionResultResponse(BaseModel):
    id: int
    study_session_id: str  # Changed to str to support both numeric IDs and AI-generated hashes
    user_id: str
    session_type: str
    session_name: str
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    skipped_answers: int
    accuracy_percentage: float
    time_spent_seconds: int
    difficulty_breakdown: Optional[Dict[str, Any]]
    detailed_results: Optional[List[Any]]
    completed_at: datetime
    created_at: datetime

class SessionComparisonResponse(BaseModel):
    current_result: SessionResultResponse
    previous_results: List[SessionResultResponse]
    improvement_stats: Dict[str, Any]

@router.post("/create", response_model=Dict[str, Any])
async def create_session_result(request: CreateSessionResultRequest):
    """
    Store the results of a completed study session.
    """
    try:
        async with db.get_connection() as conn:
            result_id = await conn.fetchval(
                """
                INSERT INTO session_results (
                    study_session_id, user_id, session_type, session_name,
                    total_questions, correct_answers, incorrect_answers, skipped_answers,
                    accuracy_percentage, time_spent_seconds, difficulty_breakdown, detailed_results,
                    completed_at, created_at
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
                RETURNING id
                """,
                request.study_session_id,
                request.user_id,
                request.session_type,
                request.session_name,
                request.total_questions,
                request.correct_answers,
                request.incorrect_answers,
                request.skipped_answers,
                request.accuracy_percentage,
                request.time_spent_seconds,
                json.dumps(request.difficulty_breakdown) if request.difficulty_breakdown else None,
                json.dumps(request.detailed_results) if request.detailed_results else None,
                datetime.now(),
                datetime.now()
            )
        
        return {
            "success": True,
            "result_id": result_id,
            "message": f"Session result for '{request.session_name}' stored successfully"
        }
    except Exception as e:
        print(f"❌ Error creating session result: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing session result: {str(e)}")

@router.get("/user/{user_id}/session/{study_session_id}/comparison", response_model=SessionComparisonResponse)
async def get_session_comparison(user_id: str, study_session_id: str):
    """
    Get the latest result for a session along with previous results for comparison.
    """
    try:
        print(f"🔍 Fetching comparison for user {user_id}, session {study_session_id}")
        
        async with db.get_connection() as conn:
            # Get the latest result for this specific session
            current_result = await conn.fetchrow(
                """
                SELECT * FROM session_results 
                WHERE user_id = $1 AND study_session_id = $2
                ORDER BY completed_at DESC 
                LIMIT 1
                """,
                user_id, study_session_id
            )
            
            if not current_result:
                raise HTTPException(status_code=404, detail="No results found for this session")
            
            print(f"✅ Found current result for '{current_result['session_name']}'")
            
            # Get previous results for the same specific study session and user
            previous_results = await conn.fetch(
                """
                SELECT * FROM session_results 
                WHERE user_id = $1 AND study_session_id = $2 AND id != $3
                ORDER BY completed_at DESC 
                LIMIT 5
                """,
                user_id, study_session_id, current_result['id']
            )
            
            print(f"📊 Found {len(previous_results)} previous attempts of the same quiz")
            
            # Convert to response format
            current_result_dict = dict(current_result)
            if current_result_dict.get('difficulty_breakdown'):
                current_result_dict['difficulty_breakdown'] = json.loads(current_result_dict['difficulty_breakdown'])
            if current_result_dict.get('detailed_results'):
                current_result_dict['detailed_results'] = json.loads(current_result_dict['detailed_results'])
            
            previous_results_list = []
            for result in previous_results:
                result_dict = dict(result)
                if result_dict.get('difficulty_breakdown'):
                    result_dict['difficulty_breakdown'] = json.loads(result_dict['difficulty_breakdown'])
                if result_dict.get('detailed_results'):
                    result_dict['detailed_results'] = json.loads(result_dict['detailed_results'])
                previous_results_list.append(result_dict)
            
            # Calculate improvement stats
            improvement_stats = calculate_improvement_stats(current_result_dict, previous_results_list)
            
            return {
                "current_result": current_result_dict,
                "previous_results": previous_results_list,
                "improvement_stats": improvement_stats
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching session comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching session comparison: {str(e)}")

@router.get("/user/{user_id}/history/{session_type}", response_model=List[SessionResultResponse])
async def get_user_session_history(user_id: str, session_type: str, limit: int = 10):
    """
    Get session history for a user by session type.
    """
    try:
        async with db.get_connection() as conn:
            results = await conn.fetch(
                """
                SELECT * FROM session_results 
                WHERE user_id = $1 AND session_type = $2
                ORDER BY completed_at DESC 
                LIMIT $3
                """,
                user_id, session_type, limit
            )
            
            results_list = []
            for result in results:
                result_dict = dict(result)
                if result_dict.get('difficulty_breakdown'):
                    result_dict['difficulty_breakdown'] = json.loads(result_dict['difficulty_breakdown'])
                if result_dict.get('detailed_results'):
                    result_dict['detailed_results'] = json.loads(result_dict['detailed_results'])
                results_list.append(result_dict)
            
            return results_list
            
    except Exception as e:
        print(f"❌ Error fetching user session history: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching session history: {str(e)}")

@router.get("/user/{user_id}/stats", response_model=Dict[str, Any])
async def get_user_stats(user_id: str):
    """
    Get overall statistics for a user across all sessions.
    """
    try:
        async with db.get_connection() as conn:
            # Get overall stats
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(accuracy_percentage) as avg_accuracy,
                    SUM(time_spent_seconds) as total_time_spent,
                    MAX(accuracy_percentage) as best_accuracy,
                    session_type
                FROM session_results 
                WHERE user_id = $1
                GROUP BY session_type
                """,
                user_id
            )
            
            # Get recent performance trend (last 10 sessions)
            recent_sessions = await conn.fetch(
                """
                SELECT accuracy_percentage, completed_at, session_type
                FROM session_results 
                WHERE user_id = $1
                ORDER BY completed_at DESC 
                LIMIT 10
                """,
                user_id
            )
            
            return {
                "overall_stats": dict(stats) if stats else {},
                "recent_performance": [dict(session) for session in recent_sessions],
                "total_sessions": len(recent_sessions)
            }
            
    except Exception as e:
        print(f"❌ Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")

def calculate_improvement_stats(current_result: Dict[str, Any], previous_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate improvement statistics comparing current result with previous results.
    """
    if not previous_results:
        return {
            "is_first_attempt": True,
            "accuracy_improvement": 0,
            "time_improvement": 0,
            "performance_trend": "first_attempt"
        }
    
    # Get the most recent previous result for comparison
    last_result = previous_results[0]
    
    # Calculate improvements
    accuracy_improvement = current_result['accuracy_percentage'] - last_result['accuracy_percentage']
    time_improvement = last_result['time_spent_seconds'] - current_result['time_spent_seconds']  # Negative means took longer
    
    # Calculate average of previous results for trend analysis
    avg_previous_accuracy = sum(r['accuracy_percentage'] for r in previous_results) / len(previous_results)
    
    # Determine performance trend
    if current_result['accuracy_percentage'] > avg_previous_accuracy + 5:
        trend = "improving"
    elif current_result['accuracy_percentage'] < avg_previous_accuracy - 5:
        trend = "declining"
    else:
        trend = "stable"
    
    return {
        "is_first_attempt": False,
        "accuracy_improvement": round(accuracy_improvement, 2),
        "time_improvement": time_improvement,
        "performance_trend": trend,
        "current_vs_average": round(current_result['accuracy_percentage'] - avg_previous_accuracy, 2),
        "total_previous_attempts": len(previous_results),
        "best_previous_accuracy": max(r['accuracy_percentage'] for r in previous_results),
        "is_personal_best": current_result['accuracy_percentage'] > max(r['accuracy_percentage'] for r in previous_results)
    } 
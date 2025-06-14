from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from Database.connection import db
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import json

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

class UserStatsResponse(BaseModel):
    chats_started: int
    quizzes_taken: int
    study_sessions: int
    achievements: int
    overall_progress: float
    total_study_time: int  # in seconds
    avg_quiz_accuracy: float
    best_quiz_score: float
    total_flashcards_studied: int

class RecentActivityItem(BaseModel):
    id: int
    activity_type: str  # 'quiz', 'flashnotes', 'chat'
    title: str
    description: str
    timestamp: datetime
    score: Optional[float] = None
    duration: Optional[int] = None  # in seconds

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str
    earned_at: datetime
    category: str

class UserProfileResponse(BaseModel):
    stats: UserStatsResponse
    recent_activity: List[RecentActivityItem]
    achievements: List[Achievement]

def normalize_datetime(dt):
    """Convert datetime to timezone-naive for consistent comparison"""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove timezone info
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

@router.get("/stats/{user_id}", response_model=UserStatsResponse)
async def get_user_stats(user_id: str):
    """
    Get comprehensive user statistics for the profile page.
    """
    try:
        async with db.get_connection() as conn:
            # Get session counts
            session_counts = await conn.fetchrow("""
                SELECT 
                    COUNT(DISTINCT CASE WHEN type = 'quiz' THEN session_id END) as quiz_sessions,
                    COUNT(DISTINCT CASE WHEN type = 'flashnotes' THEN session_id END) as flashnote_sessions,
                    COUNT(DISTINCT session_id) as total_study_sessions
                FROM study_sessions 
                WHERE user_id = $1 AND is_active = true
            """, user_id)

            # Get session results stats
            results_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_completed_sessions,
                    AVG(accuracy_percentage) as avg_accuracy,
                    MAX(accuracy_percentage) as best_accuracy,
                    SUM(time_spent_seconds) as total_time,
                    SUM(total_questions) as total_questions_answered
                FROM session_results 
                WHERE user_id = $1
            """, user_id)

            # Get chat sessions count (assuming we have a sessions table for chats)
            chat_count = await conn.fetchval("""
                SELECT COUNT(DISTINCT session_id) 
                FROM sessions 
                WHERE user_id = $1 AND is_active = true
            """, user_id) or 0

            # Calculate achievements count (we'll implement achievement logic)
            achievements_count = await calculate_achievements_count(conn, user_id, results_stats)

            # Calculate overall progress (based on activity and performance)
            overall_progress = calculate_overall_progress(session_counts, results_stats, chat_count)

            return UserStatsResponse(
                chats_started=chat_count,
                quizzes_taken=session_counts['quiz_sessions'] or 0,
                study_sessions=session_counts['total_study_sessions'] or 0,
                achievements=achievements_count,
                overall_progress=overall_progress,
                total_study_time=results_stats['total_time'] or 0,
                avg_quiz_accuracy=float(results_stats['avg_accuracy'] or 0),
                best_quiz_score=float(results_stats['best_accuracy'] or 0),
                total_flashcards_studied=results_stats['total_questions_answered'] or 0
            )

    except Exception as e:
        print(f"❌ Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")

@router.get("/recent-activity/{user_id}", response_model=List[RecentActivityItem])
async def get_recent_activity(user_id: str, limit: int = 10):
    """
    Get recent user activity for the profile page.
    """
    try:
        async with db.get_connection() as conn:
            # Get recent session results
            recent_sessions = await conn.fetch("""
                SELECT 
                    sr.id,
                    sr.session_type,
                    sr.session_name,
                    sr.accuracy_percentage,
                    sr.time_spent_seconds,
                    sr.completed_at,
                    ss.name as study_session_name
                FROM session_results sr
                LEFT JOIN study_sessions ss ON sr.study_session_id = ss.id
                WHERE sr.user_id = $1
                ORDER BY sr.completed_at DESC
                LIMIT $2
            """, user_id, limit)

            # Get recent chat sessions
            recent_chats = await conn.fetch("""
                SELECT 
                    session_id,
                    topic,
                    created_at
                FROM sessions 
                WHERE user_id = $1 AND is_active = true
                ORDER BY created_at DESC
                LIMIT $2
            """, user_id, limit // 2)

            activity_items = []

            # Process session results
            for session in recent_sessions:
                activity_type = session['session_type']
                if activity_type == 'quiz':
                    description = f"Scored {session['accuracy_percentage']:.0f}% accuracy"
                    title = session['session_name'] or session['study_session_name'] or "Quiz Session"
                elif activity_type == 'flashnotes':
                    description = f"Studied {session['accuracy_percentage']:.0f}% mastery rate"
                    title = session['session_name'] or session['study_session_name'] or "Flashcard Session"
                else:
                    description = "Completed study session"
                    title = session['session_name'] or "Study Session"

                activity_items.append(RecentActivityItem(
                    id=session['id'],
                    activity_type=activity_type,
                    title=title,
                    description=description,
                    timestamp=normalize_datetime(session['completed_at']),
                    score=float(session['accuracy_percentage']),
                    duration=session['time_spent_seconds']
                ))

            # Process chat sessions
            for chat in recent_chats:
                activity_items.append(RecentActivityItem(
                    id=hash(chat['session_id']) % 1000000,  # Generate a simple ID
                    activity_type='chat',
                    title=chat['topic'] or "Chat Session",
                    description="Started new conversation",
                    timestamp=normalize_datetime(chat['created_at'])
                ))

            # Sort by timestamp and limit (now safe since all timestamps are normalized)
            activity_items.sort(key=lambda x: x.timestamp or datetime.min, reverse=True)
            return activity_items[:limit]

    except Exception as e:
        print(f"❌ Error fetching recent activity: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching recent activity: {str(e)}")

@router.get("/achievements/{user_id}", response_model=List[Achievement])
async def get_user_achievements(user_id: str):
    """
    Get user achievements based on their activity and performance.
    """
    try:
        async with db.get_connection() as conn:
            # Get user stats for achievement calculation
            results_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(accuracy_percentage) as avg_accuracy,
                    MAX(accuracy_percentage) as best_accuracy,
                    COUNT(CASE WHEN accuracy_percentage >= 90 THEN 1 END) as excellent_sessions,
                    COUNT(CASE WHEN session_type = 'quiz' THEN 1 END) as quiz_sessions,
                    COUNT(CASE WHEN session_type = 'flashnotes' THEN 1 END) as flashnote_sessions
                FROM session_results 
                WHERE user_id = $1
            """, user_id)

            session_counts = await conn.fetchrow("""
                SELECT COUNT(DISTINCT session_id) as total_study_sessions
                FROM study_sessions 
                WHERE user_id = $1 AND is_active = true
            """, user_id)

            chat_count = await conn.fetchval("""
                SELECT COUNT(DISTINCT session_id) 
                FROM sessions 
                WHERE user_id = $1 AND is_active = true
            """, user_id) or 0

            achievements = []
            now = datetime.now()

            # Define achievements based on user activity
            if results_stats and results_stats.get('quiz_sessions', 0) >= 1:
                achievements.append(Achievement(
                    id="first_quiz",
                    name="First Quiz Master",
                    description="Completed your first quiz",
                    icon="Target",
                    color="text-green-500",
                    earned_at=now,
                    category="quiz"
                ))

            if chat_count >= 5:
                achievements.append(Achievement(
                    id="chat_enthusiast",
                    name="Chat Enthusiast",
                    description="Started 5 chat sessions",
                    icon="Zap",
                    color="text-blue-500",
                    earned_at=now,
                    category="chat"
                ))

            if results_stats and results_stats.get('total_sessions', 0) >= 3:
                achievements.append(Achievement(
                    id="study_streak",
                    name="Study Streak",
                    description="Completed 3 study sessions",
                    icon="BookOpen",
                    color="text-purple-500",
                    earned_at=now,
                    category="study"
                ))

            if results_stats and results_stats.get('excellent_sessions', 0) >= 1:
                achievements.append(Achievement(
                    id="perfectionist",
                    name="Perfectionist",
                    description="Achieved 90%+ accuracy",
                    icon="Award",
                    color="text-yellow-500",
                    earned_at=now,
                    category="performance"
                ))

            if results_stats and results_stats.get('flashnote_sessions', 0) >= 1:
                achievements.append(Achievement(
                    id="flashcard_master",
                    name="Flashcard Master",
                    description="Completed flashcard session",
                    icon="Brain",
                    color="text-pink-500",
                    earned_at=now,
                    category="flashcards"
                ))

            return achievements

    except Exception as e:
        print(f"❌ Error fetching achievements: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching achievements: {str(e)}")

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    """
    Get complete user profile data including stats, recent activity, and achievements.
    """
    try:
        # Fetch all profile data in parallel
        stats = await get_user_stats(user_id)
        recent_activity = await get_recent_activity(user_id, 10)
        achievements = await get_user_achievements(user_id)

        return UserProfileResponse(
            stats=stats,
            recent_activity=recent_activity,
            achievements=achievements
        )

    except Exception as e:
        print(f"❌ Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

async def calculate_achievements_count(conn, user_id: str, results_stats) -> int:
    """
    Calculate the number of achievements a user has earned.
    This should match exactly with the logic in get_user_achievements.
    """
    count = 0
    
    # Get the same data that get_user_achievements uses
    try:
        # Get user stats for achievement calculation (same query as in get_user_achievements)
        achievement_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_sessions,
                AVG(accuracy_percentage) as avg_accuracy,
                MAX(accuracy_percentage) as best_accuracy,
                COUNT(CASE WHEN accuracy_percentage >= 90 THEN 1 END) as excellent_sessions,
                COUNT(CASE WHEN session_type = 'quiz' THEN 1 END) as quiz_sessions,
                COUNT(CASE WHEN session_type = 'flashnotes' THEN 1 END) as flashnote_sessions
            FROM session_results 
            WHERE user_id = $1
        """, user_id)

        chat_count = await conn.fetchval("""
            SELECT COUNT(DISTINCT session_id) 
            FROM sessions 
            WHERE user_id = $1 AND is_active = true
        """, user_id) or 0

        # Use the exact same logic as get_user_achievements
        if achievement_stats and achievement_stats.get('quiz_sessions', 0) >= 1:
            count += 1  # First Quiz Master

        if chat_count >= 5:
            count += 1  # Chat Enthusiast

        if achievement_stats and achievement_stats.get('total_sessions', 0) >= 3:
            count += 1  # Study Streak

        if achievement_stats and achievement_stats.get('excellent_sessions', 0) >= 1:
            count += 1  # Perfectionist

        if achievement_stats and achievement_stats.get('flashnote_sessions', 0) >= 1:
            count += 1  # Flashcard Master

    except Exception as e:
        print(f"Warning: Could not calculate achievements count: {e}")
        
    return count

def calculate_overall_progress(session_counts, results_stats, chat_count) -> float:
    """
    Calculate overall learning progress based on user activity and performance.
    """
    progress = 0.0
    
    # Base progress from activity
    if chat_count > 0:
        progress += min(float(chat_count) * 5, 25)  # Up to 25% for chats
        
    if session_counts and session_counts.get('total_study_sessions'):
        progress += min(float(session_counts['total_study_sessions']) * 10, 40)  # Up to 40% for sessions
        
    # Performance bonus
    if results_stats and results_stats.get('avg_accuracy'):
        accuracy_bonus = (float(results_stats['avg_accuracy']) / 100) * 35  # Up to 35% for performance
        progress += accuracy_bonus
        
    return min(progress, 100.0)  # Cap at 100% 
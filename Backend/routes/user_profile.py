import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from Database.connection import db
import logging
from functools import wraps
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

class UserStatsResponse(BaseModel):
    chats_started: int = Field(ge=0, description="Number of chat sessions started")
    quizzes_taken: int = Field(ge=0, description="Number of quizzes completed")
    study_sessions: int = Field(ge=0, description="Total study sessions")
    achievements: int = Field(ge=0, description="Number of achievements earned")
    overall_progress: float = Field(ge=0.0, le=100.0, description="Overall learning progress percentage")
    total_study_time: int = Field(ge=0, description="Total study time in seconds")
    avg_quiz_accuracy: float = Field(ge=0.0, le=100.0, description="Average quiz accuracy percentage")
    best_quiz_score: float = Field(ge=0.0, le=100.0, description="Best quiz score percentage")
    total_flashcards_studied: int = Field(ge=0, description="Total flashcards studied")

    @validator('overall_progress', 'avg_quiz_accuracy', 'best_quiz_score')
    def validate_percentages(cls, v):
        return max(0.0, min(100.0, float(v)))

class RecentActivityItem(BaseModel):
    id: int = Field(description="Unique activity ID")
    activity_type: str = Field(description="Type of activity: quiz, flashnotes, chat")
    title: str = Field(min_length=1, max_length=200, description="Activity title")
    description: str = Field(max_length=500, description="Activity description")
    timestamp: datetime = Field(description="When the activity occurred")
    score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Activity score if applicable")
    duration: Optional[int] = Field(None, ge=0, description="Activity duration in seconds")

    @validator('activity_type')
    def validate_activity_type(cls, v):
        if v not in ['quiz', 'flashnotes', 'chat']:
            raise ValueError('activity_type must be quiz, flashnotes, or chat')
        return v

class Achievement(BaseModel):
    id: str = Field(min_length=1, max_length=50, description="Unique achievement ID")
    name: str = Field(min_length=1, max_length=100, description="Achievement name")
    description: str = Field(min_length=1, max_length=200, description="Achievement description")
    icon: str = Field(min_length=1, max_length=50, description="Icon name")
    color: str = Field(pattern=r'^text-\w+-\d+$', description="Tailwind CSS color class")
    earned_at: datetime = Field(description="When the achievement was earned")
    category: str = Field(min_length=1, max_length=50, description="Achievement category")

class UserProfileResponse(BaseModel):
    stats: UserStatsResponse
    recent_activity: List[RecentActivityItem]
    achievements: List[Achievement]

def normalize_datetime(dt: Any) -> Optional[datetime]:
    """Convert datetime to timezone-naive for consistent comparison"""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    return None

def performance_monitor(func):
    """Decorator to monitor endpoint performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        logger.info(f"🚀 [START] {func.__name__} for user {kwargs.get('user_id', 'unknown')[:8]}...")
        
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"✅ [SUCCESS] {func.__name__} completed in {duration:.3f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ [ERROR] {func.__name__} failed after {duration:.3f}s: {e}")
            raise
    return wrapper

def validate_user_id(user_id: str) -> str:
    """Validate user ID format and return normalized version"""
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user_id = user_id.strip()
    if len(user_id) == 0:
        raise HTTPException(status_code=400, detail="User ID cannot be empty")
    
    # Basic UUID format validation (flexible)
    if len(user_id) < 8:
        raise HTTPException(status_code=400, detail="Invalid user ID format - must be a valid UUID")
    
    return user_id

async def check_user_exists(user_id: str) -> bool:
    """Check if user exists in the database"""
    try:
        async with db.get_connection() as conn:
            result = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM users WHERE id::text = $1)",
                user_id
            )
            return bool(result)
    except Exception as e:
        logger.error(f"Error checking user existence: {e}")
        return False

async def get_user_stats(user_id: str) -> Dict[str, Any]:
    """Get comprehensive user statistics with accurate counts"""
    query = """
    WITH quiz_stats AS (
        SELECT 
            COUNT(*) as total_quizzes,
            COALESCE(AVG(accuracy_percentage), 0) as avg_accuracy,
            COALESCE(MAX(accuracy_percentage), 0) as best_accuracy,
            COALESCE(SUM(time_spent_seconds), 0) as total_quiz_time,
            COALESCE(SUM(total_questions), 0) as total_quiz_questions,
            COUNT(CASE WHEN accuracy_percentage >= 90 THEN 1 END) as excellent_quizzes
        FROM session_results 
        WHERE user_id::text = $1 AND session_type = 'quiz'
    ),
    flashcard_stats AS (
        SELECT 
            COUNT(*) as total_flashcards,
            COALESCE(SUM(total_questions), 0) as total_flashcard_questions,
            COALESCE(SUM(time_spent_seconds), 0) as total_flashcard_time
        FROM session_results 
        WHERE user_id::text = $1 AND session_type = 'flashnotes'
    ),
    session_stats AS (
        SELECT 
            COUNT(DISTINCT id) as total_study_sessions
        FROM study_sessions 
        WHERE user_id::text = $1 AND is_active = true
    ),
    chat_stats AS (
        SELECT COUNT(DISTINCT session_id) as chat_count
        FROM sessions 
        WHERE user_id::text = $1 AND is_active = true
    )
    SELECT 
        COALESCE(qs.total_quizzes, 0) as total_quizzes,
        COALESCE(qs.avg_accuracy, 0) as avg_accuracy,
        COALESCE(qs.best_accuracy, 0) as best_accuracy,
        COALESCE(qs.total_quiz_time, 0) as total_quiz_time,
        COALESCE(qs.total_quiz_questions, 0) as total_quiz_questions,
        COALESCE(qs.excellent_quizzes, 0) as excellent_quizzes,
        COALESCE(fs.total_flashcards, 0) as total_flashcards,
        COALESCE(fs.total_flashcard_questions, 0) as total_flashcard_questions,
        COALESCE(fs.total_flashcard_time, 0) as total_flashcard_time,
        COALESCE(ss.total_study_sessions, 0) as total_study_sessions,
        COALESCE(cs.chat_count, 0) as chat_count,
        COALESCE(qs.total_quiz_time, 0) + COALESCE(fs.total_flashcard_time, 0) as total_study_time
    FROM quiz_stats qs
    CROSS JOIN flashcard_stats fs
    CROSS JOIN session_stats ss
    CROSS JOIN chat_stats cs
    """
    
    async with db.get_connection() as conn:
        result = await conn.fetchrow(query, user_id)
        if result:
            return dict(result)
        else:
            # Return default stats if no data found
            return {
                'total_quizzes': 0, 'avg_accuracy': 0, 'best_accuracy': 0,
                'total_quiz_time': 0, 'total_quiz_questions': 0, 'excellent_quizzes': 0,
                'total_flashcards': 0, 'total_flashcard_questions': 0, 'total_flashcard_time': 0,
                'total_study_sessions': 0, 'chat_count': 0, 'total_study_time': 0
            }

def calculate_achievements_count(stats: Dict[str, Any]) -> int:
    """Calculate achievements count from stats"""
    count = 0
    try:
        if stats.get('total_quizzes', 0) >= 1:
            count += 1  # First Quiz Master
        if stats.get('chat_count', 0) >= 5:
            count += 1  # Chat Enthusiast
        if stats.get('total_study_sessions', 0) >= 3:
            count += 1  # Study Streak
        if stats.get('excellent_quizzes', 0) >= 1:
            count += 1  # Perfectionist
        if stats.get('total_flashcards', 0) >= 1:
            count += 1  # Flashcard Master
    except Exception as e:
        logger.warning(f"⚠️ Error calculating achievements: {e}")
    return count

def calculate_overall_progress(stats: Dict[str, Any]) -> float:
    """Calculate overall progress from stats"""
    try:
        progress = 0.0
        
        # Base progress from activity
        chat_count = stats.get('chat_count', 0) or 0
        if chat_count > 0:
            progress += min(float(chat_count) * 5, 25)  # Up to 25% for chats
            
        total_sessions = stats.get('total_study_sessions', 0) or 0
        if total_sessions > 0:
            progress += min(float(total_sessions) * 10, 40)  # Up to 40% for sessions
            
        # Performance bonus
        avg_accuracy = stats.get('avg_accuracy', 0) or 0
        if avg_accuracy > 0:
            accuracy_bonus = (float(avg_accuracy) / 100) * 35  # Up to 35% for performance
            progress += accuracy_bonus
            
        return min(progress, 100.0)  # Cap at 100%
    except Exception as e:
        logger.warning(f"⚠️ Error calculating progress: {e}")
        return 0.0

@router.get("/stats/{user_id}", response_model=UserStatsResponse)
@performance_monitor
async def get_user_stats_endpoint(user_id: str):
    """Get comprehensive user statistics for the profile page."""
    user_id = validate_user_id(user_id)
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            logger.warning(f"⚠️ User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get fresh stats from database
        stats = await get_user_stats(user_id)
        
        # Calculate derived values
        achievements_count = calculate_achievements_count(stats)
        overall_progress = calculate_overall_progress(stats)
        
        # Build response
        response = UserStatsResponse(
            chats_started=int(stats['chat_count']),
            quizzes_taken=int(stats['total_quizzes']),  # Actual quiz count
            study_sessions=int(stats['total_study_sessions']),
            achievements=achievements_count,
            overall_progress=overall_progress,
            total_study_time=int(stats['total_study_time']),
            avg_quiz_accuracy=float(stats['avg_accuracy']),
            best_quiz_score=float(stats['best_accuracy']),
            total_flashcards_studied=int(stats['total_flashcards'])  # Actual flashcard count
        )
        
        logger.info(f"📊 [STATS] Generated for user {user_id[:8]}... - Quizzes: {stats['total_quizzes']}, Flashcards: {stats['total_flashcards']}, Sessions: {stats['total_study_sessions']}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching user stats for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user statistics")

@router.get("/recent-activity/{user_id}", response_model=List[RecentActivityItem])
@performance_monitor
async def get_recent_activity(
    user_id: str, 
    limit: int = Query(10, ge=1, le=50, description="Number of activities to return")
):
    """Get recent user activity with proper data from session_results and sessions tables."""
    user_id = validate_user_id(user_id)
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        async with db.get_connection() as conn:
            # Get recent activities from both session_results and chat sessions
            activity_query = """
            (
                SELECT 
                    sr.id as activity_id,
                    sr.session_type as activity_type,
                    COALESCE(sr.session_name, 'Study Session') as title,
                    CASE 
                        WHEN sr.session_type = 'quiz' THEN 
                            'Completed quiz with ' || ROUND(sr.accuracy_percentage) || '% accuracy (' || sr.total_questions || ' questions)'
                        WHEN sr.session_type = 'flashnotes' THEN 
                            'Studied ' || sr.total_questions || ' flashcards with ' || ROUND(sr.accuracy_percentage) || '% mastery'
                        ELSE 'Completed study session'
                    END as description,
                    sr.completed_at as timestamp,
                    sr.accuracy_percentage as score,
                    sr.time_spent_seconds as duration,
                    'session' as source_type
                FROM session_results sr
                WHERE sr.user_id::text = $1 AND sr.completed_at IS NOT NULL
                ORDER BY sr.completed_at DESC
                LIMIT $2
            )
            UNION ALL
            (
                SELECT 
                    s.session_id as activity_id,
                    'chat' as activity_type,
                    COALESCE(s.topic, 'AI Chat Session') as title,
                    CASE 
                        WHEN s.topic IS NOT NULL AND LENGTH(s.topic) > 0 
                        THEN 'Discussed: ' || LEFT(s.topic, 100)
                        ELSE 'Started new AI conversation'
                    END as description,
                    s.created_at as timestamp,
                    NULL as score,
                    NULL as duration,
                    'chat' as source_type
                FROM sessions s
                WHERE s.user_id::text = $1 AND s.is_active = true AND s.created_at IS NOT NULL
                ORDER BY s.created_at DESC
                LIMIT $3
            )
            ORDER BY timestamp DESC NULLS LAST
            LIMIT $4
            """
            
            # Calculate limits for mixed results
            session_limit = max(limit // 2, 5)
            chat_limit = max(limit // 2, 5)
            
            activities = await conn.fetch(
                activity_query, 
                user_id, 
                session_limit, 
                chat_limit, 
                limit
            )

            activity_items = []
            for activity in activities:
                try:
                    # Generate consistent ID
                    activity_id = str(activity['activity_id'])
                    if activity['source_type'] == 'chat':
                        numeric_id = abs(hash(f"chat_{activity_id}")) % 999999 + 2000000
                    else:
                        numeric_id = int(activity_id) if activity_id.isdigit() else abs(hash(f"session_{activity_id}")) % 999999 + 1000000

                    activity_items.append(RecentActivityItem(
                        id=numeric_id,
                        activity_type=activity['activity_type'],
                        title=activity['title'] or "Study Activity",
                        description=activity['description'] or "No description",
                        timestamp=normalize_datetime(activity['timestamp']) or datetime.now(),
                        score=float(activity['score']) if activity['score'] is not None else None,
                        duration=activity['duration']
                    ))
                except Exception as e:
                    logger.warning(f"⚠️ Skipping invalid activity: {e}")
                    continue

            logger.info(f"📋 [ACTIVITY] Retrieved {len(activity_items)} activities for user {user_id[:8]}...")
            return activity_items

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching recent activity for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching recent activity")

@router.get("/achievements/{user_id}", response_model=List[Achievement])
@performance_monitor
async def get_user_achievements(user_id: str):
    """Get user achievements based on their activity."""
    user_id = validate_user_id(user_id)
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get stats for achievement calculation
        stats = await get_user_stats(user_id)
        
        achievements = []
        now = datetime.now()

        # Define achievements based on user activity
        achievement_definitions = [
            {
                'condition': stats.get('total_quizzes', 0) >= 1,
                'achievement': Achievement(
                    id="first_quiz",
                    name="First Quiz Master",
                    description="Completed your first quiz",
                    icon="Target",
                    color="text-green-500",
                    earned_at=now,
                    category="quiz"
                )
            },
            {
                'condition': stats.get('chat_count', 0) >= 5,
                'achievement': Achievement(
                    id="chat_enthusiast",
                    name="Chat Enthusiast",
                    description="Started 5 chat sessions",
                    icon="Zap",
                    color="text-blue-500",
                    earned_at=now,
                    category="chat"
                )
            },
            {
                'condition': stats.get('total_study_sessions', 0) >= 3,
                'achievement': Achievement(
                    id="study_streak",
                    name="Study Streak",
                    description="Completed 3 study sessions",
                    icon="BookOpen",
                    color="text-purple-500",
                    earned_at=now,
                    category="study"
                )
            },
            {
                'condition': stats.get('excellent_quizzes', 0) >= 1,
                'achievement': Achievement(
                    id="perfectionist",
                    name="Perfectionist",
                    description="Scored 90%+ on a quiz",
                    icon="Award",
                    color="text-yellow-500",
                    earned_at=now,
                    category="performance"
                )
            },
            {
                'condition': stats.get('total_flashcards', 0) >= 1,
                'achievement': Achievement(
                    id="flashcard_master",
                    name="Flashcard Master",
                    description="Completed flashcard study session",
                    icon="Brain",
                    color="text-pink-500",
                    earned_at=now,
                    category="flashcards"
                )
            }
        ]

        # Add earned achievements
        for definition in achievement_definitions:
            if definition['condition']:
                achievements.append(definition['achievement'])

        logger.info(f"🏆 [ACHIEVEMENTS] Generated {len(achievements)} achievements for user {user_id[:8]}...")
        return achievements

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching achievements for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching achievements")

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
@performance_monitor
async def get_user_profile(user_id: str):
    """Get complete user profile with fresh data from database."""
    user_id = validate_user_id(user_id)
    
    try:
        # Check if user exists first
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        # Fetch all profile data in parallel for better performance
        stats_task = get_user_stats_endpoint(user_id)
        activity_task = get_recent_activity(user_id, 10)
        achievements_task = get_user_achievements(user_id)
        
        # Wait for all tasks to complete
        stats, recent_activity, achievements = await asyncio.gather(
            stats_task, activity_task, achievements_task
        )
        
        response = UserProfileResponse(
            stats=stats,
            recent_activity=recent_activity,
            achievements=achievements
        )
        
        logger.info(f"👤 [PROFILE] Complete profile generated for user {user_id[:8]}...")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching user profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user profile")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        async with db.get_connection() as conn:
            await conn.fetchval("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "database": "disconnected",
            "error": str(e)
        } 
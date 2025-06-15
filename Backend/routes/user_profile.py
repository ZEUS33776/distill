from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, validator, Field
from Database.connection import db
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Union
import json
import uuid
import asyncio
import logging
from functools import wraps
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

# Cache for user stats (simple in-memory cache)
_stats_cache = {}
_cache_ttl = 300  # 5 minutes

def cache_key(user_id: str, endpoint: str) -> str:
    """Generate cache key for user data"""
    return f"{endpoint}:{user_id}"

def is_cache_valid(cache_entry: Dict[str, Any]) -> bool:
    """Check if cache entry is still valid"""
    return time.time() - cache_entry['timestamp'] < _cache_ttl

def get_from_cache(user_id: str, endpoint: str) -> Optional[Any]:
    """Get data from cache if valid"""
    key = cache_key(user_id, endpoint)
    if key in _stats_cache and is_cache_valid(_stats_cache[key]):
        logger.info(f"📦 [CACHE-HIT] {endpoint} for user {user_id[:8]}...")
        return _stats_cache[key]['data']
    return None

def set_cache(user_id: str, endpoint: str, data: Any) -> None:
    """Set data in cache"""
    key = cache_key(user_id, endpoint)
    _stats_cache[key] = {
        'data': data,
        'timestamp': time.time()
    }
    logger.info(f"💾 [CACHE-SET] {endpoint} for user {user_id[:8]}...")

def validate_user_id(user_id: str) -> str:
    """Validate user ID format and return normalized version"""
    if not user_id or not user_id.strip():
        raise HTTPException(status_code=400, detail="User ID cannot be empty")
    
    user_id = user_id.strip()
    
    try:
        # Try to parse as UUID to validate format
        uuid.UUID(user_id)
        return user_id
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format - must be a valid UUID")

async def check_user_exists(user_id: str) -> bool:
    """Check if user exists in the database"""
    try:
        async with db.get_connection() as conn:
            result = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1 AND is_active = true)",
                user_id
            )
            return bool(result)
    except Exception as e:
        logger.error(f"❌ Error checking user existence: {e}")
        return False

def performance_monitor(func):
    """Decorator to monitor endpoint performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        endpoint_name = func.__name__
        user_id = kwargs.get('user_id', 'unknown')
        
        try:
            logger.info(f"🚀 [START] {endpoint_name} for user {user_id[:8]}...")
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"✅ [SUCCESS] {endpoint_name} completed in {duration:.3f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ [ERROR] {endpoint_name} failed after {duration:.3f}s: {e}")
            raise
    return wrapper

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
        allowed_types = {'quiz', 'flashnotes', 'chat', 'study'}
        if v not in allowed_types:
            raise ValueError(f"Activity type must be one of: {allowed_types}")
        return v

class Achievement(BaseModel):
    id: str = Field(min_length=1, max_length=50, description="Unique achievement ID")
    name: str = Field(min_length=1, max_length=100, description="Achievement name")
    description: str = Field(min_length=1, max_length=200, description="Achievement description")
    icon: str = Field(min_length=1, max_length=50, description="Icon name")
    color: str = Field(regex=r'^text-\w+-\d+$', description="Tailwind CSS color class")
    earned_at: datetime = Field(description="When the achievement was earned")
    category: str = Field(min_length=1, max_length=50, description="Achievement category")

class UserProfileResponse(BaseModel):
    stats: UserStatsResponse
    recent_activity: List[RecentActivityItem]
    achievements: List[Achievement]
    cache_info: Optional[Dict[str, Any]] = Field(None, description="Cache metadata")

def normalize_datetime(dt: Any) -> Optional[datetime]:
    """Convert datetime to timezone-naive for consistent comparison"""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    return None

async def get_optimized_user_stats(user_id: str) -> Dict[str, Any]:
    """Get user statistics with a single optimized query"""
    query = """
    WITH session_stats AS (
        SELECT 
            COUNT(DISTINCT CASE WHEN type = 'quiz' THEN session_id END) as quiz_sessions,
            COUNT(DISTINCT CASE WHEN type = 'flashnotes' THEN session_id END) as flashnote_sessions,
            COUNT(DISTINCT session_id) as total_study_sessions
        FROM study_sessions 
        WHERE user_id = $1 AND is_active = true
    ),
    results_stats AS (
        SELECT 
            COUNT(*) as total_completed_sessions,
            COALESCE(AVG(accuracy_percentage), 0) as avg_accuracy,
            COALESCE(MAX(accuracy_percentage), 0) as best_accuracy,
            COALESCE(SUM(time_spent_seconds), 0) as total_time,
            COALESCE(SUM(total_questions), 0) as total_questions_answered,
            COUNT(CASE WHEN accuracy_percentage >= 90 THEN 1 END) as excellent_sessions,
            COUNT(CASE WHEN session_type = 'quiz' THEN 1 END) as quiz_results,
            COUNT(CASE WHEN session_type = 'flashnotes' THEN 1 END) as flashnote_results
        FROM session_results 
        WHERE user_id = $1
    ),
    chat_stats AS (
        SELECT COUNT(DISTINCT session_id) as chat_count
        FROM sessions 
        WHERE user_id = $1 AND is_active = true
    )
    SELECT 
        COALESCE(ss.quiz_sessions, 0) as quiz_sessions,
        COALESCE(ss.flashnote_sessions, 0) as flashnote_sessions,
        COALESCE(ss.total_study_sessions, 0) as total_study_sessions,
        COALESCE(rs.total_completed_sessions, 0) as total_completed_sessions,
        COALESCE(rs.avg_accuracy, 0) as avg_accuracy,
        COALESCE(rs.best_accuracy, 0) as best_accuracy,
        COALESCE(rs.total_time, 0) as total_time,
        COALESCE(rs.total_questions_answered, 0) as total_questions_answered,
        COALESCE(rs.excellent_sessions, 0) as excellent_sessions,
        COALESCE(rs.quiz_results, 0) as quiz_results,
        COALESCE(rs.flashnote_results, 0) as flashnote_results,
        COALESCE(cs.chat_count, 0) as chat_count
    FROM session_stats ss
    CROSS JOIN results_stats rs
    CROSS JOIN chat_stats cs
    """
    
    async with db.get_connection() as conn:
        result = await conn.fetchrow(query, user_id)
        if result:
            return dict(result)
        else:
            # Return default stats if no data found
            return {
                'quiz_sessions': 0, 'flashnote_sessions': 0, 'total_study_sessions': 0,
                'total_completed_sessions': 0, 'avg_accuracy': 0, 'best_accuracy': 0,
                'total_time': 0, 'total_questions_answered': 0, 'excellent_sessions': 0,
                'quiz_results': 0, 'flashnote_results': 0, 'chat_count': 0
            }

def calculate_achievements_count_from_stats(stats: Dict[str, Any]) -> int:
    """Calculate achievements count from stats"""
    count = 0
    try:
        if stats.get('quiz_results', 0) >= 1:
            count += 1  # First Quiz Master
        if stats.get('chat_count', 0) >= 5:
            count += 1  # Chat Enthusiast
        if stats.get('total_completed_sessions', 0) >= 3:
            count += 1  # Study Streak
        if stats.get('excellent_sessions', 0) >= 1:
            count += 1  # Perfectionist
        if stats.get('flashnote_results', 0) >= 1:
            count += 1  # Flashcard Master
    except Exception as e:
        logger.warning(f"⚠️ Error calculating achievements: {e}")
    return count

def calculate_overall_progress_from_stats(stats: Dict[str, Any]) -> float:
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
async def get_user_stats(user_id: str):
    """
    Get comprehensive user statistics for the profile page.
    Includes caching and optimized database queries.
    """
    # Validate and normalize user ID
    user_id = validate_user_id(user_id)
    
    # Check cache first
    cached_stats = get_from_cache(user_id, 'stats')
    if cached_stats:
        return cached_stats
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            logger.warning(f"⚠️ User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get optimized stats
        stats = await get_optimized_user_stats(user_id)
        
        # Calculate derived values
        achievements_count = calculate_achievements_count_from_stats(stats)
        overall_progress = calculate_overall_progress_from_stats(stats)
        
        # Build response
        response = UserStatsResponse(
            chats_started=int(stats['chat_count']),
            quizzes_taken=int(stats['quiz_sessions']),
            study_sessions=int(stats['total_study_sessions']),
            achievements=achievements_count,
            overall_progress=overall_progress,
            total_study_time=int(stats['total_time']),
            avg_quiz_accuracy=float(stats['avg_accuracy']),
            best_quiz_score=float(stats['best_accuracy']),
            total_flashcards_studied=int(stats['total_questions_answered'])
        )
        
        # Cache the response
        set_cache(user_id, 'stats', response)
        
        logger.info(f"📊 [STATS] Generated for user {user_id[:8]}... - {stats['total_study_sessions']} sessions, {achievements_count} achievements")
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
    """
    Get recent user activity with optimized queries and proper error handling.
    """
    # Validate and normalize user ID
    user_id = validate_user_id(user_id)
    
    # Check cache first
    cache_key_str = f"activity_{limit}"
    cached_activity = get_from_cache(user_id, cache_key_str)
    if cached_activity:
        return cached_activity
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        async with db.get_connection() as conn:
            # Optimized query using UNION for better performance
            activity_query = """
            (
                SELECT 
                    sr.id::text as activity_id,
                    sr.session_type as activity_type,
                    COALESCE(sr.session_name, ss.name, 'Study Session') as title,
                    CASE 
                        WHEN sr.session_type = 'quiz' THEN 'Scored ' || ROUND(COALESCE(sr.accuracy_percentage, 0)) || '% accuracy'
                        WHEN sr.session_type = 'flashnotes' THEN 'Studied ' || ROUND(COALESCE(sr.accuracy_percentage, 0)) || '% mastery rate'
                        ELSE 'Completed study session'
                    END as description,
                    sr.completed_at as timestamp,
                    sr.accuracy_percentage as score,
                    sr.time_spent_seconds as duration,
                    'session' as source_type
                FROM session_results sr
                LEFT JOIN study_sessions ss ON sr.study_session_id = ss.id
                WHERE sr.user_id = $1 AND sr.completed_at IS NOT NULL
                ORDER BY sr.completed_at DESC
                LIMIT $2
            )
            UNION ALL
            (
                SELECT 
                    s.session_id::text as activity_id,
                    'chat' as activity_type,
                    COALESCE(s.topic, 'Chat Session') as title,
                    'Started new conversation' as description,
                    s.created_at as timestamp,
                    NULL as score,
                    NULL as duration,
                    'chat' as source_type
                FROM sessions s
                WHERE s.user_id = $1 AND s.is_active = true AND s.created_at IS NOT NULL
                ORDER BY s.created_at DESC
                LIMIT $3
            )
            ORDER BY timestamp DESC NULLS LAST
            LIMIT $4
            """
            
            # Calculate limits for each query part
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
                    activity_id = activity['activity_id']
                    if activity['source_type'] == 'chat':
                        activity_id = str(abs(hash(activity_id)) % 1000000)
                    
                    # Ensure we have a valid integer ID
                    try:
                        numeric_id = int(activity_id) if activity_id.isdigit() else abs(hash(activity_id)) % 1000000
                    except (ValueError, TypeError):
                        numeric_id = abs(hash(str(activity_id))) % 1000000

                    activity_items.append(RecentActivityItem(
                        id=numeric_id,
                        activity_type=activity['activity_type'],
                        title=activity['title'] or "Unknown Activity",
                        description=activity['description'] or "No description",
                        timestamp=normalize_datetime(activity['timestamp']) or datetime.now(),
                        score=float(activity['score']) if activity['score'] is not None else None,
                        duration=activity['duration']
                    ))
                except Exception as e:
                    logger.warning(f"⚠️ Skipping invalid activity: {e}")
                    continue

            # Cache the response
            set_cache(user_id, cache_key_str, activity_items)
            
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
    """
    Get user achievements with robust error handling and caching.
    """
    # Validate and normalize user ID
    user_id = validate_user_id(user_id)
    
    # Check cache first
    cached_achievements = get_from_cache(user_id, 'achievements')
    if cached_achievements:
        return cached_achievements
    
    try:
        # Check if user exists
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get stats for achievement calculation
        stats = await get_optimized_user_stats(user_id)
        
        achievements = []
        now = datetime.now()

        # Define achievements based on user activity
        achievement_definitions = [
            {
                'condition': stats.get('quiz_results', 0) >= 1,
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
                'condition': stats.get('total_completed_sessions', 0) >= 3,
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
                'condition': stats.get('excellent_sessions', 0) >= 1,
                'achievement': Achievement(
                    id="perfectionist",
                    name="Perfectionist",
                    description="Achieved 90%+ accuracy",
                    icon="Award",
                    color="text-yellow-500",
                    earned_at=now,
                    category="performance"
                )
            },
            {
                'condition': stats.get('flashnote_results', 0) >= 1,
                'achievement': Achievement(
                    id="flashcard_master",
                    name="Flashcard Master",
                    description="Completed flashcard session",
                    icon="Brain",
                    color="text-pink-500",
                    earned_at=now,
                    category="flashcards"
                )
            }
        ]

        # Add achievements that meet conditions
        for definition in achievement_definitions:
            if definition['condition']:
                achievements.append(definition['achievement'])

        # Cache the response
        set_cache(user_id, 'achievements', achievements)
        
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
    """
    Get complete user profile with parallel data fetching and comprehensive error handling.
    """
    # Validate and normalize user ID
    user_id = validate_user_id(user_id)
    
    try:
        # Check if user exists first
        if not await check_user_exists(user_id):
            raise HTTPException(status_code=404, detail="User not found")
        
        # Fetch all profile data in parallel for better performance
        stats_task = get_user_stats(user_id)
        activity_task = get_recent_activity(user_id, 10)
        achievements_task = get_user_achievements(user_id)
        
        # Wait for all tasks to complete
        stats, recent_activity, achievements = await asyncio.gather(
            stats_task, activity_task, achievements_task,
            return_exceptions=True
        )
        
        # Handle any exceptions from parallel tasks
        if isinstance(stats, Exception):
            logger.error(f"❌ Stats fetch failed: {stats}")
            raise HTTPException(status_code=500, detail="Error fetching user statistics")
        
        if isinstance(recent_activity, Exception):
            logger.warning(f"⚠️ Activity fetch failed: {recent_activity}")
            recent_activity = []  # Fallback to empty list
        
        if isinstance(achievements, Exception):
            logger.warning(f"⚠️ Achievements fetch failed: {achievements}")
            achievements = []  # Fallback to empty list

        # Build response with cache info
        response = UserProfileResponse(
            stats=stats,
            recent_activity=recent_activity,
            achievements=achievements,
            cache_info={
                'generated_at': datetime.now().isoformat(),
                'ttl_seconds': _cache_ttl,
                'user_id_hash': user_id[:8] + '...'
            }
        )
        
        logger.info(f"👤 [PROFILE] Complete profile generated for user {user_id[:8]}...")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching user profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user profile")

@router.delete("/cache/{user_id}")
async def clear_user_cache(user_id: str):
    """
    Clear cache for a specific user (admin/debug endpoint).
    """
    user_id = validate_user_id(user_id)
    
    try:
        # Remove all cache entries for this user
        keys_to_remove = [key for key in _stats_cache.keys() if user_id in key]
        for key in keys_to_remove:
            del _stats_cache[key]
        
        logger.info(f"🗑️ [CACHE-CLEAR] Cleared {len(keys_to_remove)} cache entries for user {user_id[:8]}...")
        return {"message": f"Cache cleared for user", "entries_removed": len(keys_to_remove)}
    
    except Exception as e:
        logger.error(f"❌ Error clearing cache for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error clearing user cache")

@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    try:
        # Test database connection
        async with db.get_connection() as conn:
            await conn.fetchval("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "cache_entries": len(_stats_cache),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Legacy function for backward compatibility (if needed)
async def calculate_achievements_count(conn, user_id: str, results_stats) -> int:
    """Legacy function - use calculate_achievements_count_from_stats instead"""
    logger.warning("⚠️ Using legacy calculate_achievements_count function")
    stats = await get_optimized_user_stats(user_id)
    return calculate_achievements_count_from_stats(stats)

def calculate_overall_progress(session_counts, results_stats, chat_count) -> float:
    """Legacy function - use calculate_overall_progress_from_stats instead"""
    logger.warning("⚠️ Using legacy calculate_overall_progress function")
    stats = {
        'total_study_sessions': session_counts.get('total_study_sessions', 0) if session_counts else 0,
        'chat_count': chat_count or 0,
        'avg_accuracy': results_stats.get('avg_accuracy', 0) if results_stats else 0
    }
    return calculate_overall_progress_from_stats(stats) 
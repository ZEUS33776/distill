import asyncio
import asyncpg
import psycopg2
from config import settings
import requests
import json
import uuid
from datetime import datetime

async def test_both_endpoints():
    """Comprehensive test of both sync and async endpoints"""
    
    print("=" * 60)
    print("🧪 COMPREHENSIVE DATABASE STORAGE TEST")
    print("=" * 60)
    
    # Generate UUIDs for testing
    sync_session_id = str(uuid.uuid4())
    async_session_id = str(uuid.uuid4())
    test_user_id = str(uuid.uuid4())
    
    print(f"🔍 Sync test session_id: {sync_session_id}")
    print(f"🔍 Async test session_id: {async_session_id}")
    print(f"🔍 Test user_id: {test_user_id}")
    print()
    
    # Check initial state
    initial_count = await get_message_count_async()
    print(f"📊 Initial messages in database: {initial_count}")
    print()
    
    # Test 1: Sync Endpoint
    print("=" * 40)
    print("🔧 TEST 1: SYNC ENDPOINT (/query-llm)")
    print("=" * 40)
    print("📝 This endpoint should use:")
    print("   - Synchronous FastAPI function (def, not async def)")
    print("   - psycopg2 for database connections")
    print("   - %s placeholders for SQL")
    print("   - Manual connection management")
    print()
    
    sync_success = await test_sync_endpoint(sync_session_id, test_user_id)
    
    # Test 2: Async Endpoint  
    print("=" * 40)
    print("🔧 TEST 2: ASYNC ENDPOINT (/query-llm-async)")
    print("=" * 40)
    print("📝 This endpoint should use:")
    print("   - Asynchronous FastAPI function (async def)")
    print("   - asyncpg for database connections")
    print("   - $1, $2, $3 placeholders for SQL")
    print("   - Connection pool management")
    print()
    
    async_success = await test_async_endpoint(async_session_id, test_user_id)
    
    # Final verification
    print("=" * 40)
    print("🔍 FINAL VERIFICATION")
    print("=" * 40)
    
    final_count = await get_message_count_async()
    print(f"📊 Final messages in database: {final_count}")
    print(f"📈 Messages added during test: {final_count - initial_count}")
    print()
    
    # Check messages for both sessions
    sync_messages = await get_messages_for_session(sync_session_id)
    async_messages = await get_messages_for_session(async_session_id)
    
    print(f"🔍 Sync endpoint stored {len(sync_messages)} messages")
    print(f"🔍 Async endpoint stored {len(async_messages)} messages")
    print()
    
    # Summary
    print("=" * 40)
    print("📋 TEST SUMMARY")
    print("=" * 40)
    
    print(f"✅ Sync endpoint working: {'YES' if sync_success else 'NO'}")
    print(f"✅ Async endpoint working: {'YES' if async_success else 'NO'}")
    print(f"✅ Sync DB storage working: {'YES' if len(sync_messages) > 0 else 'NO'}")
    print(f"✅ Async DB storage working: {'YES' if len(async_messages) > 0 else 'NO'}")
    
    if len(sync_messages) == 0:
        print()
        print("🔍 DEBUGGING SYNC ENDPOINT:")
        await debug_sync_database_connection()

async def test_sync_endpoint(session_id, user_id):
    """Test the synchronous endpoint"""
    try:
        url = "http://localhost:8000/query-llm"
        payload = {
            "query": "Sync endpoint test - explain photosynthesis briefly",
            "user_id": user_id,
            "session_id": session_id
        }
        
        print(f"📤 Sending request to {url}")
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"✅ Sync endpoint response received ({len(response_data.get('response', ''))} chars)")
            return True
        else:
            print(f"❌ Sync endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing sync endpoint: {e}")
        return False

async def test_async_endpoint(session_id, user_id):
    """Test the asynchronous endpoint"""
    try:
        url = "http://localhost:8000/query-llm-async"
        payload = {
            "query": "Async endpoint test - explain gravity briefly", 
            "user_id": user_id,
            "session_id": session_id
        }
        
        print(f"📤 Sending request to {url}")
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"✅ Async endpoint response received ({len(response_data.get('response', ''))} chars)")
            return True
        else:
            print(f"❌ Async endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing async endpoint: {e}")
        return False

async def get_message_count_async():
    """Get total message count using async connection"""
    try:
        conn = await asyncpg.connect(
            host=settings.PGHOST,
            port=settings.PGPORT,
            user=settings.PGUSER,
            password=settings.PGPASSWORD,
            database=settings.PGDATABASE
        )
        
        count = await conn.fetchval("SELECT COUNT(*) FROM messages")
        await conn.close()
        return count
        
    except Exception as e:
        print(f"❌ Error getting message count: {e}")
        return 0

async def get_messages_for_session(session_id):
    """Get messages for a specific session"""
    try:
        conn = await asyncpg.connect(
            host=settings.PGHOST,
            port=settings.PGPORT,
            user=settings.PGUSER,
            password=settings.PGPASSWORD,
            database=settings.PGDATABASE
        )
        
        messages = await conn.fetch(
            "SELECT role, content, timestamp FROM messages WHERE session_id = $1 ORDER BY timestamp",
            session_id
        )
        await conn.close()
        return messages
        
    except Exception as e:
        print(f"❌ Error getting messages for session: {e}")
        return []

async def debug_sync_database_connection():
    """Debug the synchronous database connection"""
    print("🔧 Testing sync database connection directly...")
    
    try:
        # Test sync connection (like our sync endpoint should use)
        conn = psycopg2.connect(
            host=settings.PGHOST,
            port=settings.PGPORT,
            user=settings.PGUSER,
            password=settings.PGPASSWORD,
            database=settings.PGDATABASE
        )
        
        with conn.cursor() as cursor:
            # Test a simple query
            cursor.execute("SELECT COUNT(*) FROM messages")
            count = cursor.fetchone()[0]
            print(f"✅ Sync database connection works! Found {count} messages")
            
            # Test insert (like our sync endpoint should do)
            test_session = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO messages (session_id, role, content, timestamp) VALUES (%s, %s, %s, %s)",
                (test_session, "test", "Sync connection test", datetime.now())
            )
            print("✅ Sync database insert works!")
            
        conn.commit()
        conn.close()
        print("✅ Sync database connection test passed!")
        
    except Exception as e:
        print(f"❌ Sync database connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_both_endpoints()) 
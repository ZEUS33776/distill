import asyncio
import asyncpg
from config import settings
import requests
import json
import uuid

async def check_database_messages():
    """Check if messages are being stored in PostgreSQL"""
    try:
        # Generate proper UUIDs
        test_session_id = str(uuid.uuid4())
        test_user_id = str(uuid.uuid4())
        
        # Connect to database
        conn = await asyncpg.connect(
            host=settings.PGHOST,
            port=settings.PGPORT,
            user=settings.PGUSER,
            password=settings.PGPASSWORD,
            database=settings.PGDATABASE
        )
        
        # Count messages before test
        initial_count = await conn.fetchval("SELECT COUNT(*) FROM messages")
        print(f"📊 Messages in database before test: {initial_count}")
        
        # Close connection
        await conn.close()
        
        # Make test request to sync endpoint
        print("🧪 Testing sync LLM endpoint...")
        url = "http://localhost:8000/query-llm"
        payload = {
            "query": "Database storage verification test",
            "user_id": test_user_id,
            "session_id": test_session_id
        }
        
        print(f"🔍 Using session_id: {test_session_id}")
        print(f"🔍 Using user_id: {test_user_id}")
        
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Request failed: {response.text}")
            return
        
        # Wait a moment for processing
        await asyncio.sleep(2)
        
        # Check database again
        conn = await asyncpg.connect(
            host=settings.PGHOST,
            port=settings.PGPORT,
            user=settings.PGUSER,
            password=settings.PGPASSWORD,
            database=settings.PGDATABASE
        )
        
        final_count = await conn.fetchval("SELECT COUNT(*) FROM messages")
        print(f"📊 Messages in database after test: {final_count}")
        
        # Check specific messages with UUID
        recent_messages = await conn.fetch(
            "SELECT session_id, role, content, timestamp FROM messages WHERE session_id = $1 ORDER BY timestamp DESC LIMIT 5",
            test_session_id
        )
        
        print(f"🔍 Found {len(recent_messages)} messages for test session:")
        for msg in recent_messages:
            print(f"  - {msg['role']}: {msg['content'][:50]}... (time: {msg['timestamp']})")
        
        # Check ALL recent messages to see if any were stored
        all_recent = await conn.fetch(
            "SELECT session_id, role, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT 10"
        )
        
        print(f"🔍 Last 10 messages in database:")
        for msg in all_recent:
            print(f"  - Session: {msg['session_id'][:8]}... Role: {msg['role']}, Content: {msg['content'][:30]}...")
        
        if final_count > initial_count:
            print("✅ PostgreSQL storage is WORKING! Messages are being stored.")
        else:
            print("❌ PostgreSQL storage is NOT working! No new messages found.")
            
        await conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_database_messages()) 
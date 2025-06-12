import requests
import json

def test_sync_endpoint():
    """Test the sync LLM endpoint to verify database storage"""
    
    url = "http://localhost:8000/query-llm"
    payload = {
        "query": "Test sync database storage",
        "user_id": "test_user_sync",
        "session_id": "test_session_sync"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🧪 Testing sync LLM endpoint...")
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Sync endpoint working!")
        else:
            print("❌ Sync endpoint failed!")
            
    except Exception as e:
        print(f"❌ Error testing sync endpoint: {e}")

if __name__ == "__main__":
    test_sync_endpoint() 
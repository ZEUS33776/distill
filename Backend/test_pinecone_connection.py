import os
import sys
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

def test_pinecone_connection():
    """Test Pinecone connection and diagnose SSL issues"""
    
    try:
        # Initialize Pinecone client
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            print("❌ PINECONE_API_KEY not found in environment")
            return False
            
        print(f"🔍 Testing Pinecone connection with API key: {api_key[:8]}...")
        pc = Pinecone(api_key=api_key)
        
        # Test 1: List indexes
        print("📋 Testing list_indexes()...")
        indexes = pc.list_indexes()
        print(f"✅ Available indexes: {[idx.name for idx in indexes]}")
        
        # Test 2: Check if chatbot-index exists
        index_name = "chatbot-index"
        if index_name in [idx.name for idx in indexes]:
            print(f"✅ Index '{index_name}' exists")
            
            # Test 3: Connect to index
            print(f"🔗 Testing connection to index '{index_name}'...")
            index = pc.Index(index_name)
            
            # Test 4: Get index stats
            print("📊 Getting index stats...")
            stats = index.describe_index_stats()
            print(f"✅ Index stats: {stats}")
            
            # Test 5: Simple query test
            print("🔍 Testing simple query...")
            try:
                # Create a dummy vector (1024 dimensions for Cohere)
                dummy_vector = [0.1] * 1024
                
                result = index.query(
                    vector=dummy_vector,
                    top_k=1,
                    include_metadata=True
                )
                print(f"✅ Query successful: {len(result.matches)} matches found")
                
            except Exception as query_error:
                print(f"⚠️ Query test failed: {query_error}")
                
        else:
            print(f"❌ Index '{index_name}' not found")
            print("💡 Available indexes:", [idx.name for idx in indexes])
            
        return True
        
    except Exception as e:
        print(f"❌ Pinecone connection failed: {e}")
        print(f"Error type: {type(e).__name__}")
        
        # Check for SSL-specific errors
        if "SSL" in str(e) or "ssl" in str(e).lower():
            print("🔧 SSL Error detected - possible solutions:")
            print("1. Check if your Pinecone index is in the correct region")
            print("2. Verify your API key is valid")
            print("3. Check if your environment matches the index configuration")
            print("4. Try recreating the index with correct cloud/region settings")
            
        return False

def check_environment():
    """Check environment configuration"""
    print("🔍 Checking environment configuration...")
    
    required_vars = ["PINECONE_API_KEY", "COHERE_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            print(f"✅ {var}: {value[:8]}...")
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        return False
    
    return True

if __name__ == "__main__":
    print("🧪 Pinecone Connection Test\n")
    
    # Check environment first
    if not check_environment():
        sys.exit(1)
    
    # Test connection
    if test_pinecone_connection():
        print("\n✅ Pinecone connection test passed!")
    else:
        print("\n❌ Pinecone connection test failed!")
        sys.exit(1) 
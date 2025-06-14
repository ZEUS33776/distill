#!/usr/bin/env python3
"""
Comprehensive Application Test Suite
Tests all major components to identify issues
"""

import os
import sys
import asyncio
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AppTester:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        
    def log_test(self, test_name, status, message=""):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_emoji = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️", "INFO": "ℹ️"}
        print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {test_name}: {message}")
        
        self.results.append({"test": test_name, "status": status, "message": message})
        if status == "FAIL":
            self.failed_tests.append(test_name)

    def test_basic_imports(self):
        """Test basic Python imports"""
        self.log_test("Basic Imports", "INFO", "Testing core dependencies...")
        
        try:
            import fastapi
            self.log_test("FastAPI Import", "PASS", f"v{fastapi.__version__}")
        except Exception as e:
            self.log_test("FastAPI Import", "FAIL", str(e))
            
        try:
            import uvicorn
            self.log_test("Uvicorn Import", "PASS", f"v{uvicorn.__version__}")
        except Exception as e:
            self.log_test("Uvicorn Import", "FAIL", str(e))
            
        try:
            import asyncpg
            self.log_test("AsyncPG Import", "PASS", f"v{asyncpg.__version__}")
        except Exception as e:
            self.log_test("AsyncPG Import", "FAIL", str(e))
            
        try:
            import cohere
            self.log_test("Cohere Import", "PASS", "Available")
        except Exception as e:
            self.log_test("Cohere Import", "FAIL", str(e))
            
        try:
            from groq import Groq
            self.log_test("Groq Import", "PASS", "Available")
        except Exception as e:
            self.log_test("Groq Import", "FAIL", str(e))

    def test_pinecone_connectivity(self):
        """Test Pinecone connectivity options"""
        self.log_test("Pinecone Tests", "INFO", "Testing Pinecone connectivity...")
        
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            self.log_test("Pinecone API Key", "FAIL", "PINECONE_API_KEY not found")
            return
        else:
            self.log_test("Pinecone API Key", "PASS", f"Found (length: {len(api_key)})")
        
        # Test new API
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=api_key)
            indexes = pc.list_indexes()
            self.log_test("Pinecone NEW API", "PASS", f"Found {len(indexes)} indexes")
            
            # Test index connection
            try:
                index = pc.Index("chatbot-index")
                stats = index.describe_index_stats()
                self.log_test("Pinecone Index Stats", "PASS", f"{stats.get('total_vector_count', 0)} vectors")
            except Exception as e:
                self.log_test("Pinecone Index Stats", "FAIL", str(e))
                
        except Exception as e:
            self.log_test("Pinecone NEW API", "FAIL", str(e))
            
            # Test old API fallback
            try:
                import pinecone
                pinecone.init(api_key=api_key)
                indexes = pinecone.list_indexes()
                self.log_test("Pinecone OLD API", "PASS", f"Found {len(indexes)} indexes")
            except Exception as e:
                self.log_test("Pinecone OLD API", "FAIL", str(e))

    async def test_database_connectivity(self):
        """Test database connectivity"""
        self.log_test("Database Tests", "INFO", "Testing database connectivity...")
        
        try:
            from Database.connection import db
            
            # Test pool creation
            await db.create_pool()
            self.log_test("Database Pool", "PASS", "Connection pool created")
            
            # Test basic query
            async with db.get_connection() as conn:
                result = await conn.fetchval("SELECT 1")
                if result == 1:
                    self.log_test("Database Query", "PASS", "Basic query successful")
                else:
                    self.log_test("Database Query", "FAIL", f"Unexpected result: {result}")
                    
            # Test messages table
            async with db.get_connection() as conn:
                try:
                    count = await conn.fetchval("SELECT COUNT(*) FROM messages")
                    self.log_test("Messages Table", "PASS", f"{count} messages in database")
                except Exception as e:
                    self.log_test("Messages Table", "FAIL", str(e))
                    
            # Close pool
            await db.close_pool()
            self.log_test("Database Cleanup", "PASS", "Pool closed successfully")
            
        except Exception as e:
            self.log_test("Database Connection", "FAIL", str(e))

    def test_embedding_functionality(self):
        """Test embedding generation"""
        self.log_test("Embedding Tests", "INFO", "Testing embedding functionality...")
        
        try:
            from Processing.embed import embed_query
            
            test_text = "This is a test query for embedding"
            embedding = embed_query(test_text)
            
            if isinstance(embedding, list) and len(embedding) > 0:
                self.log_test("Embedding Generation", "PASS", f"Generated {len(embedding)}-dim embedding")
            else:
                self.log_test("Embedding Generation", "FAIL", "Invalid embedding format")
                
        except Exception as e:
            self.log_test("Embedding Generation", "FAIL", str(e))

    def test_llm_functionality(self):
        """Test LLM functionality"""
        self.log_test("LLM Tests", "INFO", "Testing LLM functionality...")
        
        try:
            from groq import Groq
            groq_api_key = os.getenv("GROQ_API_KEY")
            
            if not groq_api_key:
                self.log_test("Groq API Key", "FAIL", "GROQ_API_KEY not found")
                return
            else:
                self.log_test("Groq API Key", "PASS", f"Found (length: {len(groq_api_key)})")
            
            client = Groq(api_key=groq_api_key)
            
            # Test simple completion
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": "Say 'test successful'"}],
                model="llama3-8b-8192",
                max_tokens=10
            )
            
            if response.choices and response.choices[0].message.content:
                self.log_test("LLM API Call", "PASS", "Response received")
            else:
                self.log_test("LLM API Call", "FAIL", "No response content")
                
        except Exception as e:
            self.log_test("LLM API Call", "FAIL", str(e))

    def test_pdf_processing(self):
        """Test PDF processing functionality"""
        self.log_test("PDF Tests", "INFO", "Testing PDF processing...")
        
        # Test PyPDF2 (primary)
        try:
            import PyPDF2
            self.log_test("PyPDF2 Import", "PASS", f"v{PyPDF2.__version__}")
        except Exception as e:
            self.log_test("PyPDF2 Import", "FAIL", str(e))
            
        # Test PyMuPDF (secondary)
        try:
            import fitz  # PyMuPDF
            self.log_test("PyMuPDF Import", "PASS", f"v{fitz.version[0]}")
        except Exception as e:
            self.log_test("PyMuPDF Import", "FAIL", str(e))

    def test_environment_variables(self):
        """Test environment variables"""
        self.log_test("Environment Tests", "INFO", "Testing environment variables...")
        
        required_vars = [
            "PINECONE_API_KEY",
            "GROQ_API_KEY", 
            "PGHOST",
            "PGDATABASE",
            "PGUSER",
            "PGPASSWORD"
        ]
        
        for var in required_vars:
            value = os.getenv(var)
            if value:
                # Don't log full values for security
                length = len(value) if var.endswith("_KEY") else len(value)
                self.log_test(f"Env Var {var}", "PASS", f"Set (length: {length})")
            else:
                self.log_test(f"Env Var {var}", "FAIL", "Not set")

    def test_fastapi_app(self):
        """Test FastAPI app creation"""
        self.log_test("FastAPI Tests", "INFO", "Testing FastAPI app...")
        
        try:
            # Import the main app
            sys.path.append('.')
            from main import app
            
            if app:
                self.log_test("FastAPI App", "PASS", "App created successfully")
            else:
                self.log_test("FastAPI App", "FAIL", "App is None")
                
        except Exception as e:
            self.log_test("FastAPI App", "FAIL", str(e))

    async def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Application Tests")
        print("=" * 60)
        
        # Run tests in order
        self.test_basic_imports()
        print()
        
        self.test_environment_variables() 
        print()
        
        self.test_pinecone_connectivity()
        print()
        
        await self.test_database_connectivity()
        print()
        
        self.test_embedding_functionality()
        print()
        
        self.test_llm_functionality()
        print()
        
        self.test_pdf_processing()
        print()
        
        self.test_fastapi_app()
        print()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed = len([r for r in self.results if r["status"] == "PASS"])
        failed = len([r for r in self.results if r["status"] == "FAIL"])
        skipped = len([r for r in self.results if r["status"] == "SKIP"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⏭️ Skipped: {skipped}")
        
        if failed > 0:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        if failed == 0:
            print("\n🎉 All tests passed! Application should work correctly.")
        elif failed < 3:
            print("\n⚠️ Minor issues detected. Application may work with degraded functionality.")
        else:
            print("\n🚨 Major issues detected. Application needs fixes before deployment.")

async def main():
    tester = AppTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 
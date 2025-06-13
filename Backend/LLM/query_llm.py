import os
from groq import Groq
from dotenv import load_dotenv
from pinecone import Pinecone
from Database.connection import db
from datetime import datetime
import uuid
from Processing.embed import embed_query
import json
import asyncio

# Load environment variables
load_dotenv()
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)

async def query_llm(query, user_id, session_id, index_name="chatbot-index"):
    """Main async LLM query function with proper database storage"""
    try:
        print(f"🔍 Processing query (async): {query}")
        
        # Embed the query
        query_vector = embed_query(query)
        print(f"✅ Query embedded successfully")
        
        # Start user message storage in background and get context in parallel
        user_storage_task = asyncio.create_task(
            store_message_async(query, "user", session_id, user_id, index_name)
        )
        print(f"🚀 User message storage started in background")
        
        # Get all types of context (can happen in parallel with user storage)
        recent_messages, relevant_messages, relevant_embeddings = await getContext(query_vector, user_id, session_id, index_name)
        
        # Optionally wait for user storage to complete (but this is fast so it shouldn't block much)
        try:
            await user_storage_task
            print(f"✅ User message storage completed")
        except Exception as e:
            print(f"⚠️ User message storage failed (continuing anyway): {e}")
        
        # Build comprehensive context
        context_parts = []
        if relevant_embeddings and relevant_embeddings.strip():
            context_parts.append(f"Knowledge Base Context: {relevant_embeddings}")
        if relevant_messages and relevant_messages.strip():
            context_parts.append(f"Relevant Previous Messages: {relevant_messages}")
        if recent_messages and recent_messages.strip():
            context_parts.append(f"Recent Conversation History: {recent_messages}")
        
        if context_parts:
            context = "\n\n".join(context_parts)
        else:
            context = "No specific context available. Please provide information or ask a question."
        
        print(f"📝 Context built: {len(context)} characters")

        # Prepare messages for LLM
        messages = [
            {
                "role": "system",
                "content": """You are a helpful educational assistant. When responding:

1. **For quiz requests**: Respond ONLY with:
   `{"type": "quiz", "body": [{"question": "...", "options": ["a", "b", "c", "d"], "answer": "...", "explanation": "..."}, ...]}`

2. **For flashcard requests**: Respond ONLY with:
   `{"type": "flashnotes", "body": {"flashcards": [{"front": "Question or concept to test", "back": "Answer or explanation"}, ...]}}`

3. **For general questions**: Provide explanation in:
   `{"type": "response", "body": "..."}`

**Flashcard Guidelines:**
- front: Clear question, definition prompt, or concept to test
- back: Complete answer, definition, or explanation
- Create 8-12 flashcards covering key concepts
- Focus on testable knowledge and understanding
- Use question format: "What is...?", "How does...?", "Define...", etc.

**Examples:**
- front: "What is polymorphism in OOP?"
- back: "Polymorphism allows objects of different types to be treated as instances of the same type through a common interface."

Always respond with only the raw JSON object, no extra text.

User Query: {query}\n\nContext: {context}"""
            },
            {
                "role": "user", 
                "content": f"User Query: {query}\n\nContext: {context}"
            }
        ]

        # Call Groq API
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        print(f"🤖 Calling Groq API...")
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature=0.7,
            max_tokens=1000
        )

        assistant_response = chat_completion.choices[0].message.content
        print(f"✅ LLM response received: {len(assistant_response)} characters")
        
        print(assistant_response)
        
        # Parse and prepare the response first
        response_to_return = None
        try:
            parsed_response = json.loads(assistant_response)
            # If it's already a properly formatted response, return it directly
            if isinstance(parsed_response, dict) and "type" in parsed_response and "body" in parsed_response:
                response_to_return = parsed_response
            else:
                # Otherwise wrap it in a response object
                response_to_return = {
                    "type": "response",
                    "body": str(parsed_response)
                }
        except json.JSONDecodeError:
            # If it's not valid JSON, wrap the raw response
            response_to_return = {
                "type": "response",
                "body": assistant_response
            }
        
        # Store assistant message in background (don't wait for it)
        asyncio.create_task(
            store_message_async(assistant_response, "assistant", session_id, user_id, index_name)
        )
        print(f"🚀 Assistant message storage started in background")
        
        # Return response immediately
        return response_to_return

    except Exception as e:
        print(f"❌ Error in query_llm: {e}")
        return {
            "type": "error",
            "body": f"I apologize, but I encountered an error processing your request: {str(e)}"
        }

async def getContext(query_vector, user_id, session_id, index_name="chatbot-index"):
    try:
        print(f"🔍 Getting context for user {user_id}, session {session_id}")
        index = pc.Index(index_name)

        # 1. Query for relevant embeddings (knowledge base) from Pinecone
        embedding_results = index.query(
            vector=query_vector,
            top_k=3,
            filter={
                "user_id": user_id,
                "type": "embedding"
            },
            include_metadata=True,
            namespace=user_id
        )

        # 2. Query for relevant messages from Pinecone
        relevant_message_results = index.query(
            vector=query_vector,
            top_k=5,
            filter={
                "user_id": user_id,
                "type": "message"
            },
            include_metadata=True,
            namespace=user_id
        )

        # 3. Get last 5 conversations from PostgreSQL database (chronological)
        recent_conversation_context = []
        try:
            async with db.get_connection() as conn:
                # Get last 5 messages ordered by timestamp DESC, then reverse for chronological order
                recent_messages = await conn.fetch(
                    """
                    SELECT role, content, timestamp 
                    FROM messages 
                    WHERE session_id = $1 
                    ORDER BY timestamp DESC 
                    LIMIT 5
                    """,
                    session_id
                )
                
                # Reverse to get chronological order (oldest to newest)
                recent_messages = list(reversed(recent_messages))
                
                for msg in recent_messages:
                    role = msg['role']
                    content = msg['content']
                    timestamp = msg['timestamp'].strftime("%H:%M")
                    recent_conversation_context.append(f"[{timestamp}] {role.title()}: {content}")
                
                print(f"📚 Found {len(recent_messages)} recent conversation messages")
                
        except Exception as db_error:
            print(f"⚠️ Error fetching conversation history: {db_error}")

        # Extract relevant embeddings context
        relevant_embeddings_context = []
        for match in embedding_results.get("matches", []):
            if "text" in match.get("metadata", {}):
                relevant_embeddings_context.append(match["metadata"]["text"])

        # Extract relevant messages context
        relevant_messages_context = []
        for match in relevant_message_results.get("matches", []):
            if "text" in match.get("metadata", {}):
                user_type = match["metadata"].get("user_type", "unknown")
                timestamp = match["metadata"].get("timestamp", "")
                text = match["metadata"]["text"]
                if timestamp:
                    try:
                        # Parse ISO timestamp and format as HH:MM
                        from datetime import datetime
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        time_str = dt.strftime("%H:%M")
                        relevant_messages_context.append(f"[{time_str}] {user_type.title()}: {text}")
                    except:
                        relevant_messages_context.append(f"{user_type.title()}: {text}")
                else:
                    relevant_messages_context.append(f"{user_type.title()}: {text}")

        # Convert to text
        recent_messages_text = "\n".join(recent_conversation_context) if recent_conversation_context else ""
        relevant_messages_text = "\n".join(relevant_messages_context) if relevant_messages_context else ""
        relevant_embeddings_text = "\n".join(relevant_embeddings_context) if relevant_embeddings_context else ""
        
        print(f"📚 Found {len(relevant_embeddings_context)} relevant embeddings, {len(relevant_messages_context)} relevant messages, {len(recent_conversation_context)} recent messages")
        
        return recent_messages_text, relevant_messages_text, relevant_embeddings_text

    except Exception as e:
        print(f"❌ Error getting context: {e}")
        return "", "", ""

async def store_message_async(query, user_type, session_id, user_id, index_name="chatbot-index"):
    """Proper async message storage - optimized for background execution"""
    start_time = datetime.now()
    try:
        print(f"💾 Storing {user_type} message (async) - session: {session_id}")
        
        # Store in PostgreSQL database first (usually faster)
        db_success = False
        try:
            async with db.get_connection() as conn:
                await conn.execute(
                    "INSERT INTO messages (session_id, role, content, timestamp) VALUES ($1, $2, $3, $4)",
                    session_id, user_type, query, datetime.now()
                )
            db_success = True
            print(f"✅ Database storage successful ({user_type})")
        except Exception as db_error:
            print(f"⚠️ Database storage failed ({user_type}): {db_error}")

        # Store in Pinecone (sync operation) - can be slower
        pinecone_success = False
        try:
            index = pc.Index(index_name)
            index.upsert(
                vectors=[
                    {
                        "id": str(uuid.uuid4()),
                        "values": embed_query(query),
                        "metadata": {
                            "text": query,
                            "type": "message",
                            "session_id": session_id,
                            "user_type": user_type,
                            "user_id": user_id,
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                ],
                namespace=user_id
            )
            pinecone_success = True
            print(f"✅ Pinecone storage successful ({user_type})")
        except Exception as pinecone_error:
            print(f"⚠️ Pinecone storage failed ({user_type}): {pinecone_error}")
        
        # Log storage completion time
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"⏱️ Storage completed in {duration:.2f}s ({user_type}) - DB: {'✅' if db_success else '❌'}, Pinecone: {'✅' if pinecone_success else '❌'}")

    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"❌ Error in store_message_async after {duration:.2f}s ({user_type}): {e}")

# Backward compatibility aliases
query_llm_with_async_db = query_llm
store_messages_in_db = store_message_async

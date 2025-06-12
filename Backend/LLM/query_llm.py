import os
from groq import Groq
from dotenv import load_dotenv
from pinecone import Pinecone
from Database.connection import db
from datetime import datetime
import uuid
from Processing.embed import embed_query

# Load environment variables
load_dotenv()
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)

def query_llm(query, user_id, session_id, index_name="chatbot-index"):
    try:
        print(f"🔍 Processing query: {query}")
        
        # Embed the query
        query_vector = embed_query(query)
        print(f"✅ Query embedded successfully")
        
        # Store user message (sync version)
        store_message_sync(query, "user", session_id, user_id, index_name)
        
        # Get context from embeddings and messages
        embedding_context, messages_context = getContext(query_vector, user_id, session_id, index_name)
        
        # Build context - handle empty contexts gracefully
        context_parts = []
        if embedding_context and embedding_context.strip():
            context_parts.append(f"Knowledge Base Context: {embedding_context}")
        if messages_context and messages_context.strip():
            context_parts.append(f"Conversation History: {messages_context}")
        
        if context_parts:
            context = "\n\n".join(context_parts)
        else:
            context = "No specific context available. Please provide information or ask a question."
        
        print(f"📝 Context built: {len(context)} characters")

        # Prepare messages for LLM
        messages = [
            {
                "role": "system",
                "content": "You are a helpful educational assistant. If the user provides a specific topic, use that topic to generate your response. Otherwise, infer the topic from the ongoing context. Based on the user's understanding and engagement, determine the appropriate next step. If the user is learning or asking for an explanation, respond with a JSON object where 'type' is 'response' and 'body' contains the LLM-generated explanation or answer. If the user is ready for assessment, return a JSON object with 'type' set to 'quiz' and 'body' containing 10 relevant multiple-choice questions with options and explaination (with the format {question: 'question', options: ['option1', 'option2', 'option3', 'option4'], answer: 'answer','explanation': 'explanation'}). If the user is ready for review or summarization, return a JSON object with 'type' set to 'flashnotes' and 'body' containing a 'notes' array of 20–30 concise and essential flash notes(with format {note: 'note'}). Always return only the raw JSON object without any additional commentary or formatting."
            },
            {
                "role": "user", 
                "content": f"User Query: {query}\n\nContext: {context}"
            },
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
        
        # Store assistant message (sync version)
        store_message_sync(assistant_response, "assistant", session_id, user_id, index_name)
        
        print(assistant_response)
        return str(assistant_response)

    except Exception as e:
        print(f"❌ Error in query_llm: {e}")
        return f"I apologize, but I encountered an error processing your request: {str(e)}"

def getContext(query_vector, user_id, session_id, index_name="chatbot-index"):
    try:
        print(f"🔍 Getting context for user {user_id}, session {session_id}")
        index = pc.Index(index_name)

        # Query for embeddings (knowledge base)
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

        # Query for recent messages (conversation history)
        message_results = index.query(
            vector=query_vector,
            top_k=5,
            filter={
                "user_id": user_id,
                "session_id": session_id,
                "type": "message"
            },
            include_metadata=True,
            namespace=user_id
        )

        # Extract context
        embedding_context = []
        for match in embedding_results.get("matches", []):
            if "text" in match.get("metadata", {}):
                embedding_context.append(match["metadata"]["text"])

        message_context = []
        for match in message_results.get("matches", []):
            if "text" in match.get("metadata", {}):
                message_context.append(match["metadata"]["text"])

        embedding_text = "\n".join(embedding_context) if embedding_context else ""
        message_text = "\n".join(message_context) if message_context else ""
        
        print(f"📚 Found {len(embedding_context)} knowledge entries, {len(message_context)} message entries")
        
        return embedding_text, message_text

    except Exception as e:
        print(f"❌ Error getting context: {e}")
        return "", ""

def store_message_sync(query, user_type, session_id, user_id, index_name="chatbot-index"):
    """Synchronous message storage - no async conflicts"""
    try:
        print(f"💾 Storing {user_type} message")
        
        # Store in Pinecone (always works synchronously)
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
            print(f"✅ Pinecone storage successful")
        except Exception as pinecone_error:
            print(f"⚠️ Pinecone storage failed: {pinecone_error}")

        # Store in PostgreSQL database (sync connection)
        try:
            with db.get_sync_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO messages (session_id, role, content, timestamp) VALUES (%s, %s, %s, %s)",
                        (session_id, user_type, query, datetime.now())
                    )
            print(f"✅ Database storage successful")
        except Exception as db_error:
            print(f"⚠️ Database storage failed: {db_error}")

    except Exception as e:
        print(f"❌ Error in store_message_sync: {e}")

# Legacy functions for backward compatibility
def store_messages_in_db(query, user_type, session_id, user_id, index_name="chatbot-index"):
    store_message_sync(query, user_type, session_id, user_id, index_name)

# Async version for proper database storage
async def query_llm_with_async_db(query, user_id, session_id, index_name="chatbot-index"):
    """Async version that properly handles database storage"""
    try:
        print(f"🔍 Processing query (async): {query}")
        
        # Embed the query
        query_vector = embed_query(query)
        print(f"✅ Query embedded successfully")
        
        # Store user message with proper async
        await store_message_async(query, "user", session_id, user_id, index_name)
        
        # Get context from embeddings and messages
        embedding_context, messages_context = getContext(query_vector, user_id, session_id, index_name)
        
        # Build context
        context_parts = []
        if embedding_context and embedding_context.strip():
            context_parts.append(f"Knowledge Base Context: {embedding_context}")
        if messages_context and messages_context.strip():
            context_parts.append(f"Conversation History: {messages_context}")
        
        if context_parts:
            context = "\n\n".join(context_parts)
        else:
            context = "No specific context available. Please provide information or ask a question."
        
        print(f"📝 Context built: {len(context)} characters")

        # Prepare messages for LLM
        messages = [
            {
                "role": "system",
                "content": "You are a helpful educational assistant. If the user provides a specific topic, use that topic to generate your response. Otherwise, infer the topic from the ongoing context. Based on the user's understanding and engagement, determine the appropriate next step. If the user is learning or asking for an explanation, respond with a JSON object where 'type' is 'response' and 'body' contains the LLM-generated explanation or answer. If the user is ready for assessment, return a JSON object with 'type' set to 'quiz' and 'body' containing 10 relevant multiple-choice questions with options and explaination (with the format {question: 'question', options: ['option1', 'option2', 'option3', 'option4'], answer: 'answer','explanation': 'explanation'}). If the user is ready for review or summarization, return a JSON object with 'type' set to 'flashnotes' and 'body' containing a 'notes' array of 20–30 concise and essential flash notes(with format {note: 'note'}). Always return only the raw JSON object without any additional commentary or formatting."
            },
            {
                "role": "user", 
                "content": f"User Query: {query}\n\nContext: {context}"
            },
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
        
        # Store assistant message with proper async
        await store_message_async(assistant_response, "assistant", session_id, user_id, index_name)
        
        print(assistant_response)
        return str(assistant_response)

    except Exception as e:
        print(f"❌ Error in query_llm_with_async_db: {e}")
        return f"I apologize, but I encountered an error processing your request: {str(e)}"

async def store_message_async(query, user_type, session_id, user_id, index_name="chatbot-index"):
    """Proper async message storage"""
    try:
        print(f"💾 Storing {user_type} message (async)")
        
        # Store in Pinecone (sync operation)
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
            print(f"✅ Pinecone storage successful")
        except Exception as pinecone_error:
            print(f"⚠️ Pinecone storage failed: {pinecone_error}")

        # Store in PostgreSQL database (proper async)
        try:
            async with db.get_connection() as conn:
                await conn.execute(
                    "INSERT INTO messages (session_id, role, content, timestamp) VALUES ($1, $2, $3, $4)",
                    session_id, user_type, query, datetime.now()
                )
            print(f"✅ Database storage successful")
        except Exception as db_error:
            print(f"⚠️ Database storage failed: {db_error}")

    except Exception as e:
        print(f"❌ Error in store_message_async: {e}")

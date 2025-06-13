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

async def query_llm(query, user_id, session_id, index_name="chatbot-index"):
    """Main async LLM query function with proper database storage"""
    try:
        print(f"🔍 Processing query (async): {query}")
        
        # Embed the query
        query_vector = embed_query(query)
        print(f"✅ Query embedded successfully")
        
        # Store user message with proper async
        await store_message_async(query, "user", session_id, user_id, index_name)
        
        # Get all types of context
        recent_messages, relevant_messages, relevant_embeddings = await getContext(query_vector, user_id, session_id, index_name)
        
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
                "content": "You are a helpful educational assistant. If the user provides a specific topic, use that topic to generate your response. Otherwise, infer the topic from the ongoing context. First, analyze the conversation history to determine if the user might benefit from a quiz or flashnotes. If you determine they would benefit from either, ask them if they would like a quiz or flashnotes (whichever you think is more appropriate). If the user's last message was an affirmative response to your quiz/flashnotes suggestion, then: For quiz, return a JSON object with 'type' set to 'quiz' and 'body' containing 10 relevant multiple-choice questions with options and explanation (with the format {question: 'question', options: ['option1', 'option2', 'option3', 'option4'], answer: 'answer','explanation': 'explanation'}). For flashnotes, return a JSON object with 'type' set to 'flashnotes' and 'body' containing a 'notes' array of 20-30 concise and essential flash notes (with format {note: 'note'}). Otherwise, if the user is learning or asking for an explanation, respond with a JSON object where 'type' is 'response' and 'body' contains the LLM-generated explanation or answer. Always return only the raw JSON object without any additional commentary or formatting."
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
        print(f"❌ Error in query_llm: {e}")
        return f"I apologize, but I encountered an error processing your request: {str(e)}"

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

# Backward compatibility aliases
query_llm_with_async_db = query_llm
store_messages_in_db = store_message_async

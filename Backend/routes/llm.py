from fastapi import APIRouter, Body
from LLM.query_llm import query_llm

router = APIRouter()

@router.post("/query-llm")
def query_llm_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)):
    """
    Synchronous endpoint to query the LLM.
    Uses synchronous database operations with psycopg2.
    """
    try:
        response = query_llm(query, user_id, session_id)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

@router.post("/query-llm-async")
async def query_llm_async_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)):
    """
    Asynchronous endpoint to query the LLM with proper database storage.
    Uses asynchronous database operations with asyncpg.
    """
    try:
        from LLM.query_llm import query_llm_with_async_db
        response = await query_llm_with_async_db(query, user_id, session_id)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)} 
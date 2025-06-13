from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/query-llm")
async def query_llm_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)):
    """
    Asynchronous endpoint to query the LLM.
    Uses asynchronous database operations with asyncpg.
    """
    try:
        from LLM.query_llm import query_llm
        response = await query_llm(query, user_id, session_id)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

# Keep the async endpoint with a different name for backward compatibility
@router.post("/query-llm-async")
async def query_llm_async_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)):
    """
    Asynchronous endpoint to query the LLM with proper database storage.
    Uses asynchronous database operations with asyncpg.
    """
    try:
        from LLM.query_llm import query_llm
        response = await query_llm(query, user_id, session_id)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)} 
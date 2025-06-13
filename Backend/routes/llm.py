from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/query-llm")
async def query_llm_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)) -> Dict[str, Any]:
    """
    Asynchronous endpoint to query the LLM.
    Uses asynchronous database operations with asyncpg.
    """
    try:
        logger.info(f"Received query request - User: {user_id}, Session: {session_id}")
        from LLM.query_llm import query_llm
        response = await query_llm(query, user_id, session_id)
        
        # query_llm already handles response formatting, return directly
        logger.info(f"Returning response: {type(response)}")
        return response
    except Exception as e:
        error_msg = f"Error in query_llm_endpoint: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )

# Keep the async endpoint with a different name for backward compatibility
@router.post("/query-llm-async")
async def query_llm_async_endpoint(query: str = Body(...), user_id: str = Body(...), session_id: str = Body(...)) -> Dict[str, Any]:
    """
    Asynchronous endpoint to query the LLM with proper database storage.
    Uses asynchronous database operations with asyncpg.
    """
    try:
        logger.info(f"Received async query request - User: {user_id}, Session: {session_id}")
        from LLM.query_llm import query_llm
        response = await query_llm(query, user_id, session_id)
        
        # query_llm already handles response formatting, return directly
        logger.info(f"Returning response: {type(response)}")
        return response
    except Exception as e:
        error_msg = f"Error in query_llm_async_endpoint: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        ) 
from fastapi import APIRouter, Body
from Database.connection import db
from datetime import datetime
import uuid
app=APIRouter()

@app.post("/create_session")
def create_session(user_id:str):
    try:
        session_id=str(uuid.uuid4())
        db.execute("INSERT INTO sessions (session_id,user_id,created_at,topic,is_active) VALUES (%s,%s,%s,%s,%s)",(session_id,user_id,datetime.now(),"New chat",True))
        db.commit()
        return {"session_id":session_id}
    except Exception as e:
        return {"error":str(e)}
    
@app.post("/update_session_topic")
def update_session_topic(session_id: str = Body(...), topic: str = Body(...)):
    try:
        db.execute("UPDATE sessions SET topic = %s WHERE session_id = %s", (topic, session_id))
        db.commit()
        return {"success": True, "message": "Session topic updated"}
    except Exception as e:
        return {"error": str(e)}

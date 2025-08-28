import os
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import time
import random

from .database import Base, engine, get_db
from .models import AgentRow
from .schemas import AgentCreate, AgentOut, ChatRequest, ChatResponse, KBCreate, KBOut
from .agents_service import get_agent_instance, refresh_registry,_llm
# from .crew_runner import run_chat
from .crew_runner import run_chat_with_search

from .kb_service import list_kb, add_kb

from app.vector_store import vector_store


Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrewAI Backend", version="0.1.0")

# CORS (adjust to your frontend domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Agents Endpoints ---------
@app.get("/agents", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    rows = db.query(AgentRow).order_by(AgentRow.id.desc()).all()
    return [
        AgentOut(
            id=r.id,
            name=r.name,
            description=r.description,
            tasks=[t.strip() for t in (r.tasks or "").split(",") if t.strip()],
            goal=r.goal or "",
            backstory=r.backstory or ""
        )
        for r in rows
    ]

@app.post("/agents", response_model=AgentOut)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
    tasks_str = ",".join(payload.tasks or [])
    row = AgentRow(
        name=payload.name,
        description=payload.description or "",
        tasks=tasks_str,
        goal=payload.goal or "",
        backstory=payload.backstory or ""
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    refresh_registry()
    return AgentOut(
        id=row.id,
        name=row.name,
        description=row.description,
        tasks=payload.tasks or [],
        goal=row.goal,
        backstory=row.backstory
    )

@app.get("/agents/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    r = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not r:
        raise HTTPException(404, "Agent not found")
    
    return AgentOut(
        id=r.id,
        name=r.name,
        description=r.description,
        tasks=[t.strip() for t in (r.tasks or "").split(",") if t.strip()],
        goal=r.goal or "",
        backstory=r.backstory or ""
    )

from fastapi import Body
import logging

@app.post("/agents/{agent_id}/chat", response_model=ChatResponse)
def chat_with_agent(agent_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        # Ensure agent exists
        _ = get_agent_instance(db, agent_id)

        # Run chat using CrewAI + vector memory + Google search
        result = run_chat_with_search(db, agent_id, payload.message, use_search=True)

        # Return result in schema
        return ChatResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")

@app.delete("/agents/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(404, "Agent not found")
    
    db.delete(row)
    db.commit()
    refresh_registry()
    return None  # 204 No Content means no body returned

# --------- Crew Chat Endpoint ---------
@app.post("/crew-chat")
def crew_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    import uuid, random, time

    # 1️⃣ Session ID
    session_id = payload.session_id or str(uuid.uuid4())

    # 2️⃣ Fetch agents
    agents = db.query(AgentRow).all()
    if not agents:
        return {"session_id": session_id, "messages": [{"sender": "System", "text": "No agents available."}]}

    # 3️⃣ Pick one random agent
    agent = random.choice(agents)

    # 4️⃣ Store user message
    vector_store.add_texts(session_id, [f"User: {payload.message}"])

    # 5️⃣ Retrieve full session history
    conversation_contexts = vector_store.get_texts(session_id)
    conversation_context = "\n".join(conversation_contexts)

    # 6️⃣ Run agent
    result = run_chat_with_search(db, agent.id, conversation_context)
    reply_text = result.get("reply", "")

    # 7️⃣ Store agent reply
    vector_store.add_texts(session_id, [f"{agent.name}: {reply_text}"])

    # 8️⃣ Optional delay
    time.sleep(random.uniform(0.5, 1.5))

    # 9️⃣ Return **full conversation history** as messages
    messages = []
    for msg in vector_store.get_texts(session_id):
        # Split stored text into sender and message
        if ": " in msg:
            sender, text = msg.split(": ", 1)
        else:
            sender, text = "System", msg
        messages.append({"sender": sender, "text": text})

    return {"session_id": session_id, "messages": messages}
# # --------- History Endpoints ---------

@app.get("/agents/{agent_id}/history")
def get_chat_history(agent_id: int, db: Session = Depends(get_db)):
    # Verify agent exists
    try:
        _ = get_agent_instance(db, agent_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    # Retrieve chat history for this specific agent
    history = vector_store.get_texts(agent_id)
    return {"history": history}


@app.get("/global-context")
def get_global_context():
    """
    Returns all global texts stored in vector store.
    """
    global_texts = vector_store.get_texts("global")
    return {"global_texts": global_texts}

# --------- Knowledge Base Endpoints ---------
@app.get("/knowledge", response_model=list[KBOut])
def get_kb(db: Session = Depends(get_db)):
    items = list_kb(db)
    return [
        KBOut(id=i.id, title=i.title, content=i.content, tags=[t for t in (i.tags or "").split(",") if t])
        for i in items
    ]

@app.post("/knowledge", response_model=KBOut)
def add_kb_item(payload: KBCreate, db: Session = Depends(get_db)):
    entry = add_kb(db, payload.title, payload.content, payload.tags or [])
    return KBOut(id=entry.id, title=entry.title, content=entry.content,
                 tags=[t for t in (entry.tags or "").split(",") if t])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

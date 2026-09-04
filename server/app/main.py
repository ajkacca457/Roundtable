import os
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import time
import random

from .database import Base, engine, get_db
from .models import AgentRow, Board, KnowledgeEntry, Memory
from .schemas import AgentCreate, AgentOut, ChatRequest, ChatResponse, KBCreate, KBOut, ExpectedOutputUpdate, BoardCreate, BoardOut
from .agents_service import get_agent_instance, refresh_registry
from .crew_runner import run_chat_with_search
from .kb_service import list_kb, add_kb
from app.vector_store import vector_store

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(title="CrewAI Backend", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------- Board Endpoints ---------
@app.get("/boards", response_model=list[BoardOut])
def list_boards(db: Session = Depends(get_db)):
    return db.query(Board).order_by(Board.id.desc()).all()

@app.post("/boards", response_model=BoardOut)
def create_board(payload: BoardCreate, db: Session = Depends(get_db)):
    board = Board(name=payload.name, description=payload.description or "")
    db.add(board)
    db.commit()
    db.refresh(board)
    return board

@app.delete("/boards/{board_id}", status_code=204)
def delete_board(board_id: int, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(404, "Board not found")
    db.query(AgentRow).filter(AgentRow.board_id == board_id).delete()
    db.query(KnowledgeEntry).filter(KnowledgeEntry.board_id == board_id).delete()
    db.query(Memory).filter(Memory.board_id == board_id).delete()
    db.delete(board)
    db.commit()
    return None

# --------- Agents Endpoints ---------
@app.get("/agents", response_model=list[AgentOut])
def list_agents(board_id: int, db: Session = Depends(get_db)):
    rows = db.query(AgentRow).filter(AgentRow.board_id == board_id).order_by(AgentRow.id.desc()).all()
    return [
        AgentOut(
            id=r.id,
            board_id=r.board_id,
            name=r.name,
            description=r.description,
            tasks=[t.strip() for t in (r.tasks or "").split(",") if t.strip()],
            goal=r.goal or "",
            backstory=r.backstory or "",
            expected_output=r.expected_output
        )
        for r in rows
    ]

@app.post("/agents", response_model=AgentOut)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
    tasks_str = ",".join(payload.tasks or [])
    row = AgentRow(
        board_id=payload.board_id,
        name=payload.name,
        description=payload.description or "",
        tasks=tasks_str,
        goal=payload.goal or "",
        backstory=payload.backstory or "",
        expected_output=payload.expected_output
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    refresh_registry()
    return AgentOut(
        id=row.id,
        board_id=row.board_id,
        name=row.name,
        description=row.description,
        tasks=payload.tasks or [],
        goal=row.goal,
        backstory=row.backstory,
        expected_output=row.expected_output
    )

@app.get("/agents/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    r = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not r:
        raise HTTPException(404, "Agent not found")
    return AgentOut(
        id=r.id,
        board_id=r.board_id,
        name=r.name,
        description=r.description,
        tasks=[t.strip() for t in (r.tasks or "").split(",") if t.strip()],
        goal=r.goal or "",
        backstory=r.backstory or "",
        expected_output=r.expected_output
    )

@app.get("/agents/{agent_id}/expected_output")
def get_expected_output(agent_id: int, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(404, "Agent not found")
    return {"expected_output": row.expected_output}

@app.put("/agents/{agent_id}/expected_output")
def update_expected_output(agent_id: int, payload: ExpectedOutputUpdate, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(404, "Agent not found")
    row.expected_output = payload.expected_output
    db.commit()
    db.refresh(row)
    return {"message": "Expected output updated successfully", "expected_output": row.expected_output}

@app.delete("/agents/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(404, "Agent not found")
    db.delete(row)
    db.commit()
    refresh_registry()
    return None  # 204 No Content

# --------- Chat Endpoints ---------
@app.post("/agents/{agent_id}/chat", response_model=ChatResponse)
def chat_with_agent(agent_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    result = run_chat_with_search(db, agent_id, payload.message, use_search=True)
    return ChatResponse(**result)

@app.post("/crew-chat")
def crew_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    session_id = payload.session_id or str(uuid.uuid4())
    agents = db.query(AgentRow).all()
    if not agents:
        return {"session_id": session_id, "messages": [{"sender": "System", "text": "No agents available."}]}
    agent = random.choice(agents)
    vector_store.add_texts(session_id, [f"User: {payload.message}"])
    conversation_contexts = vector_store.get_texts(session_id)
    conversation_context = "\n".join(conversation_contexts)
    result = run_chat_with_search(db, agent.id, conversation_context)
    reply_text = result.get("reply", "")
    vector_store.add_texts(session_id, [f"{agent.name}: {reply_text}"])
    time.sleep(random.uniform(0.5, 1.5))
    messages = []
    for msg in vector_store.get_texts(session_id):
        if ": " in msg:
            sender, text = msg.split(": ", 1)
        else:
            sender, text = "System", msg
        messages.append({"sender": sender, "text": text})
    return {"session_id": session_id, "messages": messages}

@app.get("/agents/{agent_id}/history")
def get_chat_history(agent_id: int, db: Session = Depends(get_db)):
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    history = vector_store.get_texts(agent_id)
    return {"history": history}

@app.get("/global-context")
def get_global_context():
    global_texts = vector_store.get_texts("global")
    return {"global_texts": global_texts}

# --------- Knowledge Base Endpoints ---------
# --------- Knowledge Base Endpoints ---------
@app.get("/knowledge", response_model=list[KBOut])
def list_knowledge(board_id: int, db: Session = Depends(get_db)):
    rows = list_kb(db, board_id)
    return [
        KBOut(
            id=r.id,
            board_id=r.board_id,
            title=r.title,
            content=r.content,
            tags=[t.strip() for t in (r.tags or "").split(",") if t.strip()]
        )
        for r in rows
    ]

@app.post("/knowledge", response_model=KBOut)
def create_knowledge(payload: KBCreate, board_id: int, db: Session = Depends(get_db)):
    entry = add_kb(db, board_id, payload.title, payload.content, payload.tags or [])
    return KBOut(
        id=entry.id,
        board_id=entry.board_id,
        title=entry.title,
        content=entry.content,
        tags=[t.strip() for t in (entry.tags or "").split(",") if t.strip()]
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

import os
import re
import asyncio
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import AgentRow, Board, KnowledgeEntry, Memory
from .schemas import AgentCreate, AgentOut, ChatRequest, ChatResponse, KBCreate, KBOut, ExpectedOutputUpdate, BoardCreate, BoardOut
from .agents_service import get_agent_instance, refresh_registry
from .crew_runner import run_chat_with_search, run_synthesis
from .kb_service import list_kb, add_kb
from app.vector_store import vector_store
from .auth import get_current_user_id, get_owned_board, get_owned_agent

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(title="CrewAI Backend", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://roundtable-mauve.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------- Board Endpoints ---------
@app.get("/boards", response_model=list[BoardOut])
def list_boards(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(Board).filter(Board.owner_id == user_id).order_by(Board.id.desc()).all()

@app.post("/boards", response_model=BoardOut)
def create_board(payload: BoardCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    board = Board(owner_id=user_id, name=payload.name, description=payload.description or "")
    db.add(board)
    db.commit()
    db.refresh(board)
    return board

@app.delete("/boards/{board_id}", status_code=204)
def delete_board(board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    board = db.query(Board).filter(Board.id == board_id, Board.owner_id == user_id).first()
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
def list_agents(board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)
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

def create_agent(payload: AgentCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(payload.board_id, db, user_id)
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
def get_agent(agent_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    r = get_owned_agent(agent_id, db, user_id)
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
def get_expected_output(agent_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    row = get_owned_agent(agent_id, db, user_id)
    return {"expected_output": row.expected_output}

@app.put("/agents/{agent_id}/expected_output")
def update_expected_output(agent_id: int, payload: ExpectedOutputUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    row = get_owned_agent(agent_id, db, user_id)
    row.expected_output = payload.expected_output
    db.commit()
    db.refresh(row)
    return {"message": "Expected output updated successfully", "expected_output": row.expected_output}

@app.delete("/agents/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    row = get_owned_agent(agent_id, db, user_id)
    db.delete(row)
    db.commit()
    refresh_registry()
    return None  # 204 No Content

# --------- Chat Endpoints ---------
def _parse_mention(message: str, agents: list[AgentRow]):
    """If message starts with @AgentName, return (agent, rest). Otherwise (None, message)."""
    match = re.match(r"^@(\S+)[,:]?\s*(.*)", message.strip())
    if not match:
        return None, message
    mentioned = match.group(1).lower()
    rest = match.group(2).strip() or message
    for a in agents:
        if a.name.lower().replace(" ", "") == mentioned.replace(" ", ""):
            return a, rest
    return None, message

@app.post("/boards/{board_id}/chat")
async def crew_chat(board_id: int, payload: ChatRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)
    agents = db.query(AgentRow).filter(AgentRow.board_id == board_id).all()
    if not agents:
        return {"messages": [{"sender": "System", "text": "This board has no agents yet."}]}

    vector_store.add_texts(board_id, [f"User: {payload.message}"])

    for a in agents:
        get_agent_instance(db, a.id)

    mentioned_agent, clean_message = _parse_mention(payload.message, agents)

    if mentioned_agent:
        result = await asyncio.to_thread(
            run_chat_with_search, db, mentioned_agent.id, board_id, clean_message
        )
        return {
            "messages": [
                {"sender": "User", "text": payload.message},
                {"sender": mentioned_agent.name, "text": result["reply"]},
            ]
        }

    tasks = [
        asyncio.to_thread(run_chat_with_search, db, a.id, board_id, payload.message)
        for a in agents
    ]
    results = await asyncio.gather(*tasks)

    advisor_messages = [
        {"sender": a.name, "text": r["reply"]} for a, r in zip(agents, results)
    ]
    return {
        "messages": (
            [{"sender": "User", "text": payload.message}]
            + advisor_messages
        )
    }

@app.post("/boards/{board_id}/synthesize")
async def synthesize_board(board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)

    recent = vector_store.get_texts(board_id, limit=5)
    if not recent:
        return {"sender": "Synthesis", "text": "Not enough discussion yet to synthesize."}

    synthesis_prompt = (
        "Here is the recent discussion on this board:\n\n"
        + "\n".join(recent)
        + "\n\nSynthesize this into one clear recommendation, noting any disagreement among advisors."
    )
    synthesis_reply = await asyncio.to_thread(run_synthesis, synthesis_prompt)
    vector_store.add_texts(board_id, [f"Synthesis: {synthesis_reply}"])

    return {"sender": "Synthesis", "text": synthesis_reply}

@app.get("/boards/{board_id}/history")
def get_board_history(board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)
    return {"history": vector_store.get_texts(board_id)}

# --------- Knowledge Base Endpoints ---------
@app.get("/knowledge", response_model=list[KBOut])
def list_knowledge(board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)
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
def create_knowledge(payload: KBCreate, board_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    get_owned_board(board_id, db, user_id)
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

from pydantic import BaseModel
from typing import List, Optional

# ---------- Boards ----------
class BoardCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class BoardOut(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True

# ---------- Agents ----------
class AgentCreate(BaseModel):
    board_id:int
    name: str
    description: Optional[str] = ""
    tasks: Optional[List[str]] = []
    goal: Optional[str] = ""        # new
    backstory: Optional[str] = ""   # new
    expected_output: Optional[str] = None  # 👈 new

class AgentOut(BaseModel):
    id: int
    board_id: int          
    name: str
    description: str
    tasks: List[str]
    goal: str           # new
    backstory: str      # new
    expected_output: Optional[str] = None  # 👈 new

    class Config:
        from_attributes = True

# Model for updating an agent's expected_output
class ExpectedOutputUpdate(BaseModel):
    expected_output: str

# ---------- Chat ----------
class ChatRequest(BaseModel):
    board_id:int
    message: str
    session_id: Optional[str] = None  # optional for first message

class ChatResponse(BaseModel):
    reply: str
    source_percent: dict

# ---------- Knowledge Base ----------
class KBCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []

class KBOut(BaseModel):
    id: int
    board_id: int          
    title: str
    content: str
    tags: List[str]

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import List, Optional

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tasks: Optional[List[str]] = []

class AgentOut(BaseModel):
    id: int
    name: str
    description: str
    tasks: List[str]
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class KBCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []

class KBOut(BaseModel):
    id: int
    title: str
    content: str
    tags: List[str]
    class Config:
        from_attributes = True

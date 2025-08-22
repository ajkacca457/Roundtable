import os
from typing import Dict
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from crewai import Agent
from langchain_openai import ChatOpenAI
from .models import AgentRow

load_dotenv()

# In-memory registry to avoid rebuilding agents every time
_agent_registry: Dict[int, Agent] = {}

def _llm():
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return ChatOpenAI(model=model, temperature=0.2)

def _row_to_crewai_agent(row: AgentRow) -> Agent:
    tasks_text = row.tasks or ""
    goal = f"Accomplish tasks: {tasks_text}" if tasks_text else "Assist the user effectively."
    return Agent(
        role=row.name,
        goal=goal,
        backstory=row.description or f"{row.name} is a helpful agent.",
        llm=_llm(),
        allow_delegation=False,
        verbose=False,
    )

def get_agent_instance(db: Session, agent_id: int) -> Agent:
    if agent_id in _agent_registry:
        return _agent_registry[agent_id]
    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise ValueError("Agent not found")
    agent = _row_to_crewai_agent(row)
    _agent_registry[agent_id] = agent
    return agent

def refresh_registry():
    _agent_registry.clear()

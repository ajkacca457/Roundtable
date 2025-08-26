import os
from typing import Dict
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from crewai import Agent
from langchain_openai import ChatOpenAI, AzureChatOpenAI
from .models import AgentRow

load_dotenv()

# In-memory registry to avoid rebuilding agents every time
_agent_registry: Dict[int, Agent] = {}

def _llm():
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "azure":
        # Azure OpenAI setup
        return AzureChatOpenAI(
            deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            temperature=float(os.getenv("LLM_TEMPERATURE", 0.2)),
            model_name=os.getenv("AZURE_OPENAI_MODEL", "gpt-4")  # <-- Add model_name
        )
    else:
        # Default: OpenAI
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=float(os.getenv("LLM_TEMPERATURE", 0.2)),
        )

def _row_to_crewai_agent(row: AgentRow) -> Agent:
    tasks_text = row.tasks or ""
    goal = f"Accomplish tasks: {tasks_text}" if tasks_text else "Assist the user effectively."
    return Agent(
        role=row.name,
        goal=row.goal or goal,
        backstory=row.backstory or row.description or f"{row.name} is a helpful agent.",
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

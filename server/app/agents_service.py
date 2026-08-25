import os
from typing import Dict, Tuple
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from crewai import Agent
from langchain_openai import ChatOpenAI, AzureChatOpenAI
from .models import AgentRow

load_dotenv()

# In-memory registry to avoid rebuilding agents every time
# Stores tuple: (Agent instance, expected_output)
_agent_registry: Dict[int, Tuple[Agent, str]] = {}

def _llm():
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "azure":
        return AzureChatOpenAI(
            deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            temperature=float(os.getenv("LLM_TEMPERATURE", 0.2)),
            model_name=os.getenv("AZURE_OPENAI_MODEL", "gpt-4")
        )
    elif provider == "groq":
        return ChatOpenAI(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=float(os.getenv("LLM_TEMPERATURE", 0.2)),
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1",
        )
    else:
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=float(os.getenv("LLM_TEMPERATURE", 0.2)),
        )

def get_agent_instance(db: Session, agent_id: int) -> Tuple[Agent, str]:
    """
    Returns a tuple: (Agent instance, expected_output)
    """
    if agent_id in _agent_registry:
        return _agent_registry[agent_id]

    row = db.query(AgentRow).filter(AgentRow.id == agent_id).first()
    if not row:
        raise ValueError("Agent not found")

    tasks_text = row.tasks or ""
    goal = f"Accomplish tasks: {tasks_text}" if tasks_text else "Assist the user effectively."

    agent = Agent(
        role=row.name,
        goal=row.goal or goal,
        backstory=row.backstory or row.description or f"{row.name} is a helpful agent.",
        llm=_llm(),
        allow_delegation=False,
        verbose=False,
    )

    expected_output = row.expected_output  # keep separately

    _agent_registry[agent_id] = (agent, expected_output)
    return agent, expected_output

def refresh_registry():
    _agent_registry.clear()

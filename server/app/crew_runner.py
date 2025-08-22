from crewai import Crew, Task, Process
from .agents_service import get_agent_instance
from sqlalchemy.orm import Session

def run_chat(db: Session, agent_id: int, user_message: str) -> str:
    agent = get_agent_instance(db, agent_id)
    task = Task(
        description=user_message,
        expected_output="A concise, helpful, step-by-step answer.",
        agent=agent,
    )
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff()
    return str(result)

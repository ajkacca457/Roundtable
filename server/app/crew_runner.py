# from crewai import Crew, Task, Process
# from .agents_service import get_agent_instance
# from sqlalchemy.orm import Session

# def run_chat(db: Session, agent_id: int, user_message: str) -> str:
#     agent = get_agent_instance(db, agent_id)
#     task = Task(
#         description=user_message,
#         expected_output=(
#             "Respond in a natural, conversational, and human-like tone. "
#             "React to the context as if you are part of a friendly discussion. "
#             "Avoid rigid step-by-step instructions unless absolutely needed. "
#             "Be thoughtful, engaging, and add personality where appropriate."
#         ),
#         agent=agent,
#     )
#     crew = Crew(
#         agents=[agent],
#         tasks=[task],
#         process=Process.sequential,
#         verbose=False,
#     )

#     result = crew.kickoff()

#     # --- Extract clean text safely ---
#     if hasattr(result, "content"):     # Some CrewAI results have `.content`
#         return result.content
#     elif isinstance(result, str):      # Already a string
#         return result
#     elif isinstance(result, dict):     # Azure may return dict-like response
#         return result.get("content", str(result))
#     else:                              # Fallback
#         return str(result)

import os
import re
import requests
from crewai import Crew, Task, Process
from sqlalchemy.orm import Session
from .agents_service import get_agent_instance

def search_internet(query: str, top_k: int = 3) -> list[str]:
    """
    Search the internet using Google Custom Search (CSE) API.
    Returns a list of top result snippets.
    """
    api_key = os.getenv("CSE_API_KEY")
    cse_id = os.getenv("CSE_ID")  # make sure you set this in your .env

    if not api_key or not cse_id:
        return []

    endpoint = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": cse_id,
        "q": query,
        "num": top_k,
    }

    try:
        resp = requests.get(endpoint, params=params, timeout=5)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        snippets = [f"{item['title']}: {item['snippet']}" for item in items]
        return snippets
    except Exception:
        return []

def run_chat_with_search(
    db: Session, agent_id: int, user_message: str, use_search: bool = True
) -> dict:
    """
    Run a chat with an agent using internal knowledge and optional Google CSE search.
    Returns:
      - 'reply': the agent's answer
      - 'source_percent': approximate percentage from internal vs internet
    """
    agent = get_agent_instance(db, agent_id)

    # 1️⃣ Fetch external knowledge via Google CSE
    external_knowledge = search_internet(user_message, top_k=3) if use_search else []

    # 2️⃣ Prepare conversation context
    context = f"User query: {user_message}\n\nInternal Knowledge: Use your tasks, goal, and backstory."
    if external_knowledge:
        context += "\n\nExternal Knowledge (from internet search):\n" + "\n".join(external_knowledge)

    # 3️⃣ Create a CrewAI task
    task = Task(
        description=context,
        expected_output=(
            "Respond naturally and conversationally. "
            "Use both internal knowledge and internet knowledge if available. "
            "At the end, indicate approximate percentages of info from each source, "
            "e.g., 'Sources: Internal 60%, Internet 40%'"
        ),
        agent=agent,
    )

    # 4️⃣ Run the agent
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff()
    reply_text = str(result)

    # 5️⃣ Extract source percentages from LLM response
    internal_pct, internet_pct = 70, 30  # fallback defaults
    match = re.search(r"Internal (\d+)%.*Internet (\d+)%", reply_text)
    if match:
        internal_pct, internet_pct = int(match.group(1)), int(match.group(2))

    return {
        "reply": reply_text,
        "source_percent": {"internal": internal_pct, "internet": internet_pct}
    }

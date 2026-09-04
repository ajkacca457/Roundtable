import os
import re
import requests
from crewai import Crew, Task, Process
from sqlalchemy.orm import Session
from .agents_service import get_agent_instance
from .vector_store import vector_store

# Default fallback prompt if agent has no custom expected_output
DEFAULT_EXPECTED_OUTPUT = (
    "Engage the user in a natural, interactive conversation. "
    "Ask probing questions to understand their goals, challenges, and context. "
    "Generate standalone insights based on internal knowledge, global context, and relevant external sources. "
    "Encourage the user to think creatively and build upon their own ideas. "
    "Reference previous team discussions and documents where relevant. "
    "Do not provide a single final answer; focus on guiding exploration, uncovering assumptions, and facilitating actionable thinking."
)

def search_internet(query: str, top_k: int = 3) -> list[str]:
    """
    Search the internet using Google Custom Search (CSE) API.
    Returns a list of top result snippets.
    """
    api_key = os.getenv("CSE_API_KEY")
    cse_id = os.getenv("CSE_ID")
    if not api_key or not cse_id:
        return []

    endpoint = "https://www.googleapis.com/customsearch/v1"
    params = {"key": api_key, "cx": cse_id, "q": query, "num": top_k}

    try:
        resp = requests.get(endpoint, params=params, timeout=5)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        return [f"{item['title']}: {item['snippet']}" for item in items]
    except Exception:
        return []

def run_chat_with_search(
    db: Session,
    agent_id: int,
    board_id: int,
    user_message: str,
    use_search: bool = True,
    top_history: int = 5,
    top_global: int = 5
) -> dict:
    """
    Run a chat with an agent using:
    1️⃣ Relevant previous chat history from vector store (agent-specific)
    2️⃣ Relevant global context
    3️⃣ Optional Google CSE search
    Stores new chats in vector store for future context.
    Returns:
      - 'reply': agent response
      - 'source_percent': approximate percentage from internal vs internet
    """
    agent, expected_output = get_agent_instance(db, agent_id)
    expected_output = expected_output or DEFAULT_EXPECTED_OUTPUT

    # 1️⃣ Retrieve relevant previous chats
    relevant_history = vector_store.query(board_id, user_message, top_k=top_history)
    history_text = "\n".join(relevant_history) if relevant_history else ""

    # 3️⃣ Fetch external knowledge
    external_knowledge = search_internet(user_message, top_k=3) if use_search else []

    # 4️⃣ Build context
    context_parts = []
    if history_text:
        context_parts.append(f"Previous chats:\n{history_text}")
    context_parts.append(f"User query: {user_message}")
    context_parts.append("Internal Knowledge: Use your tasks, goal, and backstory.")
    if external_knowledge:
        context_parts.append("External Knowledge (from internet search):\n" + "\n".join(external_knowledge))
    context = "\n\n".join(context_parts)

    print(f"[DEBUG] Agent ID {agent_id} expected_output:\n{expected_output}\n")

    # 5️⃣ Create CrewAI task
    task = Task(
        description=context,
        expected_output=expected_output,
        agent=agent,
    )

    # 6️⃣ Run the agent
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff()
    reply_text = str(result)

    # 7️⃣ Extract source percentages from LLM response
    internal_pct, internet_pct = 70, 30
    match = re.search(r"Internal (\d+)%.*Internet (\d+)%", reply_text)
    if match:
        internal_pct, internet_pct = int(match.group(1)), int(match.group(2))

    # 8️⃣ Store new chat in vector store
    vector_store.add_texts(board_id, [reply_text])

    return {
        "reply": reply_text,
        "source_percent": {"internal": internal_pct, "internet": internet_pct}
    }

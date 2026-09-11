# Roundtable

A multi-agent AI advisory board platform — create a board, populate it with advisor personas, ground them in your own knowledge, and discuss with the whole panel (or one advisor at a time) over a persistent memory.

🔗 **Live Demo:** [roundtable-mauve.vercel.app](https://roundtable-mauve.vercel.app/)
📹 **Walkthrough:** [INSERT_LOOM_LINK]

> ⚠️ **Cold starts:** The backend runs on Render's free tier and spins down after 15 minutes of inactivity. The first request after a period of idle time can take 30–50 seconds to wake up — this is expected, not a bug.

> 👤 **Test Account:** No seeded demo account — sign up with any email via Clerk (email or Google) to create your own board. Boards, agents, knowledge, and chat history are private to your account.

## Overview

Roundtable lets you assemble a panel of AI advisors — each with their own name, goal, backstory, and area of expertise — scoped to a specific board (e.g. "Squad Planning," "Product Launch"). Each board owns its own agents, knowledge base, and conversation memory, fully isolated from every other board.

Ask the whole board a question and every advisor responds concurrently, each grounded in the board's knowledge entries and its own persona. Mention a specific advisor (`@Physio`) to route a question to just them. Ask for a synthesis at any point and a separate pass reconciles the board's recent discussion into one recommendation.

Originally prototyped as AikaCrew — a proof-of-concept multi-agent demo built for an AI startup — and later rebuilt from the ground up into Roundtable: a general-purpose, multi-tenant application with real authentication, per-board data isolation, and production deployment, rather than a single-purpose demo.

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS v4 + daisyUI v5 (custom "boardroom" theme — parchment/brass/navy palette, Source Serif 4 + IBM Plex Sans)
- React Router
- Clerk (`@clerk/clerk-react`) — authentication

**Backend**
- FastAPI + SQLAlchemy
- CrewAI — agent orchestration
- Neon Postgres + pgvector — storage and per-board conversation memory
- Groq (`openai/gpt-oss-120b`) — chat completions
- Google Gemini (`gemini-embedding-001`, truncated to 1536 dims) — embeddings
- Clerk (`clerk-backend-api`) — JWT verification
- pytest — auth boundary and routing-logic tests

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → Neon

## Features

**Boards**
- Create, view, and delete boards — each board is a fully isolated advisory panel
- Deleting a board cascades to its agents, knowledge entries, and memory
- Boards are scoped to the signed-in user; no user can see or act on another user's boards

**Agents**
- Create advisor personas with a name, description, goal, backstory, and optional custom expected-output style
- Agents are board-scoped and dynamically registered — no restart needed to add a new advisor

**Chat**
- Ask the whole board a question → every agent responds concurrently (pre-warmed to avoid concurrent-session DB issues)
- `@AgentName` → routes the question to just that one advisor
- Agents ground their answers in the board's knowledge entries, not just their persona description
- Every exchange is stored in the board's persistent memory (Postgres + pgvector) and reloaded on page mount

**Knowledge Base**
- Add titled, tagged knowledge entries per board (policies, budgets, context documents)
- Agents actually retrieve and cite this content in their responses, not just the system prompt

**Synthesis**
- On-demand endpoint that pulls the board's last 5 memory entries and reconciles them into a single recommendation, noting any disagreement between advisors
- Deliberately separate from the chat fan-out — synthesizing on every message was slow and often didn't make sense per-question

**Auth**
- Clerk-based sign-in (email or Google)
- Every board-scoped endpoint verifies both a valid session token and board ownership before returning data
- Ownership checks return 404 (not 403) on a non-owned board — a user can't tell whether another user's board ID even exists

## Chat & Ownership Flow

```
User sends a message on a board
      ↓
get_owned_board() confirms the board belongs to the signed-in user
      ↓
   @Mention?
   ├─ yes → route to the matching agent only
   └─ no  → fan out to every agent on the board (asyncio.gather)
      ↓
Each agent's run pulls:
  1. Relevant prior memory for this board (vector similarity)
  2. The board's knowledge base entries
      ↓
Agent replies are stored back into memory (Postgres + pgvector)
      ↓
Response returned to the frontend, appended to the chat log
```

Synthesis runs as a separate, explicitly-triggered pass:

```
User clicks "Synthesize"
      ↓
get_owned_board() ownership check
      ↓
Pull the board's last 5 memory entries (vector_store.get_texts(limit=5))
      ↓
Single LLM call reconciles them into one recommendation
      ↓
Synthesis stored back into memory, returned to the frontend
```

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.12
- Poetry
- A Neon Postgres project (with the `vector` extension enabled)
- A Clerk application
- A Groq API key (free tier)
- A Google AI Studio API key (for Gemini embeddings, free tier)

### Clone & Install

```bash
git clone https://github.com/ajkacca457/Roundtable.git
cd Roundtable

# Backend
cd server
poetry install

# Frontend
cd ../client
npm install
```

### Environment Variables

**`server/.env`**
```env
DATABASE_URL=your_neon_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key

LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

GOOGLE_API_KEY=your_google_ai_studio_key
```

**`client/.env`**
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Database

Tables are created automatically on first run via `Base.metadata.create_all` — no separate migration step. Make sure the `vector` extension is enabled on your Neon database first:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run

```bash
# Backend (from server/)
poetry run uvicorn app.main:app --reload

# Frontend (from client/)
npm run dev
```

Backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000), frontend at [http://localhost:5173](http://localhost:5173).

### Tests

```bash
cd server
poetry run pytest -v
```

Covers `@mention` routing logic and the board-ownership auth boundary (owner access, cross-user access correctly denied, nonexistent board handling) against an isolated in-memory SQLite database — no real Neon connection needed for these.

## Project Structure

```
Roundtable/
├── server/
│   ├── app/
│   │   ├── main.py              # Routes — boards, agents, knowledge, chat, synthesis
│   │   ├── auth.py              # Clerk JWT verification, board/agent ownership checks
│   │   ├── models.py            # SQLAlchemy models (Board, AgentRow, KnowledgeEntry, Memory)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── database.py          # Engine, session, Base
│   │   ├── crew_runner.py       # CrewAI agent execution, synthesis, optional web search
│   │   ├── agents_service.py    # Dynamic agent registration per board
│   │   ├── kb_service.py        # Knowledge base CRUD
│   │   └── vector_store.py      # pgvector-backed memory read/write
│   └── tests/
│       ├── test_parse_mention.py
│       └── test_board_ownership.py
├── client/
│   └── src/
│       ├── pages/
│       │   ├── BoardList.jsx     # Board list + create/delete
│       │   ├── Dashboard.jsx     # Per-board agent/knowledge overview
│       │   ├── AgentGenerator.jsx # Agent create/list/delete
│       │   ├── CrewChat.jsx      # Chat, @mentions, synthesis
│       │   └── KnowledgeBase.jsx # Knowledge entry create/list
│       ├── hooks/
│       │   └── useApiFetch.js    # Attaches Clerk session token to every API call
│       ├── layouts/
│       │   └── MainLayout.jsx    # Sidebar + navbar shell for board-scoped pages
│       └── components/
│           ├── Navbar.jsx
│           └── Sidebar.jsx
```

## API Reference

All endpoints require a valid Clerk session token (`Authorization: Bearer <token>`), and every board/agent-scoped endpoint additionally verifies ownership before returning data.

| Endpoint | Method | Description |
|---|---|---|
| `/boards` | GET | List the signed-in user's boards |
| `/boards` | POST | Create a board |
| `/boards/{board_id}` | DELETE | Delete a board (cascades to agents, knowledge, memory) |
| `/agents` | GET | List a board's agents (`?board_id=`) |
| `/agents` | POST | Create an agent on a board |
| `/agents/{agent_id}` | GET | Get a single agent |
| `/agents/{agent_id}/expected_output` | GET / PUT | Read or update an agent's custom output style |
| `/agents/{agent_id}` | DELETE | Delete an agent |
| `/boards/{board_id}/chat` | POST | Send a message — fans out to all agents, or routes via `@mention` |
| `/boards/{board_id}/synthesize` | POST | Reconcile the board's recent discussion into one recommendation |
| `/boards/{board_id}/history` | GET | Load the board's full chat history |
| `/knowledge` | GET | List a board's knowledge entries (`?board_id=`) |
| `/knowledge` | POST | Add a knowledge entry to a board (`?board_id=`) |

## Data Models

**Board**
```
id, owner_id, name, description, created_at
→ agents[], knowledge[], memory[]
```

**AgentRow**
```
id, board_id, name, description, tasks (comma-separated)
goal, backstory, expected_output?
```

**KnowledgeEntry**
```
id, board_id, title, content, tags (comma-separated), created_at
```

**Memory**
```
id, board_id, user_id, role ("user" | "assistant")
content, embedding (vector, 1536 dims), created_at
```

## Known Limitations / Future Plans

- [ ] Document upload for knowledge entries (currently manual title/content only)
- [ ] Redundant embedding — the fan-out re-embeds the same user question once per agent instead of once, reused
- [ ] `Memory.user_id` is vestigial, superseded by `board_id`; not yet dropped
- [ ] Agent `tasks` field is redundant with `goal` (folded in via string concatenation) — not a real structured feature
- [ ] Optional Google Custom Search grounding (`search_internet` in `crew_runner.py`) fails silently without keys — currently unconfigured in production
- [ ] No validation that `board_id` exists on knowledge-entry creation beyond the ownership check already in place
- [ ] No document-level or integration tests beyond the auth boundary and mention-routing logic

## Author

Avijit Karmaker
GitHub · Portfolio

## License

MIT

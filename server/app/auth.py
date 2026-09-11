import os
from dataclasses import dataclass
from typing import Mapping
from fastapi import Header, HTTPException
from sqlalchemy.orm import Session
from clerk_backend_api.security import authenticate_request, AuthenticateRequestOptions
from .models import Board

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise RuntimeError("Missing CLERK_SECRET_KEY in server/.env")


@dataclass
class _FakeRequest:
    """Minimal Requestish shim — authenticate_request only needs .headers.get()."""
    headers: Mapping[str, str]


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    fake_request = _FakeRequest(headers={"Authorization": authorization})

    try:
        request_state = authenticate_request(
            fake_request,
            AuthenticateRequestOptions(secret_key=CLERK_SECRET_KEY),
        )
    except Exception:
        raise HTTPException(401, "Invalid or expired session token")

    if not request_state.is_signed_in:
        raise HTTPException(401, "Not signed in")

    return request_state.payload["sub"]  # Clerk user ID


def get_owned_board(board_id: int, db: Session, user_id: str) -> Board:
    board = db.query(Board).filter(Board.id == board_id, Board.owner_id == user_id).first()
    if not board:
        raise HTTPException(404, "Board not found")
    return board


def get_owned_agent(agent_id: int, db: Session, user_id: str):
    from .models import AgentRow  # local import avoids circular import with models.py
    agent = (
        db.query(AgentRow)
        .join(Board, Board.id == AgentRow.board_id)
        .filter(AgentRow.id == agent_id, Board.owner_id == user_id)
        .first()
    )
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent
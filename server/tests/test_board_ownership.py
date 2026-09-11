import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Board
from app.auth import get_owned_board
from fastapi import HTTPException


@pytest.fixture
def db_session():
    """Fresh in-memory SQLite DB per test — isolated from real Neon data."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine)

    # Only create the tables we actually need for this test (avoids the
    # pgvector-typed Memory table, which SQLite can't create).
    Board.__table__.create(bind=engine)

    session = TestingSessionLocal()
    yield session
    session.close()


def test_owner_can_access_their_own_board(db_session):
    board = Board(owner_id="user_a", name="Squad Planning", description="")
    db_session.add(board)
    db_session.commit()
    db_session.refresh(board)

    result = get_owned_board(board.id, db_session, "user_a")

    assert result.id == board.id


def test_other_user_cannot_access_board(db_session):
    board = Board(owner_id="user_a", name="Squad Planning", description="")
    db_session.add(board)
    db_session.commit()
    db_session.refresh(board)

    with pytest.raises(HTTPException) as exc_info:
        get_owned_board(board.id, db_session, "user_b")

    assert exc_info.value.status_code == 404


def test_nonexistent_board_raises_404(db_session):
    with pytest.raises(HTTPException) as exc_info:
        get_owned_board(9999, db_session, "user_a")

    assert exc_info.value.status_code == 404
from typing import List
from sqlalchemy.orm import Session
from .models import KnowledgeEntry

def list_kb(db: Session, board_id: int) -> List[KnowledgeEntry]:
    return db.query(KnowledgeEntry).filter(KnowledgeEntry.board_id == board_id).order_by(KnowledgeEntry.id.desc()).all()

def add_kb(db: Session, board_id: int, title: str, content: str, tags: List[str]) -> KnowledgeEntry:
    entry = KnowledgeEntry(
        board_id=board_id,
        title=title,
        content=content,
        tags=",".join([t.strip() for t in tags if t.strip()]),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
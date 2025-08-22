from typing import List
from sqlalchemy.orm import Session
from .models import KnowledgeEntry

def list_kb(db: Session) -> List[KnowledgeEntry]:
    return db.query(KnowledgeEntry).order_by(KnowledgeEntry.id.desc()).all()

def add_kb(db: Session, title: str, content: str, tags: List[str]) -> KnowledgeEntry:
    entry = KnowledgeEntry(
        title=title,
        content=content,
        tags=",".join([t.strip() for t in tags if t.strip()]),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

# vector_store.py
import os
from typing import List
from openai import OpenAI
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Memory

EMBEDDING_MODEL = "text-embedding-3-small"
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


class ChatVectorStore:
    def _embed(self, text: str) -> list[float]:
        response = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
        return response.data[0].embedding

    def _split(self, text: str):
        if ": " in text:
            role, content = text.split(": ", 1)
            return role, content
        return "note", text

    def add_texts(self, scope, texts: List[str]):
        if not texts:
            return
        db: Session = SessionLocal()
        try:
            for text in texts:
                role, content = self._split(text)
                embedding = self._embed(content)
                db.add(Memory(user_id=str(scope), role=role, content=content, embedding=embedding))
            db.commit()
        finally:
            db.close()

    def get_texts(self, scope) -> List[str]:
        db: Session = SessionLocal()
        try:
            rows = (
                db.query(Memory)
                .filter(Memory.user_id == str(scope))
                .order_by(Memory.created_at.asc())
                .all()
            )
            return [f"{r.role}: {r.content}" for r in rows]
        finally:
            db.close()

    def query(self, scope, query_text: str, top_k: int = 5) -> List[str]:
        db: Session = SessionLocal()
        try:
            query_embedding = self._embed(query_text)
            rows = (
                db.query(Memory)
                .filter(Memory.user_id == str(scope))
                .order_by(Memory.embedding.l2_distance(query_embedding))
                .limit(top_k)
                .all()
            )
            return [f"{r.role}: {r.content}" for r in rows]
        finally:
            db.close()


vector_store = ChatVectorStore()
# vector_store.py
import os
from typing import List
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Memory

EMBEDDING_MODEL = "gemini-embedding-001"
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])


class ChatVectorStore:
    def _embed(self, text: str) -> list[float]:
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(output_dimensionality=1536),
        )
        return response.embeddings[0].values

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
                db.add(Memory(board_id=scope, user_id=str(scope), role=role, content=content, embedding=embedding))
            db.commit()
        finally:
            db.close()

    def get_texts(self, scope) -> List[str]:
        db: Session = SessionLocal()
        try:
            rows = (
                db.query(Memory)
                .filter(Memory.board_id == scope)
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
                .filter(Memory.board_id == scope)
                .order_by(Memory.embedding.l2_distance(query_embedding))
                .limit(top_k)
                .all()
            )
            return [f"{r.role}: {r.content}" for r in rows]
        finally:
            db.close()


vector_store = ChatVectorStore()
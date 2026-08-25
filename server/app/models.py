from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from .database import Base

class AgentRow(Base):
    __tablename__ = "agents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    tasks: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    goal: Mapped[str] = mapped_column(Text, default="")   # new
    backstory: Mapped[str] = mapped_column(Text, default="")  # new
    expected_output: Mapped[str | None] = mapped_column(Text, default=None)  # 👈 NEW


class KnowledgeEntry(Base):
    __tablename__ = "knowledge"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())


class Memory(Base):
    __tablename__ = "memory"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)   # email, lightweight identity
    role: Mapped[str] = mapped_column(String(20))                   # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list] = mapped_column(Vector(1536))
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
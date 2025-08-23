from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class AgentRow(Base):
    __tablename__ = "agents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    tasks: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    goal: Mapped[str] = mapped_column(Text, default="")  # new
    backstory: Mapped[str] = mapped_column(Text, default="")  # new

class KnowledgeEntry(Base):
    __tablename__ = "knowledge"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

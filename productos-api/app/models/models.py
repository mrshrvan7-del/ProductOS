import datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Organization(Base):
    __tablename__ = "organizations"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # e.g., "org_default" or Clerk org_id
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    projects: Mapped[List["Project"]] = relationship(back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # Clerk user ID or local username
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True)
    role: Mapped[str] = mapped_column(String(20), default="pm")  # admin, pm, stakeholder, viewer
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="users")
    projects_owned: Mapped[List["Project"]] = relationship(back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(100))
    goal: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed, archived
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="projects")
    owner: Mapped["User"] = relationship(back_populates="projects_owned")
    decisions: Mapped[List["Decision"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    stakeholders: Mapped[List["Stakeholder"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    risks: Mapped[List["Risk"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    dependencies: Mapped[List["Dependency"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    meetings: Mapped[List["Meeting"]] = relationship(back_populates="project", cascade="all, delete-orphan")

class Decision(Base):
    __tablename__ = "decisions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    decided_by: Mapped[str] = mapped_column(String(100))  # User ID or name
    linked_goal: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="manual")  # manual, meeting_extraction
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    # Relationships
    project: Mapped["Project"] = relationship(back_populates="decisions")
    approvals: Mapped[List["Approval"]] = relationship(back_populates="decision", cascade="all, delete-orphan")

class Stakeholder(Base):
    __tablename__ = "stakeholders"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100))  # In case external name is used
    role: Mapped[str] = mapped_column(String(100))  # e.g., "Legal", "Security", "Engineering Lead"
    approval_status: Mapped[str] = mapped_column(String(20), default="pending")  # approved, pending, rejected
    
    # Relationships
    project: Mapped["Project"] = relationship(back_populates="stakeholders")
    approvals: Mapped[List["Approval"]] = relationship(back_populates="stakeholder", cascade="all, delete-orphan")

class Approval(Base):
    __tablename__ = "approvals"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"))
    stakeholder_id: Mapped[int] = mapped_column(ForeignKey("stakeholders.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected
    requested_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    resolved_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    decision: Mapped["Decision"] = relationship(back_populates="approvals")
    stakeholder: Mapped["Stakeholder"] = relationship(back_populates="approvals")

# Stub models for Phase 2-4 dependencies, meetings, risks
class Risk(Base):
    __tablename__ = "risks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(200))
    severity: Mapped[str] = mapped_column(String(20))  # low, medium, high, critical
    owner: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="open")  # open, mitigated, closed
    mitigation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    project: Mapped["Project"] = relationship(back_populates="risks")

class Dependency(Base):
    __tablename__ = "dependencies"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    from_team: Mapped[str] = mapped_column(String(100))
    to_team: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, resolved, blocked
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    project: Mapped["Project"] = relationship(back_populates="dependencies")

class Meeting(Base):
    __tablename__ = "meetings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(200), default="Meeting Summary")
    raw_transcript: Mapped[str] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    
    project: Mapped["Project"] = relationship(back_populates="meetings")

class ActionItem(Base):
    __tablename__ = "action_items"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(Integer)  # ForeignKey if linking directly
    description: Mapped[str] = mapped_column(Text)
    owner: Mapped[str] = mapped_column(String(100))
    due_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, completed, overdue
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    source_type: Mapped[str] = mapped_column(String(50))  # meeting, decision, document
    content: Mapped[str] = mapped_column(Text)
    embedding_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Store JSON representation for SQLite vector search fallback
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

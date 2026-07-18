from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# --- Organization ---
class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    id: str

class Organization(OrganizationBase):
    id: str
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# --- User ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "pm"  # pm, admin, stakeholder, viewer

class UserCreate(UserBase):
    id: str
    org_id: str

class User(UserBase):
    id: str
    org_id: str
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# --- Project ---
class ProjectBase(BaseModel):
    name: str
    goal: Optional[str] = None
    status: str = "active"  # active, completed, archived

class ProjectCreate(ProjectBase):
    owner_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None

class Project(ProjectBase):
    id: int
    org_id: str
    owner_id: str
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# --- Stakeholder ---
class StakeholderBase(BaseModel):
    name: str
    role: str  # e.g., Legal, Security, engineering-lead
    user_id: Optional[str] = None

class StakeholderCreate(StakeholderBase):
    project_id: int

class Stakeholder(StakeholderBase):
    id: int
    project_id: int
    approval_status: str
    
    class Config:
        from_attributes = True

# --- Approval ---
class ApprovalBase(BaseModel):
    stakeholder_id: int

class ApprovalCreate(ApprovalBase):
    decision_id: int

class ApprovalUpdate(BaseModel):
    status: str  # approved, rejected, pending

class Approval(ApprovalBase):
    id: int
    decision_id: int
    status: str
    requested_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    stakeholder: Optional[Stakeholder] = None
    
    class Config:
        from_attributes = True

# --- Decision ---
class DecisionBase(BaseModel):
    title: str
    description: str
    decided_by: str
    linked_goal: Optional[str] = None
    source: str = "manual"  # manual, meeting_extraction

class DecisionCreate(DecisionBase):
    project_id: int
    stakeholder_ids: Optional[List[int]] = [] # stakeholders requested for approval

class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    decided_by: Optional[str] = None
    linked_goal: Optional[str] = None
    source: Optional[str] = None

class Decision(DecisionBase):
    id: int
    project_id: int
    created_at: datetime.datetime
    approvals: List[Approval] = []
    
    class Config:
        from_attributes = True

# --- Risk (Phase 2) ---
class RiskBase(BaseModel):
    title: str
    severity: str  # low, medium, high, critical
    owner: str
    status: str = "open"  # open, mitigated, closed
    mitigation: Optional[str] = None

class RiskCreate(RiskBase):
    project_id: int

class RiskUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    mitigation: Optional[str] = None

class Risk(RiskBase):
    id: int
    project_id: int
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# --- Dependency (Phase 2) ---
class DependencyBase(BaseModel):
    from_team: str
    to_team: str
    description: str
    status: str = "active"  # active, resolved, blocked

class DependencyCreate(DependencyBase):
    project_id: int

class DependencyUpdate(BaseModel):
    from_team: Optional[str] = None
    to_team: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Dependency(DependencyBase):
    id: int
    project_id: int
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

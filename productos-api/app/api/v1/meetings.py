from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import datetime
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas
from app.services.ai import LLMExtractionService

router = APIRouter()

class MeetingExtractRequest(BaseModel):
    project_id: int
    transcript: str

class DecisionPersist(BaseModel):
    title: str
    description: str
    decided_by: str
    linked_goal: Optional[str] = None
    stakeholder_ids: Optional[List[int]] = []

class ActionItemPersist(BaseModel):
    description: str
    owner: str
    due_date: Optional[str] = None

class RiskPersist(BaseModel):
    title: str
    severity: str
    owner: str
    mitigation: Optional[str] = None

class MeetingPersistRequest(BaseModel):
    project_id: int
    summary: str
    decisions: List[DecisionPersist] = []
    action_items: List[ActionItemPersist] = []
    risks: List[RiskPersist] = []


@router.post("/extract")
def extract_meeting(
    payload: MeetingExtractRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Submit a raw meeting transcript. Extract candidate decisions, actions, and risks.
    """
    # Verify project belongs to current org
    project = db.query(models.Project).filter(
        models.Project.id == payload.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    try:
        outcomes = LLMExtractionService.extract_from_transcript(payload.transcript)
        return outcomes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process transcript: {str(e)}"
        )

@router.post("/persist", status_code=status.HTTP_201_CREATED)
def persist_meeting_outcomes(
    payload: MeetingPersistRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Save the PM-confirmed decisions, action items, and risks to the database.
    """
    # Verify project
    project = db.query(models.Project).filter(
        models.Project.id == payload.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # 1. Create the Meeting Entry
    meeting = models.Meeting(
        project_id=payload.project_id,
        title=f"Meeting Summary - {datetime.date.today().strftime('%b %d, %Y')}",
        raw_transcript="Ingested via text paste",
        summary=payload.summary,
        processed_at=datetime.datetime.utcnow()
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # 2. Persist Confirmed Decisions
    dec_created = 0
    for dec_data in payload.decisions:
        decision = models.Decision(
            project_id=payload.project_id,
            title=dec_data.title,
            description=dec_data.description,
            decided_by=dec_data.decided_by,
            linked_goal=dec_data.linked_goal,
            source="meeting_extraction",
            created_at=datetime.datetime.utcnow()
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)
        dec_created += 1
        
        # Link stakeholder approvals if requested
        if dec_data.stakeholder_ids:
            for sh_id in dec_data.stakeholder_ids:
                stakeholder = db.query(models.Stakeholder).filter(
                    models.Stakeholder.id == sh_id,
                    models.Stakeholder.project_id == payload.project_id
                ).first()
                if stakeholder:
                    approval = models.Approval(
                        decision_id=decision.id,
                        stakeholder_id=sh_id,
                        status="pending",
                        requested_at=datetime.datetime.utcnow()
                    )
                    db.add(approval)
                    
                    stakeholder.approval_status = "pending"
                    db.add(stakeholder)
            db.commit()
            
    # 3. Persist Confirmed Action Items
    act_created = 0
    for act_data in payload.action_items:
        action = models.ActionItem(
            meeting_id=meeting.id,
            description=act_data.description,
            owner=act_data.owner,
            due_date=act_data.due_date,
            status="pending",
            created_at=datetime.datetime.utcnow()
        )
        db.add(action)
        act_created += 1
    db.commit()
    
    # 4. Persist Confirmed Risks
    risk_created = 0
    for risk_data in payload.risks:
        risk = models.Risk(
            project_id=payload.project_id,
            title=risk_data.title,
            severity=risk_data.severity,
            owner=risk_data.owner,
            status="open",
            mitigation=risk_data.mitigation,
            created_at=datetime.datetime.utcnow()
        )
        db.add(risk)
        risk_created += 1
    db.commit()
    
    return {
        "status": "success",
        "meeting_id": meeting.id,
        "decisions_created": dec_created,
        "action_items_created": act_created,
        "risks_created": risk_created
    }

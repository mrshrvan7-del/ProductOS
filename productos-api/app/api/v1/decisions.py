from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Decision])
def list_decisions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List all decisions for a specific project.
    """
    # Verify project belongs to current org
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
        
    return db.query(models.Decision).filter(models.Decision.project_id == project_id).all()

@router.post("/", response_model=schemas.Decision, status_code=status.HTTP_201_CREATED)
def create_decision(
    decision_in: schemas.DecisionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Create a new decision and initiate approvals if stakeholder IDs are provided.
    """
    # Verify project belongs to current org
    project = db.query(models.Project).filter(
        models.Project.id == decision_in.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
        
    decision = models.Decision(
        project_id=decision_in.project_id,
        title=decision_in.title,
        description=decision_in.description,
        decided_by=decision_in.decided_by,
        linked_goal=decision_in.linked_goal,
        source=decision_in.source
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    
    # If there are requested approvals, create them
    if decision_in.stakeholder_ids:
        for sh_id in decision_in.stakeholder_ids:
            # Verify stakeholder belongs to the same project
            stakeholder = db.query(models.Stakeholder).filter(
                models.Stakeholder.id == sh_id,
                models.Stakeholder.project_id == decision_in.project_id
            ).first()
            if stakeholder:
                approval = models.Approval(
                    decision_id=decision.id,
                    stakeholder_id=sh_id,
                    status="pending",
                    requested_at=datetime.datetime.utcnow()
                )
                db.add(approval)
                
                # Also reset the stakeholder's general project approval status if needed
                stakeholder.approval_status = "pending"
                db.add(stakeholder)
        db.commit()
        db.refresh(decision)
        
    return decision

@router.get("/{decision_id}", response_model=schemas.Decision)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Get decision by ID, verifying organizational tenant isolation.
    """
    decision = db.query(models.Decision).join(models.Project).filter(
        models.Decision.id == decision_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found"
        )
    return decision

@router.put("/{decision_id}", response_model=schemas.Decision)
def update_decision(
    decision_id: int,
    decision_in: schemas.DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Update decision details.
    """
    decision = db.query(models.Decision).join(models.Project).filter(
        models.Decision.id == decision_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found"
        )
        
    update_data = decision_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(decision, field, value)
        
    db.commit()
    db.refresh(decision)
    return decision

@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Delete a decision.
    """
    decision = db.query(models.Decision).join(models.Project).filter(
        models.Decision.id == decision_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found"
        )
    db.delete(decision)
    db.commit()
    return None

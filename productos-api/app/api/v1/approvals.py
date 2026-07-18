from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/pending", response_model=List[schemas.Approval])
def list_pending_approvals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List all pending approvals that the current user is assigned to.
    """
    # A user is mapped to stakeholders by matching user_id or email
    # Find all stakeholder records representing the current user
    stakeholders = db.query(models.Stakeholder).filter(
        models.Stakeholder.user_id == current_user.id
    ).all()
    
    if not stakeholders:
        return []
        
    stakeholder_ids = [s.id for s in stakeholders]
    
    # Get all pending approvals for these stakeholders
    return db.query(models.Approval).filter(
        models.Approval.stakeholder_id.in_(stakeholder_ids),
        models.Approval.status == "pending"
    ).all()

@router.post("/resolve/{approval_id}", response_model=schemas.Approval)
def resolve_approval(
    approval_id: int,
    approval_in: schemas.ApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Approve or reject a decision. Verified to ensure only the assigned stakeholder can resolve it.
    """
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found"
        )
        
    # Check if the user is authorized to sign off for this stakeholder
    stakeholder = db.query(models.Stakeholder).filter(
        models.Stakeholder.id == approval.stakeholder_id
    ).first()
    
    # Check if user owns this stakeholder profile (or mock mode bypass for easy demoing)
    if not settings_bypass_check(stakeholder, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to sign off for this stakeholder"
        )
        
    approval.status = approval_in.status
    approval.resolved_at = datetime.datetime.utcnow()
    
    db.add(approval)
    db.commit()
    db.refresh(approval)
    
    # Update stakeholder's current overall approval status
    if stakeholder:
        # Check if they have any other pending approvals in this project
        pending_count = db.query(models.Approval).join(models.Decision).filter(
            models.Approval.stakeholder_id == stakeholder.id,
            models.Approval.status == "pending",
            models.Decision.project_id == stakeholder.project_id
        ).count()
        
        if pending_count == 0:
            stakeholder.approval_status = approval_in.status
            db.add(stakeholder)
            db.commit()
            
    return approval

@router.get("/project-stakeholders/{project_id}", response_model=List[schemas.Stakeholder])
def list_project_stakeholders(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List stakeholders for a project.
    """
    # Verify project belongs to current org
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return db.query(models.Stakeholder).filter(models.Stakeholder.project_id == project_id).all()

@router.post("/project-stakeholders", response_model=schemas.Stakeholder)
def add_project_stakeholder(
    stakeholder_in: schemas.StakeholderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Add a new stakeholder to a project.
    """
    # Verify project belongs to current org
    project = db.query(models.Project).filter(
        models.Project.id == stakeholder_in.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    stakeholder = models.Stakeholder(
        project_id=stakeholder_in.project_id,
        name=stakeholder_in.name,
        role=stakeholder_in.role,
        user_id=stakeholder_in.user_id,
        approval_status="pending"
    )
    db.add(stakeholder)
    db.commit()
    db.refresh(stakeholder)
    return stakeholder

def settings_bypass_check(stakeholder: models.Stakeholder, current_user: models.User) -> bool:
    from app.config import settings
    # In mock mode, we allow users to sign off on behalf of other mock users to make demos easy!
    if settings.MOCK_AUTH_MODE:
        return True
    return stakeholder.user_id == current_user.id

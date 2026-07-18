from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Risk])
def list_risks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List all risks for a specific project. Scoped by organization for security.
    """
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return db.query(models.Risk).filter(models.Risk.project_id == project_id).all()

@router.post("/", response_model=schemas.Risk, status_code=status.HTTP_201_CREATED)
def create_risk(
    risk_in: schemas.RiskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Log a new project risk.
    """
    project = db.query(models.Project).filter(
        models.Project.id == risk_in.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    risk = models.Risk(
        project_id=risk_in.project_id,
        title=risk_in.title,
        severity=risk_in.severity,
        owner=risk_in.owner,
        status=risk_in.status,
        mitigation=risk_in.mitigation
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk

@router.put("/{risk_id}", response_model=schemas.Risk)
def update_risk(
    risk_id: int,
    risk_in: schemas.RiskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Update details of an existing risk.
    """
    risk = db.query(models.Risk).join(models.Project).filter(
        models.Risk.id == risk_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found"
        )
        
    update_data = risk_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(risk, field, value)
        
    db.commit()
    db.refresh(risk)
    return risk

@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Delete a risk record.
    """
    risk = db.query(models.Risk).join(models.Project).filter(
        models.Risk.id == risk_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found"
        )
    db.delete(risk)
    db.commit()
    return None

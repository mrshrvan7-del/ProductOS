from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Project])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List all projects for the user's organization.
    """
    return db.query(models.Project).filter(models.Project.org_id == current_user.org_id).all()

@router.post("/", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Create a new project.
    """
    project = models.Project(
        org_id=current_user.org_id,
        name=project_in.name,
        goal=project_in.goal,
        status=project_in.status,
        owner_id=project_in.owner_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Auto-seed some default stakeholders for new projects to make it realistic
    default_stakeholders = [
        {"name": "Elena Rostova", "role": "Legal Lead", "user_id": "user_mock_legal"},
        {"name": "Marcus Vance", "role": "Security Head", "user_id": "user_mock_security"},
        {"name": "Dave Miller", "role": "Engineering Lead", "user_id": "user_mock_eng"}
    ]
    for stakeholder_data in default_stakeholders:
        stakeholder = models.Stakeholder(
            project_id=project.id,
            name=stakeholder_data["name"],
            role=stakeholder_data["role"],
            user_id=stakeholder_data["user_id"],
            approval_status="pending"
        )
        db.add(stakeholder)
    db.commit()
    
    return project

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Get project details by ID.
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
    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Update project details.
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
    
    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
        
    db.commit()
    db.refresh(project)
    return project

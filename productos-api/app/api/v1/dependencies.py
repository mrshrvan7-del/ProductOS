from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Dependency])
def list_dependencies(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    List all dependencies for a specific project. Scoped by organization for security.
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
    return db.query(models.Dependency).filter(models.Dependency.project_id == project_id).all()

@router.post("/", response_model=schemas.Dependency, status_code=status.HTTP_201_CREATED)
def create_dependency(
    dependency_in: schemas.DependencyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Log a new cross-team dependency.
    """
    project = db.query(models.Project).filter(
        models.Project.id == dependency_in.project_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    dependency = models.Dependency(
        project_id=dependency_in.project_id,
        from_team=dependency_in.from_team,
        to_team=dependency_in.to_team,
        description=dependency_in.description,
        status=dependency_in.status
    )
    db.add(dependency)
    db.commit()
    db.refresh(dependency)
    return dependency

@router.put("/{dependency_id}", response_model=schemas.Dependency)
def update_dependency(
    dependency_id: int,
    dependency_in: schemas.DependencyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Update details of an existing cross-team dependency.
    """
    dependency = db.query(models.Dependency).join(models.Project).filter(
        models.Dependency.id == dependency_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not dependency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found"
        )
        
    update_data = dependency_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dependency, field, value)
        
    db.commit()
    db.refresh(dependency)
    return dependency

@router.delete("/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependency(
    dependency_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Delete a dependency record.
    """
    dependency = db.query(models.Dependency).join(models.Project).filter(
        models.Dependency.id == dependency_id,
        models.Project.org_id == current_user.org_id
    ).first()
    if not dependency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found"
        )
    db.delete(dependency)
    db.commit()
    return None

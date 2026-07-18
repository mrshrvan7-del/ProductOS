from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(deps.get_current_user)):
    """
    Get the details of the currently authenticated user (or mock user).
    """
    return current_user

@router.get("/mock-users", response_model=List[schemas.User])
def get_mock_users(db: Session = Depends(get_db)):
    """
    Returns a pre-defined list of mock users for easy toggling in the UI.
    """
    mock_users_list = [
        {"id": "user_mock_pm", "name": "Sarah Jenkins (PM)", "email": "sarah.pm@productos.com", "role": "pm"},
        {"id": "user_mock_legal", "name": "Elena Rostova (Legal Lead)", "email": "elena.legal@productos.com", "role": "stakeholder"},
        {"id": "user_mock_security", "name": "Marcus Vance (Security head)", "email": "marcus.security@productos.com", "role": "stakeholder"},
        {"id": "user_mock_eng", "name": "Dave Miller (Engineering Lead)", "email": "dave.eng@productos.com", "role": "stakeholder"},
        {"id": "user_mock_exec", "name": "Robert Chen (VP Product)", "email": "robert.exec@productos.com", "role": "viewer"}
    ]
    
    # Auto-seed mock users so they exist in the DB
    seeded_users = []
    org_id = "org_default"
    
    # Ensure default organization exists
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        org = models.Organization(id=org_id, name="Default Organization")
        db.add(org)
        db.commit()
    
    for u in mock_users_list:
        db_user = db.query(models.User).filter(models.User.id == u["id"]).first()
        if not db_user:
            db_user = models.User(
                id=u["id"],
                org_id=org_id,
                name=u["name"],
                email=u["email"],
                role=u["role"]
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        seeded_users.append(db_user)
        
    return seeded_users

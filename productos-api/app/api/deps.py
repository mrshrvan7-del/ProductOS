from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.config import settings
from app.models import models

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependency to get the current user ID from the Authorization header.
    Supports Clerk JWT or mock/local token fallback.
    """
    if not authorization:
        if settings.MOCK_AUTH_MODE:
            # Return a default PM user for zero-configuration testing
            return "user_mock_pm"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
        )
        
    try:
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer":
            raise ValueError()
    except (ValueError, AttributeError):
        if settings.MOCK_AUTH_MODE:
            return "user_mock_pm"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be Bearer <token>",
        )

    # In mock mode, we allow passing any user ID directly as the token (e.g. Bearer user_mock_pm)
    if settings.MOCK_AUTH_MODE:
        return token

    # TODO: In production with Clerk, verify the Clerk JWT
    # For Phase 1, return the token content as user_id directly
    return token

def get_current_user(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
) -> models.User:
    """
    Retrieve user record. If in mock mode and user does not exist, auto-create it
    with a default organization to enable instant out-of-the-box usage.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        if settings.MOCK_AUTH_MODE:
            # Check if default org exists, create if not
            org_id = "org_default"
            org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
            if not org:
                org = models.Organization(id=org_id, name="Default Organization")
                db.add(org)
                db.commit()
                db.refresh(org)
            
            # Create default user
            role = "pm"
            if "stakeholder" in user_id:
                role = "stakeholder"
            elif "viewer" in user_id:
                role = "viewer"
            elif "admin" in user_id:
                role = "admin"
                
            name = user_id.replace("user_", "").replace("_", " ").title()
            user = models.User(
                id=user_id,
                org_id=org_id,
                name=name,
                email=f"{user_id}@productos.local",
                role=role
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found in database",
            )
    return user

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.services.search import RAGSearchService

router = APIRouter()

class SearchRequest(BaseModel):
    project_id: int
    query: str

class CitationReference(BaseModel):
    id: int
    title: str
    type: str

class SearchResponse(BaseModel):
    answer: str
    citations: List[CitationReference] = []

@router.post("/", response_model=SearchResponse)
def execute_workspace_search(
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Search decisions, risks, and meeting logs inside the active project using semantic similarity.
    """
    # Verify project organizational isolation
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
        results = RAGSearchService.search_workspace(db, payload.project_id, payload.query)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

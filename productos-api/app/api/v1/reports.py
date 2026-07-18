from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.api import deps
from app.models import models
from app.services.reports import ReportGenerationService

router = APIRouter()

class ReportGenerateRequest(BaseModel):
    project_id: int

class ReportResponse(BaseModel):
    project_id: int
    report_markdown: str

@router.post("/generate", response_model=ReportResponse)
def generate_weekly_report(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Generate a formatted weekly Markdown status report using live project registers.
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
        report_text = ReportGenerationService.generate_weekly_status_report(db, payload.project_id)
        return {
            "project_id": payload.project_id,
            "report_markdown": report_text
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )

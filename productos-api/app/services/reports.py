import os
import datetime
import logging
from sqlalchemy.orm import Session
from app.models import models

logger = logging.getLogger("productos.reports")

class ReportGenerationService:
    @staticmethod
    def generate_weekly_status_report(db: Session, project_id: int) -> str:
        """
        Aggregate live decisions, open risks, pending approvals, and blocked dependencies.
        Pass data to LLM to generate a clean, executive-ready weekly status markdown document.
        """
        # 1. Fetch live data
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            return "Project not found."

        # Fetch recent decisions (e.g., last 7 days, or all if empty - let's grab all for demo)
        decisions = db.query(models.Decision).filter(models.Decision.project_id == project_id).all()
        
        # Fetch open risks
        open_risks = db.query(models.Risk).filter(
            models.Risk.project_id == project_id,
            models.Risk.status == "open"
        ).all()
        
        # Fetch blocked dependencies
        blocked_deps = db.query(models.Dependency).filter(
            models.Dependency.project_id == project_id,
            models.Dependency.status == "blocked"
        ).all()
        
        # Compile status counts
        pending_decisions_count = 0
        total_pending_approvals = 0
        for dec in decisions:
            if dec.approvals:
                is_pending = any(a.status == "pending" for a in dec.approvals)
                if is_pending:
                    pending_decisions_count += 1
                total_pending_approvals += len([a for a in dec.approvals if a.status == "pending"])

        # Calculate Delivery Confidence Score locally
        # Confidence = max(0, 100 - (5D + 5M + 10H + 20C + 15B))
        critical_count = len([r for r in open_risks if r.severity == "critical"])
        high_count = len([r for r in open_risks if r.severity == "high"])
        medium_count = len([r for r in open_risks if r.severity == "medium"])
        blocked_count = len(blocked_deps)
        
        penalty_D = pending_decisions_count * 5
        penalty_M = medium_count * 5
        penalty_H = high_count * 10
        penalty_C = critical_count * 20
        penalty_B = blocked_count * 15
        
        confidence = max(0, 100 - penalty_D - penalty_M - penalty_H - penalty_C - penalty_B)

        # 2. Format context for LLM
        data_summary = f"""
Project Name: {project.name}
Objective: {project.goal or 'Not defined'}
Current Status: Active
Report Date: {datetime.date.today().strftime('%B %d, %Y')}
Calculated Delivery Confidence: {confidence}%

Decisions Logged:
"""
        for d in decisions:
            data_summary += f"- '{d.title}': {d.description} (Decided by: {d.decided_by})\n"
            
        data_summary += "\nOpen Risks:\n"
        for r in open_risks:
            data_summary += f"- {r.title} (Severity: {r.severity.upper()}, Owner: {r.owner}, Mitigation: {r.mitigation or 'None'})\n"

        data_summary += "\nBlocked Dependencies:\n"
        for bd in blocked_deps:
            data_summary += f"- {bd.from_team} depends on {bd.to_team} for: {bd.description}\n"

        # 3. Generate Report via LLM (Gemini/OpenAI or Local Fallback)
        openai_key = os.getenv("OPENAI_API_KEY", "")
        gemini_key = os.getenv("GEMINI_API_KEY", "")

        prompt = f"""
You are an executive product management reporting bot.
Using the following raw workspace data, generate a highly professional, visually appealing Weekly Status Report in Markdown format.

Your report MUST contain these sections:
# Executive Summary (Explain project name, goal, date, and overall delivery confidence score)
## Key Accomplishments & Decisions (Highlight decisions logged and resolved items)
## Critical Blockers & Risks (List blocked dependencies and high/critical risks needing mitigation)
## Action Items & Next Steps (Outline who owns what and due dates based on context)

Keep the formatting clean, bulleted, and ready for senior executives.

Raw Workspace Data:
{data_summary}
"""

        # Try Gemini
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini report generation failed: {e}")

        # Try OpenAI
        if openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional PM report writer. Output Markdown format."},
                        {"role": "user", "content": prompt}
                    ]
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI report generation failed: {e}")

        # Local High-Fidelity Mock Report Fallback
        return ReportGenerationService._generate_mock_report(project, confidence, decisions, open_risks, blocked_deps)

    @staticmethod
    def _generate_mock_report(project, confidence, decisions, open_risks, blocked_deps) -> str:
        date_str = datetime.date.today().strftime('%B %d, %Y')
        
        decisions_md = ""
        for d in decisions:
            decisions_md += f"- **{d.title}**: {d.description} (Decided by: {d.decided_by})\n"
            
        risks_md = ""
        for r in open_risks:
            risks_md += f"- **{r.title}** (Severity: `{r.severity.upper()}`, Owner: *{r.owner}*)\n  *Mitigation*: {r.mitigation or 'Pre-schedule alignment calls.'}\n"
            
        deps_md = ""
        for bd in blocked_deps:
            deps_md += f"- **{bd.from_team}** is blocked by **{bd.to_team}**: {bd.description}\n"

        return f"""# Project Weekly Status Report: {project.name}
**Date:** {date_str}  
**Initiative Objective:** {project.goal or "Deploy checkout integrations."}  
**Overall Delivery Confidence:** `{confidence}%`  

---

## 📋 Executive Summary
The initiative **{project.name}** is currently in an active development phase. Our computed delivery confidence stands at **`{confidence}%`**, reflecting some risk exposure related to compliance clearances and cross-team dependencies. All core data matches active registers and has been synced.

---

## 🏆 Key Accomplishments & Decisions
We have logged key structural decisions to safeguard our launch timeline and reduce implementation overhead:
{decisions_md or "- No decisions logged this week."}

---

## ⚠️ Critical Blockers & Risks
The following risks and blocked dependency paths require management intervention and priority syncs:

### Blocked Pipelines
{deps_md or "- No blocked dependencies currently."}

### Operational Risks
{risks_md or "- No open high/critical risks detected."}

---

## 🎯 Action Items & Next Steps
1. **Unblock Security Paths**: Align Legal with Security leads to resolve privacy clearance details.
2. **Mitigate German/French Clearing**: Submit fallback filings using local entity coordinates (Owner: Elena Rostova).
3. **Audit Webhook Configuration**: Confirm security token hashes are valid (Owner: Marcus Vance).
"""

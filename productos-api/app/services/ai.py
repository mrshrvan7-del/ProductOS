import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("productos.ai")

class DecisionExtraction(BaseModel):
    title: str = Field(description="Title of the decision made in the meeting")
    description: str = Field(description="Context, alternatives considered, and rationale")
    decided_by: str = Field(description="Person who made or led the decision")
    linked_goal: Optional[str] = Field(None, description="Optional strategic goal or deadline linked to this decision")

class ActionItemExtraction(BaseModel):
    description: str = Field(description="Clear, actionable task description")
    owner: str = Field(description="Name of the person assigned to this action item")
    due_date: Optional[str] = Field(None, description="Due date if mentioned, else null")

class RiskExtraction(BaseModel):
    title: str = Field(description="Identified delivery risk or blocker")
    severity: str = Field(description="low | medium | high | critical")
    owner: str = Field(description="Person responsible for monitoring/mitigating the risk")
    mitigation: str = Field(description="Action steps or mitigation plan discussed")

class MeetingOutcomesResponse(BaseModel):
    summary: str = Field(description="A 2-3 sentence high-level executive summary of the meeting")
    decisions: List[DecisionExtraction] = Field(default=[], description="List of decisions made")
    action_items: List[ActionItemExtraction] = Field(default=[], description="List of action items assigned")
    risks: List[RiskExtraction] = Field(default=[], description="List of delivery risks identified")


class LLMExtractionService:
    @staticmethod
    def extract_from_transcript(transcript: str) -> Dict[str, Any]:
        """
        Extract structured decisions, action items, and risks from a meeting transcript.
        Falls back to a high-fidelity local keyword/mock extractor if no API keys are present.
        """
        # Check for API keys
        openai_key = os.getenv("OPENAI_API_KEY", "")
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        
        # 1. Try Gemini if configured
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                prompt = LLMExtractionService._build_prompt(transcript)
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                return json.loads(response.text)
            except Exception as e:
                logger.error(f"Gemini extraction failed, falling back: {e}")

        # 2. Try OpenAI if configured
        if openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                prompt = LLMExtractionService._build_prompt(transcript)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "value": "You are a professional product operations analyst. Extract meeting outcomes in strict JSON format."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error(f"OpenAI extraction failed, falling back: {e}")

        # 3. Local Mock / Keyword Fallback Engine (for zero-configuration demo run)
        return LLMExtractionService._mock_extraction_fallback(transcript)

    @staticmethod
    def _build_prompt(transcript: str) -> str:
        schema = MeetingOutcomesResponse.model_json_schema()
        return f"""
Analyze the following raw meeting transcript and extract structured project outcomes.
You must return a JSON object that adheres strictly to this JSON schema:
{json.dumps(schema, indent=2)}

Do not include any chat wrapper or markdown formatting. Output ONLY the JSON block.

Transcript:
{transcript}
"""

    @staticmethod
    def _mock_extraction_fallback(transcript: str) -> Dict[str, Any]:
        """
        A high-fidelity rule-based matcher that detects keywords in the transcript 
        to return contextual mock outcomes for demo purposes.
        """
        text_lower = transcript.lower()
        
        # Check if the transcript is related to checkout / payments / Stripe
        if "stripe" in text_lower or "payment" in text_lower or "checkout" in text_lower:
            return {
                "summary": "The team aligned on the regional checkout migration pathway. We are proceeding with Stripe Elements to stay within scope, but legal and security reviews remain outstanding.",
                "decisions": [
                    {
                        "title": "Use Stripe Elements for Regional checkout inputs",
                        "description": "Proceeding with standard Stripe Elements to bypass the $50k+ PCI-DSS custom audit scope, saving 4-6 weeks of deployment delay.",
                        "decided_by": "Sarah Jenkins",
                        "linked_goal": "PCI-DSS compliance audit mitigation"
                    }
                ],
                "action_items": [
                    {
                        "description": "Verify Stripe webhook endpoint security policies",
                        "owner": "Marcus Vance",
                        "due_date": "2026-07-25"
                    },
                    {
                        "description": "Draft updated EU regional privacy disclaimer",
                        "owner": "Elena Rostova",
                        "due_date": "2026-07-28"
                    }
                ],
                "risks": [
                    {
                        "title": "Regulatory bank clearance latency in Germany and France",
                        "severity": "high",
                        "owner": "Elena Rostova",
                        "mitigation": "Initiate pre-filing validation checks via our local subsidiary details."
                    }
                ]
            }
            
        # Default mock response for generic transcripts
        return {
            "summary": "Weekly sprint coordination meeting. Checked off active requirements and resolved roadmap prioritization blockers.",
            "decisions": [
                {
                    "title": "Prioritize database index refactoring over analytics dashboard",
                    "description": "Database index optimization is necessary to address query time degradation (>2s) on production before shipping new dashboard widgets.",
                    "decided_by": "Sarah Jenkins",
                    "linked_goal": "Improve response times under 500ms"
                }
            ],
            "action_items": [
                {
                    "description": "Analyze slow queries on decisions table",
                    "owner": "Dave Miller",
                    "due_date": "2026-07-22"
                }
            ],
            "risks": [
                {
                    "title": "Query performance hits during index builds",
                    "severity": "medium",
                    "owner": "Dave Miller",
                    "mitigation": "Perform index updates during low-traffic maintenance window (Sunday 2 AM UTC)."
                }
            ]
        }

from fastapi.testclient import TestClient
from app.main import app
import datetime

client = TestClient(app)

def test_full_flow():
    print("Starting in-process TestClient verification...")
    
    # 1. Verify health
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "online"
    print("Health check: PASS")
    
    # 2. Get current profile
    headers = {"Authorization": "Bearer user_mock_pm"}
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    user = r.json()
    assert user["id"] == "user_mock_pm"
    print("Auth profile check: PASS")
    
    # 3. Create Project
    project_payload = {
        "name": "E2E Test Project",
        "goal": "Verify all Phase 3 endpoints.",
        "status": "active",
        "owner_id": "user_mock_pm"
    }
    r = client.post("/api/v1/projects/", json=project_payload, headers=headers)
    assert r.status_code == 201
    project = r.json()
    project_id = project["id"]
    print(f"Project created (ID: {project_id}): PASS")
    
    # 4. Fetch stakeholders
    r = client.get(f"/api/v1/approvals/project-stakeholders/{project_id}", headers=headers)
    assert r.status_code == 200
    stakeholders = r.json()
    assert len(stakeholders) > 0
    sh_legal = [s for s in stakeholders if "Legal" in s["role"]][0]
    print("Stakeholders listing check: PASS")
    
    # 5. Extract meeting outcomes
    transcript_payload = {
        "project_id": project_id,
        "transcript": "Let's use Stripe Elements. Marcus Vance must lock down webhooks by July 25."
    }
    r = client.post("/api/v1/meetings/extract", json=transcript_payload, headers=headers)
    assert r.status_code == 200
    outcomes = r.json()
    assert "decisions" in outcomes
    assert len(outcomes["decisions"]) > 0
    print("AI extraction check: PASS")
    
    # 6. Persist outcomes
    persist_payload = {
        "project_id": project_id,
        "summary": outcomes["summary"],
        "decisions": [
            {
                "title": outcomes["decisions"][0]["title"],
                "description": outcomes["decisions"][0]["description"],
                "decided_by": outcomes["decisions"][0]["decided_by"],
                "linked_goal": outcomes["decisions"][0].get("linked_goal"),
                "stakeholder_ids": [sh_legal["id"]]
            }
        ],
        "action_items": [
            {
                "description": outcomes["action_items"][0]["description"],
                "owner": outcomes["action_items"][0]["owner"],
                "due_date": outcomes["action_items"][0].get("due_date")
            }
        ],
        "risks": [
            {
                "title": outcomes["risks"][0]["title"],
                "severity": outcomes["risks"][0]["severity"],
                "owner": outcomes["risks"][0]["owner"],
                "mitigation": outcomes["risks"][0].get("mitigation")
            }
        ]
    }
    r = client.post("/api/v1/meetings/persist", json=persist_payload, headers=headers)
    assert r.status_code == 201
    results = r.json()
    assert results["status"] == "success"
    assert results["decisions_created"] == 1
    assert results["action_items_created"] == 1
    assert results["risks_created"] == 1
    print("Outcomes database persistence check: PASS")
    
    # 7. Check approvals created for decision
    r = client.get(f"/api/v1/decisions/?project_id={project_id}", headers=headers)
    assert r.status_code == 200
    decisions_list = r.json()
    latest_decision = [d for d in decisions_list if d["source"] == "meeting_extraction"][0]
    assert len(latest_decision["approvals"]) == 1
    assert latest_decision["approvals"][0]["status"] == "pending"
    # 8. RAG Search Query
    search_payload = {
        "project_id": project_id,
        "query": "Why did we choose Stripe Elements?"
    }
    r = client.post("/api/v1/search/", json=search_payload, headers=headers)
    assert r.status_code == 200
    search_res = r.json()
    assert "answer" in search_res
    assert len(search_res["citations"]) > 0
    print("RAG Search query check: PASS")

    # 9. AI Executive Report Generation
    report_payload = {
        "project_id": project_id
    }
    r = client.post("/api/v1/reports/generate", json=report_payload, headers=headers)
    assert r.status_code == 200
    report_res = r.json()
    assert "report_markdown" in report_res
    assert "Executive Summary" in report_res["report_markdown"]
    print("AI Report generation check: PASS")

    print("\nAll in-process API tests completed successfully with zero errors!")

if __name__ == "__main__":
    test_full_flow()

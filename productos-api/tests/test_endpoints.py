import httpx
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_flow():
    print("Starting integration test flow...")
    
    # 1. Check health
    try:
        r = httpx.get("http://127.0.0.1:8000/")
        print("Root response:", r.json())
    except Exception as e:
        print("Backend server is not running or unreachable:", e)
        return False
        
    # 2. Get me
    headers = {"Authorization": "Bearer user_mock_pm"}
    r = httpx.get(f"{BASE_URL}/auth/me", headers=headers)
    print("Auth me response:", r.json())
    assert r.status_code == 200
    
    # 3. Create a project
    project_payload = {
        "name": "Integration Test Project",
        "goal": "Verify all Phase 1 capabilities end-to-end.",
        "status": "active",
        "owner_id": "user_mock_pm"
    }
    r = httpx.post(f"{BASE_URL}/projects/", json=project_payload, headers=headers)
    project = r.json()
    print("Project creation response:", project)
    assert r.status_code == 201
    project_id = project["id"]
    
    # 4. Fetch stakeholders for project
    r = httpx.get(f"{BASE_URL}/approvals/project-stakeholders/{project_id}", headers=headers)
    stakeholders = r.json()
    print("Stakeholders list:", stakeholders)
    assert len(stakeholders) > 0
    sh_legal = [s for s in stakeholders if "Legal" in s["role"]][0]
    
    # 5. Create a Decision requesting legal approval
    decision_payload = {
        "project_id": project_id,
        "title": "Decide on legal clearance checklist",
        "description": "Integration test decision context checking off rules.",
        "decided_by": "Sarah Jenkins",
        "linked_goal": "Skip custom PCI",
        "source": "manual",
        "stakeholder_ids": [sh_legal["id"]]
    }
    r = httpx.post(f"{BASE_URL}/decisions/", json=decision_payload, headers=headers)
    decision = r.json()
    print("Decision creation response:", decision)
    assert r.status_code == 201
    
    # 6. Check approvals generated
    assert len(decision["approvals"]) == 1
    approval = decision["approvals"][0]
    assert approval["status"] == "pending"
    assert approval["stakeholder_id"] == sh_legal["id"]
    
    # 7. Resolve approval as legal stakeholder
    resolve_headers = {"Authorization": f"Bearer {sh_legal['user_id']}"}
    r = httpx.post(
        f"{BASE_URL}/approvals/resolve/{approval['id']}", 
        json={"status": "approved"}, 
        headers=resolve_headers
    )
    resolved_appr = r.json()
    print("Resolved approval response:", resolved_appr)
    assert r.status_code == 200
    assert resolved_appr["status"] == "approved"
    
    # 8. Fetch decision to confirm it's now fully approved
    r = httpx.get(f"{BASE_URL}/decisions/{decision['id']}", headers=headers)
    updated_decision = r.json()
    print("Updated decision response:", updated_decision)
    assert updated_decision["approvals"][0]["status"] == "approved"
    
    print("\nIntegration test completed successfully!")
    return True

if __name__ == "__main__":
    test_flow()

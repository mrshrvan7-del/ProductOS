import httpx

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
        "goal": "Verify all Phase 1 and 2 capabilities end-to-end.",
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
    
    # 6. Resolve approval as legal stakeholder
    approval = decision["approvals"][0]
    resolve_headers = {"Authorization": f"Bearer {sh_legal['user_id']}"}
    r = httpx.post(
        f"{BASE_URL}/approvals/resolve/{approval['id']}", 
        json={"status": "approved"}, 
        headers=resolve_headers
    )
    resolved_appr = r.json()
    print("Resolved approval response:", resolved_appr)
    assert r.status_code == 200
    
    # 7. Create a Risk (Phase 2)
    risk_payload = {
        "project_id": project_id,
        "title": "Regulatory filing delay in regional bank checkouts",
        "severity": "high",
        "owner": "Elena Rostova",
        "status": "open",
        "mitigation": "Bypass using international entity approvals."
    }
    r = httpx.post(f"{BASE_URL}/risks/", json=risk_payload, headers=headers)
    risk = r.json()
    print("Risk creation response:", risk)
    assert r.status_code == 201
    risk_id = risk["id"]
    
    # 8. Update Risk status (Phase 2)
    r = httpx.put(f"{BASE_URL}/risks/{risk_id}", json={"status": "closed"}, headers=headers)
    updated_risk = r.json()
    print("Updated risk response:", updated_risk)
    assert r.status_code == 200
    assert updated_risk["status"] == "closed"
    
    # 9. Create a Dependency (Phase 2)
    dep_payload = {
        "project_id": project_id,
        "from_team": "Legal",
        "to_team": "Compliance",
        "description": "Regulatory checklist audit approval",
        "status": "blocked"
    }
    r = httpx.post(f"{BASE_URL}/dependencies/", json=dep_payload, headers=headers)
    dependency = r.json()
    print("Dependency creation response:", dependency)
    assert r.status_code == 201
    dep_id = dependency["id"]
    
    # 10. Resolve Dependency status (Phase 2)
    r = httpx.put(f"{BASE_URL}/dependencies/{dep_id}", json={"status": "resolved"}, headers=headers)
    updated_dep = r.json()
    print("Updated dependency response:", updated_dep)
    assert r.status_code == 200
    assert updated_dep["status"] == "resolved"
    
    print("\nIntegration test completed successfully for both Phase 1 and Phase 2!")
    return True

if __name__ == "__main__":
    test_flow()

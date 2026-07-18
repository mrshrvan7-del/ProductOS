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
        "goal": "Verify all Phase 1, 2, and 3 capabilities end-to-end.",
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

    # 11. Run AI Meeting Extraction (Phase 3)
    transcript_payload = {
        "project_id": project_id,
        "transcript": "Let's migrate regional checkout inputs to Stripe Elements. We also need Elena to draft EU disclaimer by July 28."
    }
    r = httpx.post(f"{BASE_URL}/meetings/extract", json=transcript_payload, headers=headers)
    extracted_outcomes = r.json()
    print("AI Extracted outcomes:", extracted_outcomes)
    assert r.status_code == 200
    assert len(extracted_outcomes["decisions"]) > 0
    
    # 12. Persist AI Extracted Outcomes (Phase 3)
    persist_payload = {
        "project_id": project_id,
        "summary": extracted_outcomes["summary"],
        "decisions": [
            {
                "title": extracted_outcomes["decisions"][0]["title"],
                "description": extracted_outcomes["decisions"][0]["description"],
                "decided_by": extracted_outcomes["decisions"][0]["decided_by"],
                "linked_goal": extracted_outcomes["decisions"][0].get("linked_goal"),
                "stakeholder_ids": [sh_legal["id"]]  # request legal signoff on this extracted decision!
            }
        ],
        "action_items": [
            {
                "description": extracted_outcomes["action_items"][0]["description"],
                "owner": extracted_outcomes["action_items"][0]["owner"],
                "due_date": extracted_outcomes["action_items"][0].get("due_date")
            }
        ],
        "risks": [
            {
                "title": extracted_outcomes["risks"][0]["title"],
                "severity": extracted_outcomes["risks"][0]["severity"],
                "owner": extracted_outcomes["risks"][0]["owner"],
                "mitigation": extracted_outcomes["risks"][0].get("mitigation")
            }
        ]
    }
    
    r = httpx.post(f"{BASE_URL}/meetings/persist", json=persist_payload, headers=headers)
    persist_response = r.json()
    print("Persist response:", persist_response)
    assert r.status_code == 201
    assert persist_response["status"] == "success"
    assert persist_response["decisions_created"] == 1
    assert persist_response["action_items_created"] == 1
    assert persist_response["risks_created"] == 1
    
    print("\nIntegration test completed successfully for Phase 1, Phase 2, and Phase 3!")
    return True

if __name__ == "__main__":
    test_flow()

import datetime
from app.db.session import SessionLocal, engine
from app.models.base import Base
from app.models import models

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Check if default org exists
    org = db.query(models.Organization).filter(models.Organization.id == "org_default").first()
    if not org:
        org = models.Organization(id="org_default", name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
        print("Seeded Organization: org_default")
        
    # 2. Seed Mock Users
    mock_users_list = [
        {"id": "user_mock_pm", "name": "Sarah Jenkins", "email": "sarah.pm@productos.local", "role": "pm"},
        {"id": "user_mock_legal", "name": "Elena Rostova", "email": "elena.legal@productos.local", "role": "stakeholder"},
        {"id": "user_mock_security", "name": "Marcus Vance", "email": "marcus.security@productos.local", "role": "stakeholder"},
        {"id": "user_mock_eng", "name": "Dave Miller", "email": "dave.eng@productos.local", "role": "stakeholder"},
        {"id": "user_mock_exec", "name": "Robert Chen", "email": "robert.exec@productos.local", "role": "viewer"}
    ]
    
    users = {}
    for u in mock_users_list:
        db_user = db.query(models.User).filter(models.User.id == u["id"]).first()
        if not db_user:
            db_user = models.User(
                id=u["id"],
                org_id=org.id,
                name=u["name"],
                email=u["email"],
                role=u["role"]
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            print(f"Seeded User: {u['name']}")
        users[u["id"]] = db_user
        
    # 3. Seed Mock Project: NextGen Payments Launch
    project = db.query(models.Project).filter(models.Project.name == "NextGen Payments Launch").first()
    if not project:
        project = models.Project(
            org_id=org.id,
            name="NextGen Payments Launch",
            goal="Deploy multi-regional checkout integration supporting Stripe and local wallets with compliance clearance.",
            status="active",
            owner_id=users["user_mock_pm"].id
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        print("Seeded Project: NextGen Payments Launch")
        
    # 4. Seed Stakeholders for Project
    stakeholder_records = [
        {"name": "Elena Rostova", "role": "Legal Lead", "user_id": "user_mock_legal"},
        {"name": "Marcus Vance", "role": "Security Head", "user_id": "user_mock_security"},
        {"name": "Dave Miller", "role": "Engineering Lead", "user_id": "user_mock_eng"}
    ]
    
    stakeholders = {}
    for sh in stakeholder_records:
        db_sh = db.query(models.Stakeholder).filter(
            models.Stakeholder.project_id == project.id,
            models.Stakeholder.name == sh["name"]
        ).first()
        if not db_sh:
            db_sh = models.Stakeholder(
                project_id=project.id,
                name=sh["name"],
                role=sh["role"],
                user_id=sh["user_id"],
                approval_status="pending"
            )
            db.add(db_sh)
            db.commit()
            db.refresh(db_sh)
            print(f"Seeded Stakeholder: {sh['name']} for project")
        stakeholders[sh["user_id"]] = db_sh
        
    # 5. Seed Decisions
    decisions_list = [
        {
            "title": "Use Stripe Elements for Regional checkout inputs",
            "description": "After evaluation of Custom PCI-DSS Compliance cost ($50k+) vs Stripe Elements ready-made inputs, we have decided to stick with Stripe Elements for Phase 1. This shaves off 4 weeks of compliance audit.",
            "decided_by": "Sarah Jenkins",
            "linked_goal": "Optimize development speed & skip full PCI scope",
            "source": "manual"
        },
        {
            "title": "Deprioritize Apple Pay in first release",
            "description": "Due to delay in Apple Developer account validation for our European legal entity, Apple Pay support is pushed to Phase 2. Android Pay and Standard Credit cards remain in scope.",
            "decided_by": "Sarah Jenkins",
            "linked_goal": "Ensure July 30 release deadline is met",
            "source": "meeting_extraction"
        }
    ]
    
    for dec in decisions_list:
        db_dec = db.query(models.Decision).filter(
            models.Decision.project_id == project.id,
            models.Decision.title == dec["title"]
        ).first()
        if not db_dec:
            db_dec = models.Decision(
                project_id=project.id,
                title=dec["title"],
                description=dec["description"],
                decided_by=dec.get("decided_by"),
                linked_goal=dec.get("linked_goal"),
                source=dec["source"]
            )
            db.add(db_dec)
            db.commit()
            db.refresh(db_dec)
            print(f"Seeded Decision: {dec['title']}")
            
            # Create a pending approval for Legal and Eng on Stripe Elements decision
            if "Stripe Elements" in dec["title"]:
                for uid in ["user_mock_legal", "user_mock_eng"]:
                    appr = models.Approval(
                        decision_id=db_dec.id,
                        stakeholder_id=stakeholders[uid].id,
                        status="pending"
                    )
                    db.add(appr)
                db.commit()
                print(f"Added pending approvals to decision: {dec['title']}")
                
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()

import sys
import httpx

def seed_github():
    print("====================================================")
    print("  ProductOS - GitHub Project & Issues Seeder        ")
    print("====================================================\n")
    
    # Get user credentials securely
    token = input("Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Error: GitHub PAT is required.")
        return
        
    repo = input("Enter your repository (default: mrshrvan7-del/ProductOS): ").strip()
    if not repo:
        repo = "mrshrvan7-del/ProductOS"
        
    base_url = f"https://api.github.com/repos/{repo}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # 1. Define Labels to create
    labels = [
        {"name": "area:ingestion", "color": "1d76db", "description": "Meetings, Slack, and file ingestion modules"},
        {"name": "area:governance", "color": "5319e7", "description": "Role-based approvals, stakeholders, and sign-offs"},
        {"name": "area:rag-search", "color": "0052cc", "description": "Semantic search, query engine, and report exporters"},
        {"name": "area:packaging", "color": "006b75", "description": "Docker, docker-compose, and deploy configs"},
        {"name": "priority:critical", "color": "bf2600", "description": "Blocker issues that require immediate mitigation"}
    ]

    print("\n[1/2] Creating Custom Workflow Labels...")
    for label in labels:
        try:
            r = httpx.post(f"{base_url}/labels", json=label, headers=headers)
            if r.status_code == 201:
                print(f"  + Created label: {label['name']}")
            elif r.status_code == 422:
                print(f"  ~ Label already exists: {label['name']}")
            else:
                print(f"  ! Failed to create label {label['name']}: {r.status_code}")
        except Exception as e:
            print(f"  ! Error creating label {label['name']}: {e}")

    # 2. Define Issues to create
    issues = [
        {
            "title": "Ingestion: Implement unstructured meeting transcript text intake and parser",
            "body": """### Objective
Build the entry point for unstructured organizational conversations.

### Key Deliverables
- [ ] Create frontend paste area for raw audio transcript text (Zoom, Teams, Meet).
- [ ] Add loading indicators and quick-start mock template buttons.
- [ ] Link backend endpoint to trigger raw parsing pipelines.

*Related: Ingestion Layer (Pillar 1)*""",
            "labels": ["area:ingestion", "priority:critical"]
        },
        {
            "title": "Ingestion: Configure AI outcomes extraction parsing engine",
            "body": """### Objective
Translate plain transcript texts into structured project databases.

### Key Deliverables
- [ ] Implement LLM parsing wrapper (`app/services/ai.py`) returning strict JSON models.
- [ ] Map output arrays to candidate Decisions, Action Items, and Risks.
- [ ] Enforce fallback keyword model for local offline development.

*Related: SOP Builder & SOP Generator (Pillars 3 & 6)*""",
            "labels": ["area:ingestion"]
        },
        {
            "title": "Governance: Build role-based approval routing state machine",
            "body": """### Objective
Subject AI-extracted processes to human-in-the-loop validation gates.

### Key Deliverables
- [ ] Integrate user role toggles (Sarah PM, Elena Legal, Marcus Security, Dave Eng).
- [ ] Route pending decisions to designated department leads.
- [ ] Track approval changes and write to timeline logs only after 100% sign-off.

*Related: Approval & Governance (Pillar 13)*""",
            "labels": ["area:governance", "priority:critical"]
        },
        {
            "title": "Activation: Create RAG semantic query engine with local SQLite cosine matching",
            "body": """### Objective
Enable conversational search over all logged decisions, meetings, and risks.

### Key Deliverables
- [ ] Create local Python token cosine similarity vector matching for SQLite fallback.
- [ ] Build API router `/api/v1/search/` returning answer summaries and citation indices.
- [ ] Create search page UI with citation tags that open detail panels on click.

*Related: Organizational Memory & Organizational Brain (Pillars 2 & 8)*""",
            "labels": ["area:rag-search", "priority:critical"]
        },
        {
            "title": "Activation: Build Confluence-style AI Status Report builder split editor",
            "body": """### Objective
Automate weekly report generation and allow PM review/edit controls.

### Key Deliverables
- [ ] Build `/api/v1/reports/generate` endpoint aggregating active project data.
- [ ] Create Next.js reports center splits: left raw editor, right live HTML preview.
- [ ] Add copy-to-clipboard and `.md` file download toolbar utilities.

*Related: SOP Generator & Knowledge Versioning (Pillars 6 & 14)*""",
            "labels": ["area:rag-search"]
        },
        {
            "title": "Packaging: Containerize platform with Docker and docker-compose configurations",
            "body": """### Objective
Standardize environments so the platform runs immediately on any local terminal.

### Key Deliverables
- [ ] Create multi-stage frontend Next.js and backend FastAPI Dockerfiles.
- [ ] Write `docker-compose.yml` defining port mappings and auto-seeding tasks.
- [ ] Expose standard production environment configurations.

*Related: ProductOS Core (Pillar 5)*""",
            "labels": ["area:packaging"]
        },
        {
            "title": "Case Study: Write architectural case study detailing engine logic and algorithms",
            "body": """### Objective
Provide comprehensive architectural documentation for developers and stakeholders.

### Key Deliverables
- [ ] Document database ERD schemas, table constraints, and organization isolations.
- [ ] Detail delivery confidence score calculations and risk weights.
- [ ] Detail token vector cosine distance mechanics and state machine paths.

*Related: SOP Operating System Vision*""",
            "labels": ["area:packaging"]
        }
    ]

    print("\n[2/2] Seeding Structured Repository Issues...")
    for issue in issues:
        try:
            r = httpx.post(f"{base_url}/issues", json=issue, headers=headers)
            if r.status_code == 201:
                created_issue = r.json()
                print(f"  + Created Issue #{created_issue['number']}: {issue['title']}")
            else:
                print(f"  ! Failed to create issue: {issue['title']} (HTTP {r.status_code})")
        except Exception as e:
            print(f"  ! Error creating issue {issue['title']}: {e}")

    print("\n====================================================")
    print("  Sync Complete! Issues are now live on your board.  ")
    print("====================================================")

if __name__ == "__main__":
    try:
        seed_github()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)

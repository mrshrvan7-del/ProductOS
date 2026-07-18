# ProductOS — Product Decision Intelligence & Operations Platform

ProductOS is a centralized, high-fidelity operations and decision-governance platform designed for Product Managers, engineering leads, and stakeholders. Instead of tracking *what* tasks need to be done (which execution tools like Jira already do well), ProductOS tracks *why* decisions were made, maps cross-team dependencies, flags delivery risks, and calculates overall release health in real time.

---

## 🚀 Key Features (Phase 1 & 2)

- **Decision Journal & Log**: A timeline showing structural product decisions, contextual rationale, linked strategic goals, and formal stakeholder sign-off status.
- **Interactive SVG Dependency Flow**: A custom-built, responsive visual map showing team relationships (Legal, Security, Engineering, Compliance) connected by animated, color-coded lines. Blocked pathways are automatically highlighted in red.
- **Risk Exposure Heatmap**: A 2x2 risk matrix categorizing open risks by severity (Critical, High, Medium, Low) to track mitigations and owners.
- **Delivery Confidence Engine**: A mathematical calculation engine that computes a percentage-based health index for initiatives:
  $$\text{Confidence} = \max\left(0,\, 100 - (5D + 5M + 10H + 20C + 15B)\right)$$
  - *D = Pending Decisions, M = Medium Risks, H = High Risks, C = Critical Risks, B = Blocked Dependencies*
- **Persona Demo Switcher**: A dropdown menu allowing users to switch between Product Manager, Legal, Security, and Engineering personas to test stakeholder sign-offs interactively.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand, and Custom SVG Flow rendering.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0.
- **Database**: SQLite (default local fallback for zero-configuration testing) or PostgreSQL.

---

## ⚙️ Quick Start

### 1. Prerequisite: Seed the Database
Ensure the local SQLite database is populated with initial mock organizations, projects, decisions, and stakeholders:
```bash
cd productos-api
.\.venv\Scripts\activate
python seed.py
```

### 2. Run the Backend API
Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```
- The backend API will be available at `http://127.0.0.1:8000`
- Swagger documentation is accessible at `http://127.0.0.1:8000/docs`

### 3. Run the Next.js Frontend
Start the Next.js development server:
```bash
cd ../productos-web
npm run dev
```
- Access the workspace UI at `http://127.0.0.1:3000`

### 4. Run End-to-End Integration Tests
Verify database schema validation, endpoints, and confidence scoring deductions by running the integration test script:
```bash
cd ../productos-api
python tests/test_endpoints.py
```

---

## 📂 Repository Structure

```
├── productos-api/        # FastAPI Python Backend
│   ├── app/              # FastAPI application core
│   │   ├── api/          # Route controllers (v1)
│   │   ├── db/           # Session management
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic validation schemas
│   ├── tests/            # Integration test cases
│   ├── seed.py           # Database seeder
│   └── requirements.txt  # Python requirements
│
└── productos-web/        # Next.js Frontend
    ├── public/           # Static asset assets
    ├── src/
    │   ├── app/          # App Router components & dashboard views
    │   ├── components/   # UI elements
    │   └── store/        # Zustand global client store
    └── package.json      # Node.js configurations
```

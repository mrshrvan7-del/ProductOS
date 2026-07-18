# 🧠 ProductOS
### *The AI-Powered Organizational Intelligence & SOP Operating System*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## ⚡ The Hook & Vision
> **Capture Every Conversation. Understand Every Decision. Build Every Process. Preserve Organizational Knowledge.**

ProductOS is an enterprise AI platform that captures, understands, and preserves an organization's collective knowledge. Rather than relying on employees to manually create and maintain documentation, ProductOS continuously analyzes meetings, emails, chats, product discussions, decisions, documents, and operational workflows to automatically generate **living Standard Operating Procedures (SOPs)**, product guides, knowledge bases, training materials, and process documentation.

Serving as the organization's central intelligence layer, ProductOS connects people, products, processes, and decisions into a unified knowledge graph. Every conversation, approval, and workflow becomes searchable, traceable, and reusable, ensuring that critical organizational knowledge is never lost and is always accessible when needed.

---

## 🎯 The Core Problem & Our Solution

```mermaid
graph TD
    subgraph Fragmented Reality ["Fragmented Context silos"]
        A["Slack Threads"] --- B["Spreadsheets"]
        B --- C["Static PDFs"]
        C --- D["Unstructured Emails"]
    end

    subgraph ProductOS ["ProductOS Intelligence Layer"]
        PO["🧠 ProductOS Core Engine"]
        SOP["Living SOPs & Knowledge Graph"]
        PO --> SOP
    end

    Fragmented Reality -->|Continuous AI Parsing| PO
    SOP -->|Real-Time Process Intelligence| E["Product, Engineering, Operations & HR Teams"]
```

### ❌ The Old Way
- **Silos & Friction**: Critical process knowledge and decision rationale are scattered across disconnected chats, logs, and docs.
- **Knowledge Decay**: When key team members depart, historical decisions and operational context leave with them.
- **Outdated SOPs**: Documentation is created manually and quickly becomes obsolete as workflows adapt.

###   The ProductOS Way
- **Living Process Memory**: Automatically extracts, updates, and versions SOPs and knowledge bases from daily meetings and product discussions.
- **Structured Knowledge Graph**: Links decisions to objectives, owners, and risks for 100% trace-integrity.
- **Human-in-the-loop Governance**: AI proposes process optimizations and documentation updates, while managers review and sign off before publication.

---

## 🔥 Product Features (Phase 1, 2 & 3 Completed)

### 1. 📓 The Decision Journal & SOP Hub
A chronological, audit-ready index of structural choices. Connect decisions to strategic goals, assign responsibility, and initiate approval sign-off workflows.

### 2. 🕸️ Interactive SVG Dependency Flow
A dynamic, zero-dependency visual graph tracking cross-team handoffs (Legal, Security, Engineering, Compliance). Features animated paths color-coded by blocker status (Green = Clear, Yellow = Active, Red = Blocked).

### 3. 📈 Delivery Confidence Engine
Calculates process stability and delivery confidence automatically using live risk weighting deductions:
$$\text{Confidence} = \max\left(0,\, 100 - (5D + 5M + 10H + 20C + 15B)\right)$$
- *D = Pending Decisions, M = Medium Risks, H = High Risks, C = Critical Risks, B = Blocked Dependencies.*

### 4. 🎙️ AI Meeting Intelligence (Phase 3)
Paste meeting transcripts to automatically extract candidate Decisions, Action Items, and Risks. PMs can edit, assign, select approvers, and persist outcomes directly into the organization's knowledge graph.

### 5. 🎭 Persona Demo Switcher
Toggle roles instantly (Sarah PM, Elena Legal, Dave Eng, Marcus Security) to simulate and present cross-team approval workflows in real time.

---

## 🚀 Interactive Quick Start

<details>
<summary><b>1. Run the Backend API</b></summary>

```bash
cd productos-api
# Activate venv
.\.venv\Scripts\activate
# Seed mock database
python seed.py
# Boot FastAPI development server
uvicorn app.main:app --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Swagger documentation: `http://127.0.0.1:8000/docs`
- Local Data: stored in [local_database.db](productos-api/local_database.db).
</details>

<details>
<summary><b>2. Run the Next.js Web App</b></summary>

```bash
cd productos-web
# Run development server
npm run dev
```
- Frontend Access: `http://127.0.0.1:3000`
</details>

<details>
<summary><b>3. Verify with End-to-End Tests</b></summary>

Verify the API endpoints and database integrity:
```bash
cd productos-api
$env:PYTHONPATH="."; .\.venv\Scripts\python tests/test_client.py
```
</details>

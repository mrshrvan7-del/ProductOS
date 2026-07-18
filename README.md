# 🧠 ProductOS
### *The Decision Intelligence Layer for Product Teams*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## ⚡ The Hook
> **Product work is not failing because teams lack task management software. It is failing because critical product decisions, risk context, and stakeholder alignments are buried across Slack channels, emails, and spreadsheet tabs.**

When a key feature is removed or a milestone slips, six months later nobody remembers *why*, *who approved it*, or *what dependency caused it*. 

**ProductOS** solves this. It sits *above* task execution tools (like Jira or GitHub Issues) and acts as the **central operational memory layer** for product operations.

---

## 🎯 The Core Problem & Our Solution

```mermaid
graph TD
    subgraph Fragmented Reality [The Scattered Stack]
        A[Slack Chat] --- B[Excel Risks]
        B --- C[Confluence Docs]
        C --- D[Jira Tasks]
    end

    subgraph ProductOS Layer [ProductOS: The Intelligence Layer]
        PO[🧠 ProductOS]
    end

    Fragmented Reality -->|Unified Context| PO
    PO -->|Actionable Overview| E[Leadership & Stakeholders]
```

### ❌ The Old Way
- **Scattered Context**: Decisions are made in Slack, risks are tracked in Excel, requirements live in Confluence, and tasks live in Jira.
- **Information Decay**: When a Product Manager leaves, organizational context and decision history leave with them.
- **Reporting Overhead**: PMs waste up to 8 hours a week manually copy-pasting status updates for stakeholders.

###   The ProductOS Way
- **Decision Traceability**: Every critical pivot is a structured, searchable record linked to approvals, goals, and risks.
- **Real-Time Cross-Team Flow**: Cross-team blockers are instantly mapped in a high-fidelity interactive dependency chart.
- **Automated Health Engine**: Release confidence is computed mathematically using live data, eliminating subjective "green/yellow/red" status reports.

---

## 🔥 Product Features (Phase 1 & 2 Demo)

### 1. 📓 The Decision Journal
A chronological feed of structural product decisions. Document *why* things were prioritized, link them to business objectives, and request approvals with built-in audit trails.

### 2. 🕸️ Interactive SVG Dependency Flow
A visual dependency map of cross-team workflows (Legal, Security, Engineering, Compliance). Path lines animate and glow based on connection health:
- **Green**: Resolved dependency path.
- **Yellow/Blue**: Active data flow.
- **Red (Blinking)**: Blocked delivery path.

### 3. 📈 Delivery Confidence Engine
Calculates the statistical likelihood of release success by applying logical weight-based deductions to active blockers:
$$\text{Confidence} = \max\left(0,\, 100 - (5D + 5M + 10H + 20C + 15B)\right)$$
*Where: D = Pending Decisions, M = Medium Risks, H = High Risks, C = Critical Risks, B = Blocked Dependencies.*

### 4. 🎭 Persona Demo Switcher
Switch roles instantly in the UI between **Sarah (PM)**, **Elena (Legal)**, **Marcus (Security)**, and **Dave (Eng)**. Reviewers can log decisions as a PM, switch to Legal, and approve the clearance item on the fly!

---

## 📈 Startup Value Metrics

| Metric | Target Impact |
|---|---|
| ⏱️ **Weekly Status Prep** | **-80%** time spent preparing reports |
| 🔍 **Information Retrieval** | **-60%** time spent searching for context |
| 🔎 **Decision Traceability** | **100%** searchable system of record |
| 🛡️ **Risk Prevention** | **Proactive flagging** of cross-team blockers |

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
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`
- Local Data Inspection: stored in [local_database.db](productos-api/local_database.db) (SQLite).
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

With the API running, trigger our integration suite to test the routing flow automatically:
```bash
cd productos-api
python tests/test_endpoints.py
```
</details>

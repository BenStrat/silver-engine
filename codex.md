## 🧠 Purpose

This document defines how AI coding agents should understand, generate, and evolve the **Web QA Triage MVP**.

It consolidates:

* Product intent (PRD)
* Technical architecture (monorepo spec)
* Implementation constraints

Agents must follow this file as the **source of truth for structure, behavior, and priorities**.

---

## 🎯 Product Summary

Build a **web-based QA triage system** that allows teams to:

1. Capture bugs directly from a web app
2. Automatically record context (journey, metadata, errors)
3. Collaborate on triage
4. Generate high-quality Linear tickets using AI
5. Send structured issues to Linear

Core loop:

```
Capture → Triage → Collaborate → Generate → Send to Linear
```



---

## ⚙️ System Architecture

### Monorepo Structure (REQUIRED)

```
/apps
  /web        -> triage dashboard (Next.js)
  /widget     -> in-page reporting tool
  /api        -> backend API
  /worker     -> async jobs

/packages
  /ui
  /types
  /db
  /auth
  /capture
  /linear
  /ai
  /config
```

Agents MUST:

* Use shared packages
* Avoid duplicating logic across apps
* Keep strict separation of responsibilities



---

## 🧩 Core Domain Model

### Entities

* **Report** → raw bug capture
* **Case** → triage container (many reports)
* **Linear Issue** → final output

Key rule:

> Reports are input. Cases are collaboration. Linear is output.



---

## 🔁 Core Flows

### 1. Capture Flow (Widget)

* Enter report mode
* Click element
* Add comment
* Submit

System automatically captures:

* Screenshot
* Selected DOM element
* URL + route
* Device + browser
* Console + network errors
* Journey (~3 min buffer)

---

### 2. Triage Flow (Web App)

* View report
* Review context
* Attempt reproduction
* Add comments
* Update status
* Generate AI ticket

---

### 3. Linear Flow

* Generate AI draft
* User edits
* Send to Linear
* Store issue link

---

## 🧱 Engineering Principles

### 1. Separation of Concerns

* Widget = capture only
* Web app = triage UI
* API = business logic
* Worker = async processing

---

### 2. Shared Contracts (CRITICAL)

All agents MUST:

* Use `packages/types` for schemas
* Validate with Zod
* Avoid redefining types

---

### 3. Data Integrity

* All entities scoped by `organization_id`
* Use relational consistency (Report → Case)
* Store flexible fields in JSON (metadata, journey)

---

### 4. AI is Assistive

* AI generates drafts only
* Humans approve before sending
* AI outputs must be structured

---

### 5. Linear is Downstream

* Do NOT treat Linear as source of truth
* Always persist data internally first

---

## 🗄️ Data Design Rules

* Use Prisma ORM

* Postgres as primary DB

* JSON columns for:

  * metadata
  * selected element
  * journey payloads

* Journey events stored as ordered records (NOT blobs)



---

## 🔌 API Design Rules

* REST over GraphQL (MVP)
* Organization-scoped access only
* Validate all inputs with shared schemas

### Critical Endpoints

* `POST /api/reports`
* `GET /api/cases`
* `POST /api/cases/:id/ai-drafts`
* `POST /api/cases/:id/send-to-linear`

---

## 🤖 AI Responsibilities

Located in `packages/ai`.

Agents must:

### Input

* Reports
* Comments
* Journey
* Metadata
* Reproduction data

### Output (STRICT SHAPE)

```json
{
  "title": "",
  "summary": "",
  "stepsToReproduce": [],
  "expected": "",
  "actual": "",
  "impact": "",
  "environment": ""
}
```

* Must be parseable
* Must be validated before persistence

---

## ⚡ Worker Responsibilities

Located in `/apps/worker`.

### Jobs

#### `generate_ai_draft`

* Build prompt
* Call AI
* Validate response
* Save draft

#### `send_case_to_linear`

* Map project → team
* Create issue
* Persist link
* Update case status

---

## 🧪 Capture System Rules

From `packages/capture`:

Agents must implement:

* DOM element extraction

* Normalized coordinates

* Event tracking:

  * clicks
  * navigation
  * inputs
  * errors

* Rolling buffer (~3 minutes)

---

## 🖥️ Frontend Guidelines

### Web App (`apps/web`)

* Next.js + React
* Use TanStack Query
* Zustand for local UI state
* Focus on:

  * triage queue
  * report detail
  * AI draft review

---

### Widget (`apps/widget`)

* Lightweight
* Runs in browser context
* Handles:

  * report mode toggle
  * screenshot trigger
  * element selection
  * metadata capture

---

## 🔐 Security & Privacy

* Mask sensitive inputs
* Allow configurable redaction
* Use signed URLs for uploads
* Enforce tenant isolation



---

## 🚫 Explicit Non-Goals (MVP)

Agents MUST NOT implement:

* Session replay
* Video recording
* Multiplayer editing
* Advanced analytics

---

## 🧭 Implementation Order (STRICT)

1. Monorepo setup
2. Shared packages (`types`, `db`)
3. Core entities (Report, Case, Comment)
4. API routes
5. Web triage UI
6. Widget capture flow
7. Upload + screenshot handling
8. Journey persistence
9. AI draft generation
10. Linear integration

---

## 🧠 Agent Behavior Rules

Agents should:

* Prefer **simple, composable implementations**
* Avoid over-engineering
* Reuse shared modules aggressively
* Keep UI minimal but functional
* Ensure all flows are end-to-end functional

Agents should NOT:

* Introduce new architecture patterns
* Split repos
* Replace stack choices
* Skip validation layers

---

## ✅ Definition of Done

A feature is complete when:

* It works end-to-end through the product loop
* Data is persisted correctly
* Types are shared and validated
* UI reflects real backend state
* It integrates with existing flows

---

## 📌 Final Note

This system is **context-first QA**, not just bug reporting.

Priority order:

```
Context > Reproducibility > Collaboration > Automation
```

# 🧩 MVP PRD — Web QA Triage + Linear Ticket Generator

## 1. Objective

Build a **web-only QA tool** that enables teams to:

- Capture bugs directly from a web app
- Automatically record **user journey + technical metadata**
- Collaborate internally to **triage issues**
- Generate **high-quality Linear tickets using AI**
- Send clean, structured issues to Linear

---

## 2. Core Product Loop

Capture → Triage → Collaborate → Generate → Send to Linear

---

## 3. MVP Scope

### Included
- Report mode (in-page bug capture)
- Screenshot + annotation (pin only)
- Metadata + journey capture
- Triage dashboard
- Comments + status workflow
- AI-generated Linear ticket
- Linear integration (create issue)

### Excluded (v1)
- Video recording
- Full session replay
- Multi-file annotation (PDFs, etc.)
- Real-time multiplayer editing
- Advanced analytics

---

## 4. Key Concepts

### Report
Raw bug submission

### Case
Triage object (may contain multiple reports)

### Linear Issue
Final output sent to engineering

---

## 5. User Flows

### 5.1 Capture Flow
1. User clicks "Report"
2. Enters report mode
3. Clicks element
4. Adds comment
5. Submits report

System captures automatically:
- Screenshot
- Selected element
- URL
- Viewport
- Browser/device
- Console errors
- Network failures
- Journey (last ~3 mins)

### 5.2 Triage Flow
1. Open report
2. Review screenshot + context
3. Attempt reproduction
4. Add comments / evidence
5. Update status
6. Generate Linear ticket

### 5.3 Linear Flow
1. Click "Generate Linear Draft"
2. AI generates structured ticket
3. User edits (optional)
4. Click "Send to Linear"
5. Issue created

---

## 6. Features

### 6.1 Report Mode

Modes:
- navigation
- report

Behavior:
- Navigation: normal interaction
- Report: crosshair cursor, click creates pin, ESC exits

---

### 6.2 Screenshot Capture
- Capture visible viewport
- Store image
- Save width, height, DPR

---

### 6.3 Element Capture
Store:
- selector / xpath
- text / aria label
- bounding box
- normalized coordinates

---

### 6.4 Journey Capture

- Rolling buffer (~3 mins)
- Capture:
  - navigation
  - clicks
  - inputs
  - submits
  - console errors
  - network errors

---

### 6.5 Metadata Capture

Environment:
- URL, route
- browser + version
- OS
- device type
- viewport + screen
- DPR
- locale + timezone

App context (optional):
- build SHA
- environment
- feature flags
- user ID

Technical:
- console errors
- failed requests

---

### 6.6 Triage Dashboard

Report list:
- filter by status, assignee, environment, date

Report detail:
- screenshot + pin
- comments
- journey timeline
- metadata
- errors

---

### 6.7 Status Workflow

- new
- investigating
- needs_info
- confirmed
- duplicate
- won't_fix
- sent_to_linear

---

### 6.8 Collaboration

- comments
- assign owner
- add evidence

---

### 6.9 Reproduction Tools

- Open URL
- Viewport presets:
  - desktop
  - tablet
  - mobile

Track:
- reproduced (yes/no)
- environments
- notes

---

### 6.10 AI Ticket Generation

Input:
- comment
- journey
- metadata
- discussion

Output:
- title
- summary
- steps
- expected vs actual
- impact
- environment

---

### 6.11 Linear Integration

- Connect via API key or OAuth
- Map project → team

Create issue with:
- title
- description
- attachments

Store:
- issue ID
- URL

---

## 7. Architecture

Frontend:
- React / Next.js
- in-page widget

Backend:
- Node.js
- Postgres
- object storage

---

## 8. Security & Privacy

- Mask sensitive inputs
- Redact configurable fields
- Signed URLs
- Tenant isolation

---

## 9. Milestones

### V1
- report mode
- screenshot + pin
- metadata + journey
- dashboard
- comments + status
- AI draft
- Linear integration

### V1.1
- viewport presets
- reproduction tracking
- improved AI

---

## 10. Product Principles

- Fast capture > perfect capture
- Collaboration before automation
- AI assists, human approves
- Linear is source of truth
- Context > annotation tools


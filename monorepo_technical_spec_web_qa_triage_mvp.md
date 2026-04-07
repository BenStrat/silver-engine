# Monorepo Technical Spec — Web QA Triage MVP

## 1. Purpose

This document defines the recommended monorepo structure, core services, shared packages, database schema, API surface area, and background jobs for the Web QA Triage MVP.

It is intended to give engineering agents a concrete implementation shape so they can generate code with fewer assumptions and less structural drift.

---

## 2. Recommended Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand for local interaction state

### Backend
- Node.js
- Next.js route handlers or separate API app
- TypeScript
- Prisma ORM
- PostgreSQL
- S3-compatible object storage

### Async / Integrations
- Worker process for background jobs
- Redis for queues and job coordination
- Linear API client
- AI provider wrapper

### Validation / Shared Contracts
- Zod
- Shared TypeScript types in a common package

---

## 3. Monorepo Layout

```text
/apps
  /web        -> internal triage dashboard
  /widget     -> embeddable / injected report UI
  /api        -> backend API service
  /worker     -> background jobs

/packages
  /ui         -> shared React UI components
  /types      -> shared domain types and zod schemas
  /db         -> Prisma schema, migrations, db client
  /auth       -> auth helpers and session utilities
  /capture    -> session capture logic and event normalization
  /linear     -> Linear client wrapper and mappers
  /ai         -> prompt builders and AI orchestration
  /config     -> shared config, env parsing, constants
```

---

## 4. App Responsibilities

### `apps/web`
Internal product UI for:
- triage queue
- report detail view
- case management
- comments
- reproduction tracking
- AI draft review
- Linear send flow

### `apps/widget`
Client-side report experience for:
- mode switching
- screenshot initiation
- pin placement
- comment input
- session metadata capture
- journey buffer capture

This can later power both an embeddable script and extension UI.

### `apps/api`
Owns:
- authentication
- REST endpoints
- file upload signing
- report/case CRUD
- AI draft request orchestration
- Linear issue creation
- comment/status updates

### `apps/worker`
Owns:
- AI generation jobs
- duplicate detection jobs
- Linear sync jobs
- image processing if needed
- notification fanout later

---

## 5. Shared Package Responsibilities

### `packages/types`
Contains:
- domain types
- zod schemas
- API request/response schemas
- enums

### `packages/db`
Contains:
- Prisma schema
- Prisma client
- migrations
- seed helpers

### `packages/capture`
Contains:
- journey event definitions
- capture helpers
- DOM element extraction helpers
- event normalization logic

### `packages/linear`
Contains:
- Linear API wrapper
- create issue mapper
- team/project mapping helpers

### `packages/ai`
Contains:
- ticket draft prompt templates
- summarization functions
- input shaping for AI calls
- validation/parsing of AI output

### `packages/auth`
Contains:
- user session helpers
- middleware helpers
- permission utilities

### `packages/ui`
Contains:
- shared buttons, badges, panels, metadata cards
- report screenshot/pin rendering primitives
- status components

---

## 6. Core Domain Model

### Core entities
- Organization
- User
- Project
- Report
- Case
- CaseComment
- ReproductionRecord
- LinearWorkspace
- LinearProjectMapping
- LinearIssueLink
- Attachment
- JourneyEvent
- AIDraft

### Conceptual model
- A `Report` is a raw bug capture.
- A `Case` is the collaborative triage object.
- Many reports can belong to one case.
- A case may eventually create one Linear issue.

---

## 7. Database Schema (Product-Level)

Below is the recommended relational structure. Types are described conceptually; the generated implementation can use Prisma.

### organizations
- id
- name
- created_at
- updated_at

### users
- id
- organization_id
- email
- name
- role (`admin` | `member`)
- created_at
- updated_at

### projects
- id
- organization_id
- name
- slug
- default_environment
- linear_team_id (nullable)
- created_at
- updated_at

### reports
- id
- organization_id
- project_id
- case_id (nullable)
- created_by_user_id
- comment_text
- status (`new` | `triaged` | `attached`)
- source (`widget` | `extension` | `manual`)
- page_url
- page_route
- page_title
- screenshot_url
- screenshot_width
- screenshot_height
- device_pixel_ratio
- browser_name
- browser_version
- os_name
- device_type (`desktop` | `tablet` | `mobile`)
- viewport_width
- viewport_height
- screen_width
- screen_height
- locale (nullable)
- timezone (nullable)
- app_environment (nullable)
- build_sha (nullable)
- feature_flags_json (json, nullable)
- selected_element_json (json, nullable)
- metadata_json (json, nullable)
- created_at
- updated_at

### cases
- id
- organization_id
- project_id
- title (nullable)
- status (`new` | `investigating` | `needs_info` | `confirmed` | `duplicate` | `wont_fix` | `sent_to_linear`)
- severity (`low` | `medium` | `high` | `critical`, nullable)
- assignee_user_id (nullable)
- source_report_id (nullable)
- duplicate_of_case_id (nullable)
- ai_summary (nullable)
- created_at
- updated_at

### case_reports
- id
- case_id
- report_id
- created_at

### case_comments
- id
- case_id
- author_user_id
- body
- created_at
- updated_at

### reproduction_records
- id
- case_id
- created_by_user_id
- reproduced (boolean)
- environments_json
- browser_name (nullable)
- os_name (nullable)
- viewport_width (nullable)
- viewport_height (nullable)
- notes (nullable)
- created_at

### attachments
- id
- case_id (nullable)
- report_id (nullable)
- uploaded_by_user_id
- kind (`screenshot` | `image` | `log`)
- file_url
- mime_type
- created_at

### journey_events
- id
- report_id
- event_type
- event_at
- sequence_number
- payload_json
- created_at

### ai_drafts
- id
- case_id
- created_by_user_id
- status (`pending` | `completed` | `failed`)
- title
- summary
- steps_to_reproduce_json
- expected_text
- actual_text
- impact_text
- environment_text
- raw_response_json (nullable)
- error_text (nullable)
- created_at
- updated_at

### linear_workspaces
- id
- organization_id
- provider_type (`oauth` | `api_key`)
- workspace_name
- access_token_encrypted
- created_at
- updated_at

### linear_project_mappings
- id
- project_id
- linear_workspace_id
- linear_team_id
- default_label_ids_json (nullable)
- default_priority (nullable)
- created_at
- updated_at

### linear_issue_links
- id
- case_id
- linear_workspace_id
- linear_issue_id
- linear_issue_identifier
- linear_issue_url
- created_at

---

## 8. Recommended Indexes

### reports
- index on `project_id, created_at desc`
- index on `case_id`
- index on `organization_id, created_at desc`

### cases
- index on `project_id, status`
- index on `organization_id, updated_at desc`
- index on `assignee_user_id`

### case_comments
- index on `case_id, created_at`

### journey_events
- index on `report_id, sequence_number`

### linear_issue_links
- unique index on `case_id`

---

## 9. Suggested JSON Shapes

### `selected_element_json`
```json
{
  "selector": "[data-testid='refund-total']",
  "xpath": "//*[@data-testid='refund-total']",
  "text": "Total",
  "ariaLabel": null,
  "boundingBox": { "x": 420, "y": 318, "width": 120, "height": 32 },
  "normalized": { "x": 0.41, "y": 0.38, "width": 0.12, "height": 0.04 }
}
```

### `journey_events.payload_json`
```json
{
  "url": "/orders/1042",
  "selector": "button[data-testid='refund']",
  "label": "Refund",
  "status": 500,
  "method": "POST"
}
```

### `feature_flags_json`
```json
{
  "new_checkout": true,
  "refund_flow_v2": false
}
```

---

## 10. API Design Principles

- Prefer REST for MVP simplicity.
- Keep route names aligned to product concepts.
- Validate all input with shared zod schemas.
- Return stable DTOs from `packages/types`.
- Use authenticated organization-scoped access.

---

## 11. REST API Routes

## Auth / Session

### `GET /api/me`
Returns current authenticated user and organization context.

Response:
```json
{
  "user": {
    "id": "usr_123",
    "name": "Benji",
    "email": "benji@example.com",
    "role": "admin"
  },
  "organization": {
    "id": "org_123",
    "name": "Acme"
  }
}
```

---

## Projects

### `GET /api/projects`
List visible projects.

### `POST /api/projects`
Create project.

Request:
```json
{
  "name": "Web App - Staging",
  "slug": "web-app-staging"
}
```

---

## Reports

### `POST /api/reports`
Create a raw report.

Request:
```json
{
  "projectId": "proj_123",
  "commentText": "Total disappears after clicking refund",
  "pageUrl": "https://app.example.com/orders/1042",
  "pageRoute": "/orders/1042",
  "pageTitle": "Order Details",
  "screenshotUrl": "https://cdn.example.com/rpt_123.png",
  "screenshotWidth": 1440,
  "screenshotHeight": 900,
  "devicePixelRatio": 2,
  "browserName": "Chrome",
  "browserVersion": "123",
  "osName": "macOS",
  "deviceType": "desktop",
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "screenWidth": 1728,
  "screenHeight": 1117,
  "selectedElement": {
    "selector": "[data-testid='refund-total']",
    "text": "Total"
  },
  "featureFlags": {
    "refund_flow_v2": true
  },
  "journeyEvents": [
    { "type": "navigation", "at": "2026-04-07T10:01:00Z", "url": "/orders" },
    { "type": "click", "at": "2026-04-07T10:01:06Z", "label": "Order #1042" }
  ]
}
```

Response:
```json
{
  "report": {
    "id": "rpt_123",
    "caseId": "case_123"
  }
}
```

### `GET /api/reports/:reportId`
Fetch report detail.

### `GET /api/reports`
List reports with filters:
- `projectId`
- `status`
- `from`
- `to`

---

## Cases

### `GET /api/cases`
List cases.

Supported query params:
- `projectId`
- `status`
- `assigneeUserId`
- `search`

### `GET /api/cases/:caseId`
Fetch case detail including:
- linked reports
- comments
- reproduction records
- linear issue link
- latest AI draft

### `POST /api/cases`
Create a case manually.

### `PATCH /api/cases/:caseId`
Update case fields.

Request:
```json
{
  "status": "confirmed",
  "severity": "high",
  "assigneeUserId": "usr_456"
}
```

### `POST /api/cases/:caseId/reports`
Attach an existing report to a case.

Request:
```json
{
  "reportId": "rpt_789"
}
```

### `POST /api/cases/:caseId/merge`
Mark another case as duplicate and merge reports.

Request:
```json
{
  "duplicateCaseId": "case_456"
}
```

---

## Case Comments

### `GET /api/cases/:caseId/comments`
List comments.

### `POST /api/cases/:caseId/comments`
Create comment.

Request:
```json
{
  "body": "Reproduced on mobile only."
}
```

---

## Reproduction Records

### `POST /api/cases/:caseId/reproduction-records`
Add reproduction result.

Request:
```json
{
  "reproduced": true,
  "environments": ["mobile"],
  "browserName": "Safari",
  "osName": "iOS",
  "viewportWidth": 390,
  "viewportHeight": 844,
  "notes": "Only reproducible on narrow mobile viewport"
}
```

---

## Uploads

### `POST /api/uploads/sign`
Return signed upload URL for screenshots and attachments.

Request:
```json
{
  "filename": "report.png",
  "contentType": "image/png"
}
```

Response:
```json
{
  "uploadUrl": "https://...",
  "fileUrl": "https://cdn.example.com/..."
}
```

---

## AI Drafts

### `POST /api/cases/:caseId/ai-drafts`
Create an AI draft generation job.

Response:
```json
{
  "draft": {
    "id": "aid_123",
    "status": "pending"
  }
}
```

### `GET /api/cases/:caseId/ai-drafts/latest`
Fetch latest AI draft.

Response:
```json
{
  "draft": {
    "id": "aid_123",
    "status": "completed",
    "title": "[QA] Refund total disappears after clicking Refund",
    "summary": "The refund modal loses the total field after clicking Refund.",
    "stepsToReproduce": [
      "Open Orders",
      "Open Order #1042",
      "Click Refund"
    ],
    "expected": "The total should remain visible.",
    "actual": "The total disappears.",
    "impact": "Users may not trust the refund confirmation flow.",
    "environment": "Chrome on macOS, desktop viewport"
  }
}
```

---

## Linear Integration

### `POST /api/integrations/linear/connect`
Store Linear workspace auth credentials.

### `GET /api/integrations/linear/teams`
Return visible Linear teams.

### `POST /api/projects/:projectId/linear-mapping`
Set team mapping for a project.

Request:
```json
{
  "linearWorkspaceId": "linws_123",
  "linearTeamId": "team_123",
  "defaultLabelIds": ["label_bug"],
  "defaultPriority": 2
}
```

### `POST /api/cases/:caseId/send-to-linear`
Create Linear issue from approved AI draft or provided overrides.

Request:
```json
{
  "title": "[QA] Refund total disappears after clicking Refund",
  "description": "...markdown body..."
}
```

Response:
```json
{
  "issue": {
    "id": "lin_123",
    "identifier": "ENG-123",
    "url": "https://linear.app/..."
  }
}
```

---

## 12. Internal Service Boundaries

### Report service
Owns:
- report creation
- screenshot metadata
- journey event persistence

### Case service
Owns:
- triage object lifecycle
- status changes
- report linking
- duplication workflows

### AI draft service
Owns:
- build AI input payload
- call AI provider
- validate AI output
- persist structured draft

### Linear service
Owns:
- auth token usage
- project/team mapping
- issue creation
- issue link persistence

---

## 13. Worker Jobs

### `generate_ai_draft`
Input:
- caseId

Steps:
1. load case
2. load linked reports
3. load comments
4. load reproduction records
5. build prompt payload
6. call AI provider
7. parse and validate response
8. persist `ai_drafts`

### `send_case_to_linear`
Input:
- caseId
- optional title/description overrides

Steps:
1. load case and mapping
2. build final Linear payload
3. call Linear API
4. persist `linear_issue_links`
5. update case status

### `detect_duplicates` (optional v1.1)
Input:
- reportId or caseId

Steps:
1. compare recent reports in project
2. score based on route, text similarity, selected element, environment
3. store suggestions

---

## 14. AI Draft Input Shape

Recommended AI input payload:

```json
{
  "case": {
    "status": "confirmed",
    "severity": "high"
  },
  "reports": [
    {
      "commentText": "Total disappears after clicking refund",
      "pageRoute": "/orders/1042",
      "browserName": "Chrome",
      "osName": "macOS",
      "deviceType": "desktop",
      "viewport": "1440x900",
      "selectedElement": {
        "text": "Total",
        "selector": "[data-testid='refund-total']"
      },
      "journey": [
        "Opened Orders",
        "Opened Order #1042",
        "Clicked Refund",
        "Network error POST /refunds 500"
      ]
    }
  ],
  "comments": [
    "Reproduced on mobile only.",
    "Cannot reproduce on Safari desktop."
  ],
  "reproduction": [
    {
      "reproduced": true,
      "environments": ["mobile"]
    }
  ]
}
```

Expected AI output shape:
- title
- summary
- stepsToReproduce[]
- expected
- actual
- impact
- environment

---

## 15. Suggested Prisma Direction

Recommended modeling choices:
- Use Prisma enums for core statuses and roles.
- Store flexible capture metadata in JSON columns.
- Keep journey events as a separate table for ordering and future replay potential.
- Keep AI drafts versioned instead of overwriting.

---

## 16. Auth Assumptions

For MVP:
- authenticated internal team users only
- all access scoped by organization
- users can only access projects in their organization

Optional implementation:
- NextAuth or custom session auth
- middleware checks organization membership on all protected routes

---

## 17. Implementation Sequence

### Phase 1
- set up monorepo
- implement `packages/types`
- implement `packages/db`
- create projects, reports, cases, comments schema
- create `/api/reports` and `/api/cases`
- build `apps/web` triage list/detail UI
- build `apps/widget` report mode UI

### Phase 2
- add uploads/sign flow
- attach screenshot upload flow
- persist journey events
- add reproduction records

### Phase 3
- add AI draft worker
- add draft review UI
- add Linear mapping and send flow

---

## 18. Product Constraints for Agents

Agents should preserve these decisions:
- monorepo, not separate repos
- `Report` and `Case` are distinct concepts
- Linear is downstream, not primary storage
- screenshot + metadata + journey are required for report creation
- AI output should be structured, editable, and versioned
- organization scoping is required on all core entities

---

## 19. Nice-to-Have Extensions (Not Required for MVP)

- duplicate suggestion table
- case activity feed
- webhook-based Linear status sync
- browser extension side panel
- richer replay UI

---

## 20. Final Recommendation

If generating code with agents, provide this document together with:
1. the MVP PRD
2. a preferred stack instruction
3. a requirement to use shared schemas/types from the monorepo

This will materially improve implementation consistency across frontend, backend, workers, and integrations.


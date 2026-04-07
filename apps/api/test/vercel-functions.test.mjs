import assert from "node:assert/strict";
import test from "node:test";

import { createApiApp } from "../src/app.ts";

class FakeTriageRepository {
  constructor() {
    this.calls = [];
    this.report = {
      id: "rpt_123",
      caseId: "case_123",
    };
    this.cases = [
      {
        id: "case_123",
        organizationId: "org_123",
        projectId: "proj_123",
        title: "Refund total disappears after clicking Refund",
        status: "confirmed",
        severity: "high",
        assigneeUserId: "usr_123",
        sourceReportId: "rpt_123",
        duplicateOfCaseId: null,
        aiSummary: "Refund modal loses the total field after clicking Refund.",
        createdAt: "2026-04-07T10:01:00Z",
        updatedAt: "2026-04-07T10:02:00Z",
      },
    ];
    this.caseDetail = {
      ...this.cases[0],
      reports: [
        {
          id: "rpt_123",
          caseId: "case_123",
          projectId: "proj_123",
          commentText: "Total disappears after clicking refund",
          status: "triaged",
          pageRoute: "/orders/1042",
          screenshotUrl: "https://cdn.example.com/rpt_123.png",
          browserName: "Chrome",
          osName: "macOS",
          deviceType: "desktop",
          createdAt: "2026-04-07T10:01:00Z",
          updatedAt: "2026-04-07T10:01:05Z",
        },
      ],
      comments: [],
      reproductionRecords: [],
      linearIssueLink: null,
      latestAiDraft: null,
    };
  }

  async createReport(payload, context) {
    this.calls.push(["createReport", payload, context]);
    return this.report;
  }

  async listCases(query, context) {
    this.calls.push(["listCases", query, context]);
    return this.cases;
  }

  async getCaseDetail(caseId, context) {
    this.calls.push(["getCaseDetail", caseId, context]);
    return caseId === "case_123" ? this.caseDetail : null;
  }
}

const readJson = async (response) => JSON.parse(await response.text());

test("GET /health returns the service health payload", async () => {
  const app = createApiApp(new FakeTriageRepository());
  const response = await app(new Request("https://api.example.com/health"));

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    ok: true,
    service: "@silver/api",
  });
});

test("POST /api/reports reads the request body and forwards auth context", async () => {
  const repo = new FakeTriageRepository();
  const app = createApiApp(repo);
  const response = await app(
    new Request("https://api.example.com/api/reports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-organization-id": "org_123",
        "x-user-id": "usr_123",
      },
      body: JSON.stringify({
        projectId: "proj_123",
        commentText: "Total disappears after clicking refund",
        pageUrl: "https://app.example.com/orders/1042",
        pageRoute: "/orders/1042",
        pageTitle: "Order Details",
        screenshotUrl: "https://cdn.example.com/rpt_123.png",
        screenshotWidth: 1440,
        screenshotHeight: 900,
        devicePixelRatio: 2,
        browserName: "Chrome",
        browserVersion: "123",
        osName: "macOS",
        deviceType: "desktop",
        viewportWidth: 1440,
        viewportHeight: 900,
        screenWidth: 1728,
        screenHeight: 1117,
        featureFlags: {
          refund_flow_v2: true,
        },
        journeyEvents: [],
      }),
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await readJson(response), {
    report: {
      id: "rpt_123",
      caseId: "case_123",
    },
  });
  assert.deepEqual(repo.calls[0][2], {
    organizationId: "org_123",
    userId: "usr_123",
  });
});

test("GET /api/cases requires the organization header", async () => {
  const app = createApiApp(new FakeTriageRepository());
  const response = await app(new Request("https://api.example.com/api/cases"));

  assert.equal(response.status, 401);
  assert.equal((await readJson(response)).error.code, "missing_organization");
});

test("GET /api/cases/:caseId returns case detail for the requested case", async () => {
  const repo = new FakeTriageRepository();
  const app = createApiApp(repo);
  const response = await app(
    new Request("https://api.example.com/api/cases/case_123", {
      headers: {
        "x-organization-id": "org_123",
      },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal((await readJson(response)).case.id, "case_123");
  assert.deepEqual(repo.calls[0], [
    "getCaseDetail",
    "case_123",
    {
      organizationId: "org_123",
    },
  ]);
});

test("POST /api/reports returns invalid_json when the request body is malformed", async () => {
  const app = createApiApp(new FakeTriageRepository());
  const response = await app(
    new Request("https://api.example.com/api/reports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-organization-id": "org_123",
        "x-user-id": "usr_123",
      },
      body: "{",
    }),
  );

  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).error.code, "invalid_json");
});

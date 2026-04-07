import assert from "node:assert/strict";
import test from "node:test";

import { getCaseRoute, listCasesRoute } from "../src/routes/cases.ts";
import { createReportRoute } from "../src/routes/reports.ts";

class FakeApiRepository {
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

  async createReport(payload) {
    this.calls.push(["createReport", payload]);
    return this.report;
  }

  async listCases(query) {
    this.calls.push(["listCases", query]);
    return this.cases;
  }

  async getCase(caseId) {
    this.calls.push(["getCase", caseId]);
    return caseId === "case_123" ? this.caseDetail : null;
  }
}

test("POST /api/reports validates the payload and forwards the normalized capture to the repository", async () => {
  const repo = new FakeApiRepository();
  const response = await createReportRoute(
    { repository: repo },
    {
      body: {
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
        selectedElement: {
          selector: "[data-testid='refund-total']",
          text: "Total",
        },
        featureFlags: {
          refund_flow_v2: true,
        },
        metadata: {
          locale: "en-AU",
        },
        journeyEvents: [
          {
            type: "navigation",
            at: "2026-04-07T10:01:00Z",
            url: "/orders",
          },
        ],
      },
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(response.body, {
    report: {
      id: "rpt_123",
      caseId: "case_123",
    },
  });
  assert.equal(repo.calls.length, 1);
  assert.equal(repo.calls[0][0], "createReport");
  assert.equal(repo.calls[0][1].selectedElement.selector, "[data-testid='refund-total']");
});

test("POST /api/reports rejects invalid payloads without hitting the repository", async () => {
  const repo = new FakeApiRepository();
  const response = await createReportRoute(
    { repository: repo },
    {
      body: {
        projectId: "proj_123",
        commentText: "",
      },
    },
  );

  assert.equal(response.status, 400);
  assert.equal(repo.calls.length, 0);
  assert.equal(response.body.error.code, "invalid_request");
  assert.ok(response.body.error.details.fieldErrors.commentText.length > 0);
});

test("GET /api/cases forwards query filters to the repository", async () => {
  const repo = new FakeApiRepository();
  const response = await listCasesRoute(
    { repository: repo },
    {
      query: {
        projectId: "proj_123",
        status: "confirmed",
        search: "refund",
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    cases: repo.cases,
  });
  assert.deepEqual(repo.calls[0], [
    "listCases",
    {
      projectId: "proj_123",
      status: "confirmed",
      assigneeUserId: undefined,
      search: "refund",
    },
  ]);
});

test("GET /api/cases rejects invalid query filters", async () => {
  const repo = new FakeApiRepository();
  const response = await listCasesRoute(
    { repository: repo },
    {
      query: {
        status: "done",
      },
    },
  );

  assert.equal(response.status, 400);
  assert.equal(repo.calls.length, 0);
  assert.equal(response.body.error.code, "invalid_request");
  assert.ok(response.body.error.details.fieldErrors.status.length > 0);
});

test("GET /api/cases/:caseId returns a typed case detail payload and 404s when missing", async () => {
  const repo = new FakeApiRepository();
  const foundResponse = await getCaseRoute(
    { repository: repo },
    { params: { caseId: "case_123" } },
  );

  assert.equal(foundResponse.status, 200);
  assert.deepEqual(foundResponse.body, {
    case: repo.caseDetail,
  });
  assert.deepEqual(repo.calls[0], ["getCase", "case_123"]);

  const missingResponse = await getCaseRoute(
    { repository: repo },
    { params: { caseId: "case_missing" } },
  );

  assert.equal(missingResponse.status, 404);
  assert.equal(missingResponse.body.error.code, "not_found");
});

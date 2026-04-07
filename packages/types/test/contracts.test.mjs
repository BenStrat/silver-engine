import assert from "node:assert/strict";
import test from "node:test";

import {
  aiDraftContentSchema,
  caseStatusSchema,
  createReportRequestSchema,
  sendCaseToLinearRequestSchema,
} from "../dist/index.js";

test("createReportRequestSchema parses a valid capture payload", () => {
  const parsed = createReportRequestSchema.parse({
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
    journeyEvents: [
      {
        type: "navigation",
        at: "2026-04-07T10:01:00Z",
        url: "/orders",
      },
      {
        type: "click",
        at: "2026-04-07T10:01:06Z",
        label: "Order #1042",
      },
    ],
  });

  assert.equal(parsed.deviceType, "desktop");
  assert.equal(parsed.journeyEvents.length, 2);
});

test("caseStatusSchema rejects unsupported workflow values", () => {
  assert.throws(() => caseStatusSchema.parse("done"));
});

test("aiDraftContentSchema requires the structured Linear draft fields", () => {
  const parsed = aiDraftContentSchema.parse({
    title: "[QA] Refund total disappears after clicking Refund",
    summary: "The refund modal loses the total field after clicking Refund.",
    stepsToReproduce: ["Open Orders", "Open Order #1042", "Click Refund"],
    expected: "The total should remain visible.",
    actual: "The total disappears.",
    impact: "Users may lose confidence in the refund flow.",
    environment: "Chrome on macOS, desktop viewport",
  });

  assert.equal(parsed.stepsToReproduce[0], "Open Orders");
});

test("sendCaseToLinearRequestSchema accepts either a draft id or explicit issue content", () => {
  assert.doesNotThrow(() =>
    sendCaseToLinearRequestSchema.parse({
      draftId: "aid_123",
    }),
  );

  assert.doesNotThrow(() =>
    sendCaseToLinearRequestSchema.parse({
      title: "[QA] Refund total disappears after clicking Refund",
      description: "Steps\n\n1. Open Orders",
    }),
  );

  assert.throws(() =>
    sendCaseToLinearRequestSchema.parse({
      title: "[QA] Missing description",
    }),
  );
});

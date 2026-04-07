import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

test("schema defines the core MVP models", () => {
  for (const modelName of [
    "Organization",
    "User",
    "Project",
    "Report",
    "Case",
    "CaseComment",
    "JourneyEvent",
    "AIDraft",
    "LinearIssueLink",
  ]) {
    assert.match(schema, new RegExp(`model ${modelName} \\{`));
  }
});

test("schema includes the important relational constraints", () => {
  assert.match(schema, /@@unique\(\[caseId, reportId\]\)/);
  assert.match(schema, /caseId\s+String\s+@unique\s+@map\("case_id"\)/);
  assert.match(schema, /@@unique\(\[organizationId, slug\]\)/);
});

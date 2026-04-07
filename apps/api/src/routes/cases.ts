import {
  caseDetailSchema,
  getCaseResponseSchema,
  listCasesQuerySchema,
  listCasesResponseSchema,
} from "@silver/types";
import type { z } from "zod";

import { fail, ok, type ApiRouteResult } from "../lib/http.js";
import type { CaseRepository } from "../lib/repository.js";

export type ListCasesRouteDeps = {
  repository: CaseRepository;
};

export type GetCaseRouteDeps = {
  repository: CaseRepository;
};

export type RouteQueryInput = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const listCasesRoute = async (
  deps: ListCasesRouteDeps,
  input: { query: RouteQueryInput },
): Promise<ApiRouteResult<z.infer<typeof listCasesResponseSchema>>> => {
  const parsedQuery = listCasesQuerySchema.safeParse({
    projectId: firstValue(input.query.projectId),
    status: firstValue(input.query.status),
    assigneeUserId: firstValue(input.query.assigneeUserId),
    search: firstValue(input.query.search),
  });

  if (!parsedQuery.success) {
    return fail("invalid_request", "Query parameters did not match the cases contract.", 400, parsedQuery.error.flatten());
  }

  const cases = await deps.repository.listCases(parsedQuery.data);
  const response = listCasesResponseSchema.parse({ cases });

  return ok(response);
};

export const getCaseRoute = async (
  deps: GetCaseRouteDeps,
  input: { params: { caseId: string } },
): Promise<ApiRouteResult<z.infer<typeof getCaseResponseSchema>>> => {
  if (!input.params.caseId) {
    return fail("invalid_request", "A caseId path parameter is required.", 400);
  }

  const foundCase = await deps.repository.getCase(input.params.caseId);

  if (!foundCase) {
    return fail("not_found", `Case ${input.params.caseId} was not found.`, 404);
  }

  const response = getCaseResponseSchema.parse({ case: caseDetailSchema.parse(foundCase) });

  return ok(response);
};

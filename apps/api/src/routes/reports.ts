import { createReportRequestSchema, createReportResponseSchema } from "@silver/types";
import type { z } from "zod";

import { fail, ok, type ApiRouteResult } from "../lib/http.js";
import type { ReportRepository } from "../lib/repository.js";

export type CreateReportRouteDeps = {
  repository: ReportRepository;
};

export type CreateReportRouteInput = {
  body: unknown;
};

export const createReportRoute = async (
  deps: CreateReportRouteDeps,
  input: CreateReportRouteInput,
): Promise<ApiRouteResult<z.infer<typeof createReportResponseSchema>>> => {
  const parsedBody = createReportRequestSchema.safeParse(input.body);

  if (!parsedBody.success) {
    return fail("invalid_request", "Request body did not match the report contract.", 400, parsedBody.error.flatten());
  }

  const report = await deps.repository.createReport(parsedBody.data);
  const response = createReportResponseSchema.parse({ report });

  return ok(response, 201);
};

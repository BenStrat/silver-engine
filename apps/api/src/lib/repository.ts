import type { z } from "zod";

import {
  caseDetailSchema,
  caseSchema,
  createReportRequestSchema,
  createReportResponseSchema,
  listCasesQuerySchema,
} from "@silver/types";

export type ReportRepository = {
  createReport(
    input: z.infer<typeof createReportRequestSchema>,
  ): Promise<z.infer<typeof createReportResponseSchema>["report"]>;
};

export type CaseRepository = {
  listCases(query: z.infer<typeof listCasesQuerySchema>): Promise<z.infer<typeof caseSchema>[]>;
  getCase(caseId: string): Promise<z.infer<typeof caseDetailSchema> | null>;
};

export type ApiRepository = ReportRepository & CaseRepository;

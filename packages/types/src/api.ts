import { z } from "zod";

import {
  aiDraftContentSchema,
  aiDraftSchema,
  caseCommentSchema,
  caseDetailSchema,
  caseSchema,
  featureFlagsSchema,
  journeyEventInputSchema,
  metadataSchema,
  organizationSchema,
  projectSchema,
  reportDetailSchema,
  reportSummarySchema,
  reproductionRecordSchema,
  selectedElementSchema,
  userSchema,
} from "./domain.js";
import {
  caseSeveritySchema,
  caseStatusSchema,
  deviceTypeSchema,
  idSchema,
  isoDatetimeSchema,
  linearProviderTypeSchema,
  nonEmptyStringSchema,
  reportStatusSchema,
  urlSchema,
} from "./shared.js";

const nonEmptyObject = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .refine((value) => Object.values(value).some((field) => field !== undefined), {
      message: "At least one field must be provided.",
    });

export const meResponseSchema = z.object({
  user: userSchema,
  organization: organizationSchema,
});

export const listProjectsResponseSchema = z.object({
  projects: z.array(projectSchema),
});

export const createProjectRequestSchema = z.object({
  name: nonEmptyStringSchema,
  slug: nonEmptyStringSchema,
});

export const createReportRequestSchema = z.object({
  projectId: idSchema,
  commentText: nonEmptyStringSchema,
  pageUrl: urlSchema,
  pageRoute: nonEmptyStringSchema,
  pageTitle: nonEmptyStringSchema,
  screenshotUrl: urlSchema,
  screenshotWidth: z.number().int().positive(),
  screenshotHeight: z.number().int().positive(),
  devicePixelRatio: z.number().positive(),
  browserName: nonEmptyStringSchema,
  browserVersion: nonEmptyStringSchema,
  osName: nonEmptyStringSchema,
  deviceType: deviceTypeSchema,
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
  screenWidth: z.number().int().positive(),
  screenHeight: z.number().int().positive(),
  locale: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  appEnvironment: z.string().trim().min(1).optional(),
  buildSha: z.string().trim().min(1).optional(),
  selectedElement: selectedElementSchema.optional(),
  featureFlags: featureFlagsSchema.optional(),
  metadata: metadataSchema.optional(),
  journeyEvents: z.array(journeyEventInputSchema).default([]),
});

export const createReportResponseSchema = z.object({
  report: z.object({
    id: idSchema,
    caseId: idSchema.nullable(),
  }),
});

export const listReportsQuerySchema = z.object({
  projectId: idSchema.optional(),
  status: reportStatusSchema.optional(),
  from: isoDatetimeSchema.optional(),
  to: isoDatetimeSchema.optional(),
});

export const listReportsResponseSchema = z.object({
  reports: z.array(reportSummarySchema),
});

export const getReportResponseSchema = z.object({
  report: reportDetailSchema,
});

export const listCasesQuerySchema = z.object({
  projectId: idSchema.optional(),
  status: caseStatusSchema.optional(),
  assigneeUserId: idSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export const listCasesResponseSchema = z.object({
  cases: z.array(caseSchema),
});

export const getCaseResponseSchema = z.object({
  case: caseDetailSchema,
});

export const createCaseRequestSchema = z.object({
  projectId: idSchema,
  title: nonEmptyStringSchema.optional(),
  sourceReportId: idSchema.optional(),
});

export const updateCaseRequestSchema = nonEmptyObject({
  title: nonEmptyStringSchema.optional(),
  status: caseStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  assigneeUserId: idSchema.optional(),
  aiSummary: nonEmptyStringSchema.optional(),
});

export const attachReportToCaseRequestSchema = z.object({
  reportId: idSchema,
});

export const mergeCaseRequestSchema = z.object({
  duplicateCaseId: idSchema,
});

export const listCaseCommentsResponseSchema = z.object({
  comments: z.array(caseCommentSchema),
});

export const createCaseCommentRequestSchema = z.object({
  body: nonEmptyStringSchema,
});

export const createReproductionRecordRequestSchema = z.object({
  reproduced: z.boolean(),
  environments: z.array(deviceTypeSchema).min(1),
  browserName: z.string().trim().min(1).optional(),
  osName: z.string().trim().min(1).optional(),
  viewportWidth: z.number().int().positive().optional(),
  viewportHeight: z.number().int().positive().optional(),
  notes: z.string().trim().min(1).optional(),
});

export const createReproductionRecordResponseSchema = z.object({
  reproductionRecord: reproductionRecordSchema,
});

export const signUploadRequestSchema = z.object({
  filename: nonEmptyStringSchema,
  contentType: nonEmptyStringSchema,
});

export const signUploadResponseSchema = z.object({
  uploadUrl: urlSchema,
  fileUrl: urlSchema,
});

export const createAiDraftRequestSchema = z
  .object({
    regenerate: z.boolean().optional(),
  })
  .strict();

export const createAiDraftResponseSchema = z.object({
  draft: z.object({
    id: idSchema,
    status: z.literal("pending"),
  }),
});

export const getLatestAiDraftResponseSchema = z.object({
  draft: aiDraftSchema.nullable(),
});

export const linearConnectRequestSchema = z.object({
  providerType: linearProviderTypeSchema,
  workspaceName: nonEmptyStringSchema,
  accessToken: nonEmptyStringSchema,
});

export const linearTeamSchema = z.object({
  id: idSchema,
  key: nonEmptyStringSchema.optional(),
  name: nonEmptyStringSchema,
});

export const listLinearTeamsResponseSchema = z.object({
  teams: z.array(linearTeamSchema),
});

export const projectLinearMappingRequestSchema = z.object({
  linearWorkspaceId: idSchema,
  linearTeamId: idSchema,
  defaultLabelIds: z.array(idSchema).default([]),
  defaultPriority: z.number().int().min(0).max(4).optional(),
});

export const sendCaseToLinearRequestSchema = z
  .object({
    draftId: idSchema.optional(),
    title: nonEmptyStringSchema.optional(),
    description: nonEmptyStringSchema.optional(),
  })
  .refine((value) => value.draftId || (value.title && value.description), {
    message: "Provide a draftId or both title and description.",
  });

export const sendCaseToLinearResponseSchema = z.object({
  issue: z.object({
    id: idSchema,
    identifier: nonEmptyStringSchema,
    url: urlSchema,
  }),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;
export type CreateReportResponse = z.infer<typeof createReportResponseSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;
export type CreateCaseRequest = z.infer<typeof createCaseRequestSchema>;
export type UpdateCaseRequest = z.infer<typeof updateCaseRequestSchema>;
export type CreateCaseCommentRequest = z.infer<typeof createCaseCommentRequestSchema>;
export type CreateReproductionRecordRequest = z.infer<typeof createReproductionRecordRequestSchema>;
export type SignUploadRequest = z.infer<typeof signUploadRequestSchema>;
export type SignUploadResponse = z.infer<typeof signUploadResponseSchema>;
export type CreateAIDraftRequest = z.infer<typeof createAiDraftRequestSchema>;
export type SendCaseToLinearRequest = z.infer<typeof sendCaseToLinearRequestSchema>;
export type SendCaseToLinearResponse = z.infer<typeof sendCaseToLinearResponseSchema>;

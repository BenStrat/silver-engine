import { z } from "zod";

import {
  aiDraftStatusSchema,
  attachmentKindSchema,
  caseSeveritySchema,
  caseStatusSchema,
  deviceTypeSchema,
  idSchema,
  isoDatetimeSchema,
  jsonValueSchema,
  journeyEventTypeSchema,
  linearProviderTypeSchema,
  nonEmptyStringSchema,
  reportSourceSchema,
  reportStatusSchema,
  stringArraySchema,
  urlSchema,
  userRoleSchema,
} from "./shared.js";

const numericValueSchema = z.number().finite().nonnegative();
const nullableStringSchema = nonEmptyStringSchema.nullable();

export const organizationSchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const userSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  email: z.email(),
  name: nonEmptyStringSchema,
  role: userRoleSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const projectSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: nonEmptyStringSchema,
  slug: nonEmptyStringSchema,
  defaultEnvironment: nullableStringSchema,
  linearTeamId: z.string().trim().min(1).nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const boundingBoxSchema = z.object({
  x: numericValueSchema,
  y: numericValueSchema,
  width: numericValueSchema,
  height: numericValueSchema,
});

export const normalizedBoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

const selectedElementBaseSchema = z.object({
  selector: nonEmptyStringSchema.optional(),
  xpath: nonEmptyStringSchema.optional(),
  text: nonEmptyStringSchema.nullable().optional(),
  ariaLabel: nonEmptyStringSchema.nullable().optional(),
  boundingBox: boundingBoxSchema.optional(),
  normalized: normalizedBoundingBoxSchema.optional(),
});

export const selectedElementSchema = selectedElementBaseSchema
  .refine(
    (value) => Boolean(value.selector || value.xpath || value.text || value.ariaLabel),
    "Selected element requires at least one identifier.",
  );

export const featureFlagsSchema = z.record(z.string(), z.boolean());
export const metadataSchema = z.record(z.string(), jsonValueSchema);

export const journeyEventPayloadSchema = z
  .object({
    url: nonEmptyStringSchema.optional(),
    selector: nonEmptyStringSchema.optional(),
    label: nonEmptyStringSchema.optional(),
    message: nonEmptyStringSchema.optional(),
    method: nonEmptyStringSchema.optional(),
    status: z.number().int().min(100).max(599).optional(),
  })
  .catchall(jsonValueSchema);

export const journeyEventInputSchema = z
  .object({
    type: journeyEventTypeSchema,
    at: isoDatetimeSchema,
  })
  .catchall(jsonValueSchema);

export const journeyEventSchema = z.object({
  id: idSchema,
  reportId: idSchema,
  eventType: journeyEventTypeSchema,
  eventAt: isoDatetimeSchema,
  sequenceNumber: z.number().int().nonnegative(),
  payload: journeyEventPayloadSchema,
  createdAt: isoDatetimeSchema,
});

export const attachmentSchema = z.object({
  id: idSchema,
  caseId: idSchema.nullable(),
  reportId: idSchema.nullable(),
  uploadedByUserId: idSchema,
  kind: attachmentKindSchema,
  fileUrl: urlSchema,
  mimeType: nonEmptyStringSchema,
  createdAt: isoDatetimeSchema,
});

export const reportSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  projectId: idSchema,
  caseId: idSchema.nullable(),
  createdByUserId: idSchema,
  commentText: nonEmptyStringSchema,
  status: reportStatusSchema,
  source: reportSourceSchema,
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
  locale: z.string().trim().min(1).nullable(),
  timezone: z.string().trim().min(1).nullable(),
  appEnvironment: z.string().trim().min(1).nullable(),
  buildSha: z.string().trim().min(1).nullable(),
  featureFlags: featureFlagsSchema.nullable(),
  selectedElement: selectedElementSchema.nullable(),
  metadata: metadataSchema.nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const reportSummarySchema = reportSchema.pick({
  id: true,
  caseId: true,
  projectId: true,
  commentText: true,
  status: true,
  pageRoute: true,
  screenshotUrl: true,
  browserName: true,
  osName: true,
  deviceType: true,
  createdAt: true,
  updatedAt: true,
});

export const reportDetailSchema = reportSchema.extend({
  attachments: z.array(attachmentSchema).default([]),
  journeyEvents: z.array(journeyEventSchema).default([]),
});

export const caseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  projectId: idSchema,
  title: nullableStringSchema,
  status: caseStatusSchema,
  severity: caseSeveritySchema.nullable(),
  assigneeUserId: idSchema.nullable(),
  sourceReportId: idSchema.nullable(),
  duplicateOfCaseId: idSchema.nullable(),
  aiSummary: nullableStringSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const caseCommentSchema = z.object({
  id: idSchema,
  caseId: idSchema,
  authorUserId: idSchema,
  body: nonEmptyStringSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const reproductionRecordSchema = z.object({
  id: idSchema,
  caseId: idSchema,
  createdByUserId: idSchema,
  reproduced: z.boolean(),
  environments: z.array(deviceTypeSchema).min(1),
  browserName: z.string().trim().min(1).nullable(),
  osName: z.string().trim().min(1).nullable(),
  viewportWidth: z.number().int().positive().nullable(),
  viewportHeight: z.number().int().positive().nullable(),
  notes: z.string().trim().min(1).nullable(),
  createdAt: isoDatetimeSchema,
});

export const aiDraftContentSchema = z.object({
  title: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  stepsToReproduce: stringArraySchema.min(1),
  expected: nonEmptyStringSchema,
  actual: nonEmptyStringSchema,
  impact: nonEmptyStringSchema,
  environment: nonEmptyStringSchema,
});

const aiDraftBaseSchema = z.object({
  id: idSchema,
  caseId: idSchema,
  createdByUserId: idSchema,
  rawResponse: jsonValueSchema.nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const pendingAiDraftSchema = aiDraftBaseSchema.extend({
  status: z.literal(aiDraftStatusSchema.enum.pending),
  title: z.null(),
  summary: z.null(),
  stepsToReproduce: z.null(),
  expected: z.null(),
  actual: z.null(),
  impact: z.null(),
  environment: z.null(),
  errorText: z.null(),
});

export const completedAiDraftSchema = aiDraftBaseSchema.extend({
  status: z.literal(aiDraftStatusSchema.enum.completed),
  ...aiDraftContentSchema.shape,
  errorText: z.null(),
});

export const failedAiDraftSchema = aiDraftBaseSchema.extend({
  status: z.literal(aiDraftStatusSchema.enum.failed),
  title: z.null(),
  summary: z.null(),
  stepsToReproduce: z.null(),
  expected: z.null(),
  actual: z.null(),
  impact: z.null(),
  environment: z.null(),
  errorText: nonEmptyStringSchema,
});

export const aiDraftSchema = z.discriminatedUnion("status", [
  pendingAiDraftSchema,
  completedAiDraftSchema,
  failedAiDraftSchema,
]);

export const linearWorkspaceSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  providerType: linearProviderTypeSchema,
  workspaceName: nonEmptyStringSchema,
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const linearProjectMappingSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  linearWorkspaceId: idSchema,
  linearTeamId: idSchema,
  defaultLabelIds: z.array(idSchema).nullable(),
  defaultPriority: z.number().int().min(0).max(4).nullable(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
});

export const linearIssueLinkSchema = z.object({
  id: idSchema,
  caseId: idSchema,
  linearWorkspaceId: idSchema,
  linearIssueId: idSchema,
  linearIssueIdentifier: nonEmptyStringSchema,
  linearIssueUrl: urlSchema,
  createdAt: isoDatetimeSchema,
});

export const caseDetailSchema = caseSchema.extend({
  reports: z.array(reportSummarySchema).default([]),
  comments: z.array(caseCommentSchema).default([]),
  reproductionRecords: z.array(reproductionRecordSchema).default([]),
  linearIssueLink: linearIssueLinkSchema.nullable(),
  latestAiDraft: aiDraftSchema.nullable(),
});

export const aiDraftInputSchema = z.object({
  case: z.object({
    status: caseStatusSchema,
    severity: caseSeveritySchema.nullable().optional(),
  }),
  reports: z
    .array(
      z.object({
        commentText: nonEmptyStringSchema,
        pageRoute: nonEmptyStringSchema,
        browserName: nonEmptyStringSchema,
        osName: nonEmptyStringSchema,
        deviceType: deviceTypeSchema,
        viewport: nonEmptyStringSchema,
        selectedElement: selectedElementBaseSchema
          .pick({
            selector: true,
            text: true,
          })
          .partial()
          .nullable()
          .optional(),
        journey: z.array(nonEmptyStringSchema).default([]),
      }),
    )
    .min(1),
  comments: z.array(nonEmptyStringSchema).default([]),
  reproduction: z
    .array(
      z.object({
        reproduced: z.boolean(),
        environments: z.array(deviceTypeSchema).default([]),
      }),
    )
    .default([]),
});

export type Organization = z.infer<typeof organizationSchema>;
export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SelectedElement = z.infer<typeof selectedElementSchema>;
export type JourneyEvent = z.infer<typeof journeyEventSchema>;
export type JourneyEventInput = z.infer<typeof journeyEventInputSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type Report = z.infer<typeof reportSchema>;
export type ReportDetail = z.infer<typeof reportDetailSchema>;
export type Case = z.infer<typeof caseSchema>;
export type CaseDetail = z.infer<typeof caseDetailSchema>;
export type CaseComment = z.infer<typeof caseCommentSchema>;
export type ReproductionRecord = z.infer<typeof reproductionRecordSchema>;
export type AIDraft = z.infer<typeof aiDraftSchema>;
export type AIDraftContent = z.infer<typeof aiDraftContentSchema>;
export type AIDraftInput = z.infer<typeof aiDraftInputSchema>;
export type LinearWorkspace = z.infer<typeof linearWorkspaceSchema>;
export type LinearProjectMapping = z.infer<typeof linearProjectMappingSchema>;
export type LinearIssueLink = z.infer<typeof linearIssueLinkSchema>;

import { getPrismaClient, type PrismaClientType, type PrismaNamespace } from "@silver/db";
import {
  aiDraftSchema,
  type Case,
  type CaseDetail,
  type CreateReportRequest,
  type CreateReportResponse,
  type ListCasesQuery,
} from "@silver/types";

export type RequestContext = {
  organizationId: string;
  userId?: string;
};

export class RepositoryError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.status = status;
    this.code = code;
  }
}

export interface TriageRepository {
  createReport(
    input: CreateReportRequest,
    context: RequestContext & { userId: string },
  ): Promise<CreateReportResponse["report"]>;
  listCases(input: ListCasesQuery, context: RequestContext): Promise<Case[]>;
  getCaseDetail(caseId: string, context: RequestContext): Promise<CaseDetail | null>;
}

type PrismaLike = Pick<
  PrismaClientType,
  "project" | "case" | "report" | "caseReport" | "journeyEvent" | "$transaction"
>;

const toIsoString = (value: Date) => value.toISOString();

const createCaseTitle = (commentText: string) => {
  const trimmed = commentText.trim();

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117).trimEnd()}...`;
};

const mapCase = (record: {
  id: string;
  organizationId: string;
  projectId: string;
  title: string | null;
  status:
    | "new"
    | "investigating"
    | "needs_info"
    | "confirmed"
    | "duplicate"
    | "wont_fix"
    | "sent_to_linear";
  severity: "low" | "medium" | "high" | "critical" | null;
  assigneeUserId: string | null;
  sourceReportId: string | null;
  duplicateOfCaseId: string | null;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Case => ({
  id: record.id,
  organizationId: record.organizationId,
  projectId: record.projectId,
  title: record.title,
  status: record.status,
  severity: record.severity,
  assigneeUserId: record.assigneeUserId,
  sourceReportId: record.sourceReportId,
  duplicateOfCaseId: record.duplicateOfCaseId,
  aiSummary: record.aiSummary,
  createdAt: toIsoString(record.createdAt),
  updatedAt: toIsoString(record.updatedAt),
});

const mapReportSummary = (record: {
  id: string;
  caseId: string | null;
  projectId: string;
  commentText: string;
  status: "new" | "triaged" | "attached";
  pageRoute: string;
  screenshotUrl: string;
  browserName: string;
  osName: string;
  deviceType: "desktop" | "tablet" | "mobile";
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: record.id,
  caseId: record.caseId,
  projectId: record.projectId,
  commentText: record.commentText,
  status: record.status,
  pageRoute: record.pageRoute,
  screenshotUrl: record.screenshotUrl,
  browserName: record.browserName,
  osName: record.osName,
  deviceType: record.deviceType,
  createdAt: toIsoString(record.createdAt),
  updatedAt: toIsoString(record.updatedAt),
});

const mapCaseDetail = (record: {
  id: string;
  organizationId: string;
  projectId: string;
  title: string | null;
  status:
    | "new"
    | "investigating"
    | "needs_info"
    | "confirmed"
    | "duplicate"
    | "wont_fix"
    | "sent_to_linear";
  severity: "low" | "medium" | "high" | "critical" | null;
  assigneeUserId: string | null;
  sourceReportId: string | null;
  duplicateOfCaseId: string | null;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
  reportLinks: Array<{
    report: {
      id: string;
      caseId: string | null;
      projectId: string;
      commentText: string;
      status: "new" | "triaged" | "attached";
      pageRoute: string;
      screenshotUrl: string;
      browserName: string;
      osName: string;
      deviceType: "desktop" | "tablet" | "mobile";
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
  comments: Array<{
    id: string;
    caseId: string;
    authorUserId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  reproductionRecords: Array<{
    id: string;
    caseId: string;
    createdByUserId: string;
    reproduced: boolean;
    environmentsJson: unknown;
    browserName: string | null;
    osName: string | null;
    viewportWidth: number | null;
    viewportHeight: number | null;
    notes: string | null;
    createdAt: Date;
  }>;
  linearIssueLink: {
    id: string;
    caseId: string;
    linearWorkspaceId: string;
    linearIssueId: string;
    linearIssueIdentifier: string;
    linearIssueUrl: string;
    createdAt: Date;
  } | null;
  aiDrafts: Array<{
    id: string;
    caseId: string;
    createdByUserId: string;
    status: "pending" | "completed" | "failed";
    title: string | null;
    summary: string | null;
    stepsToReproduceJson: unknown;
    expectedText: string | null;
    actualText: string | null;
    impactText: string | null;
    environmentText: string | null;
    rawResponseJson: unknown;
    errorText: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): CaseDetail => {
  const latestDraft = record.aiDrafts[0];

  return {
    ...mapCase(record),
    reports: record.reportLinks.map(({ report }) => mapReportSummary(report)),
    comments: record.comments.map((comment) => ({
      id: comment.id,
      caseId: comment.caseId,
      authorUserId: comment.authorUserId,
      body: comment.body,
      createdAt: toIsoString(comment.createdAt),
      updatedAt: toIsoString(comment.updatedAt),
    })),
    reproductionRecords: record.reproductionRecords.map((item) => ({
      id: item.id,
      caseId: item.caseId,
      createdByUserId: item.createdByUserId,
      reproduced: item.reproduced,
      environments: Array.isArray(item.environmentsJson)
        ? item.environmentsJson.filter(
            (value): value is "desktop" | "tablet" | "mobile" =>
              value === "desktop" || value === "tablet" || value === "mobile",
          )
        : [],
      browserName: item.browserName,
      osName: item.osName,
      viewportWidth: item.viewportWidth,
      viewportHeight: item.viewportHeight,
      notes: item.notes,
      createdAt: toIsoString(item.createdAt),
    })),
    linearIssueLink: record.linearIssueLink
      ? {
          id: record.linearIssueLink.id,
          caseId: record.linearIssueLink.caseId,
          linearWorkspaceId: record.linearIssueLink.linearWorkspaceId,
          linearIssueId: record.linearIssueLink.linearIssueId,
          linearIssueIdentifier: record.linearIssueLink.linearIssueIdentifier,
          linearIssueUrl: record.linearIssueLink.linearIssueUrl,
          createdAt: toIsoString(record.linearIssueLink.createdAt),
        }
      : null,
    latestAiDraft: latestDraft
      ? aiDraftSchema.parse({
          id: latestDraft.id,
          caseId: latestDraft.caseId,
          createdByUserId: latestDraft.createdByUserId,
          status: latestDraft.status,
          title: latestDraft.title,
          summary: latestDraft.summary,
          stepsToReproduce: latestDraft.stepsToReproduceJson,
          expected: latestDraft.expectedText,
          actual: latestDraft.actualText,
          impact: latestDraft.impactText,
          environment: latestDraft.environmentText,
          rawResponse: latestDraft.rawResponseJson ?? null,
          errorText: latestDraft.errorText,
          createdAt: toIsoString(latestDraft.createdAt),
          updatedAt: toIsoString(latestDraft.updatedAt),
        })
      : null,
  };
};

export const createTriageRepository = (prisma: PrismaLike = getPrismaClient()): TriageRepository => ({
  async createReport(input, context) {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: context.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new RepositoryError(404, "not_found", "Project not found for organization.");
    }

    return prisma.$transaction(async (tx: PrismaNamespace.TransactionClient) => {
      const createdCase = await tx.case.create({
        data: {
          organizationId: context.organizationId,
          projectId: input.projectId,
          title: createCaseTitle(input.commentText),
          status: "new",
        },
        select: {
          id: true,
        },
      });

      const report = await tx.report.create({
        data: {
          organizationId: context.organizationId,
          projectId: input.projectId,
          caseId: createdCase.id,
          createdByUserId: context.userId,
          commentText: input.commentText,
          status: "new",
          source: "widget",
          pageUrl: input.pageUrl,
          pageRoute: input.pageRoute,
          pageTitle: input.pageTitle,
          screenshotUrl: input.screenshotUrl,
          screenshotWidth: input.screenshotWidth,
          screenshotHeight: input.screenshotHeight,
          devicePixelRatio: input.devicePixelRatio,
          browserName: input.browserName,
          browserVersion: input.browserVersion,
          osName: input.osName,
          deviceType: input.deviceType,
          viewportWidth: input.viewportWidth,
          viewportHeight: input.viewportHeight,
          screenWidth: input.screenWidth,
          screenHeight: input.screenHeight,
          locale: input.locale ?? null,
          timezone: input.timezone ?? null,
          appEnvironment: input.appEnvironment ?? null,
          buildSha: input.buildSha ?? null,
          featureFlagsJson: input.featureFlags ?? undefined,
          selectedElementJson: input.selectedElement ?? undefined,
          metadataJson: input.metadata ?? undefined,
        },
        select: {
          id: true,
          caseId: true,
        },
      });

      await tx.case.update({
        where: {
          id: createdCase.id,
        },
        data: {
          sourceReportId: report.id,
        },
      });

      await tx.caseReport.create({
        data: {
          caseId: createdCase.id,
          reportId: report.id,
        },
      });

      if (input.journeyEvents.length > 0) {
        await tx.journeyEvent.createMany({
          data: input.journeyEvents.map((event, index) => {
            const { at, type, ...payload } = event;

            return {
              reportId: report.id,
              eventType: type,
              eventAt: new Date(at),
              sequenceNumber: index + 1,
              payloadJson: payload,
            };
          }),
        });
      }

      return {
        id: report.id,
        caseId: report.caseId,
      };
    });
  },

  async listCases(input, context) {
    const records = await prisma.case.findMany({
      where: {
        organizationId: context.organizationId,
        projectId: input.projectId,
        status: input.status,
        assigneeUserId: input.assigneeUserId,
        ...(input.search
          ? {
              OR: [
                {
                  title: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
                {
                  aiSummary: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
                {
                  sourceReport: {
                    is: {
                      commentText: {
                        contains: input.search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return records.map(mapCase);
  },

  async getCaseDetail(caseId, context) {
    const record = await prisma.case.findFirst({
      where: {
        id: caseId,
        organizationId: context.organizationId,
      },
      include: {
        reportLinks: {
          include: {
            report: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        comments: {
          orderBy: {
            createdAt: "asc",
          },
        },
        reproductionRecords: {
          orderBy: {
            createdAt: "desc",
          },
        },
        linearIssueLink: true,
        aiDrafts: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return record ? mapCaseDetail(record) : null;
  },
});

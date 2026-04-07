import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ids = {
  organization: "org_demo",
  adminUser: "usr_admin_demo",
  project: "proj_demo_web",
  report: "rpt_demo_refund_total",
  case: "case_demo_refund_total",
  caseComment: "cmt_demo_refund_total",
  journeyEvent: "evt_demo_refund_click",
  aiDraft: "aid_demo_refund_total",
  linearWorkspace: "linws_demo",
  linearMapping: "linmap_demo",
  linearIssueLink: "linlink_demo",
};

async function main() {
  await prisma.organization.upsert({
    where: { id: ids.organization },
    update: { name: "Acme QA" },
    create: {
      id: ids.organization,
      name: "Acme QA",
    },
  });

  await prisma.user.upsert({
    where: { id: ids.adminUser },
    update: {
      email: "benji@example.com",
      name: "Benji",
      role: "admin",
      organizationId: ids.organization,
    },
    create: {
      id: ids.adminUser,
      organizationId: ids.organization,
      email: "benji@example.com",
      name: "Benji",
      role: "admin",
    },
  });

  await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: ids.organization,
        slug: "web-app-staging",
      },
    },
    update: {
      name: "Web App - Staging",
      linearTeamId: "ENG",
    },
    create: {
      id: ids.project,
      organizationId: ids.organization,
      name: "Web App - Staging",
      slug: "web-app-staging",
      defaultEnvironment: "staging",
      linearTeamId: "ENG",
    },
  });

  await prisma.case.upsert({
    where: { id: ids.case },
    update: {
      organizationId: ids.organization,
      projectId: ids.project,
      status: "confirmed",
      severity: "high",
      assigneeUserId: ids.adminUser,
      title: "Refund total disappears after clicking Refund",
    },
    create: {
      id: ids.case,
      organizationId: ids.organization,
      projectId: ids.project,
      status: "confirmed",
      severity: "high",
      assigneeUserId: ids.adminUser,
      title: "Refund total disappears after clicking Refund",
      aiSummary: "Primary demo case used to exercise the triage dashboard.",
    },
  });

  await prisma.report.upsert({
    where: { id: ids.report },
    update: {
      caseId: ids.case,
      organizationId: ids.organization,
      projectId: ids.project,
      createdByUserId: ids.adminUser,
      commentText: "Total disappears after clicking refund",
      status: "triaged",
      source: "widget",
      pageUrl: "https://app.example.com/orders/1042",
      pageRoute: "/orders/1042",
      pageTitle: "Order Details",
      screenshotUrl: "https://cdn.example.com/rpt_demo_refund_total.png",
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
      timezone: "Australia/Sydney",
      featureFlagsJson: {
        refund_flow_v2: true,
      },
      selectedElementJson: {
        selector: "[data-testid='refund-total']",
        text: "Total",
      },
    },
    create: {
      id: ids.report,
      caseId: ids.case,
      organizationId: ids.organization,
      projectId: ids.project,
      createdByUserId: ids.adminUser,
      commentText: "Total disappears after clicking refund",
      status: "triaged",
      source: "widget",
      pageUrl: "https://app.example.com/orders/1042",
      pageRoute: "/orders/1042",
      pageTitle: "Order Details",
      screenshotUrl: "https://cdn.example.com/rpt_demo_refund_total.png",
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
      timezone: "Australia/Sydney",
      featureFlagsJson: {
        refund_flow_v2: true,
      },
      selectedElementJson: {
        selector: "[data-testid='refund-total']",
        text: "Total",
      },
    },
  });

  await prisma.case.update({
    where: { id: ids.case },
    data: {
      sourceReportId: ids.report,
      aiSummary: "Refund modal hides the total after the CTA is pressed.",
    },
  });

  await prisma.caseReport.upsert({
    where: {
      caseId_reportId: {
        caseId: ids.case,
        reportId: ids.report,
      },
    },
    update: {},
    create: {
      caseId: ids.case,
      reportId: ids.report,
    },
  });

  await prisma.caseComment.upsert({
    where: { id: ids.caseComment },
    update: {
      caseId: ids.case,
      authorUserId: ids.adminUser,
      body: "Reproduced in Chrome desktop. Safari desktop is still pending.",
    },
    create: {
      id: ids.caseComment,
      caseId: ids.case,
      authorUserId: ids.adminUser,
      body: "Reproduced in Chrome desktop. Safari desktop is still pending.",
    },
  });

  await prisma.journeyEvent.upsert({
    where: { id: ids.journeyEvent },
    update: {
      reportId: ids.report,
      eventType: "click",
      eventAt: new Date("2026-04-07T10:01:06Z"),
      sequenceNumber: 2,
      payloadJson: {
        url: "/orders/1042",
        selector: "button[data-testid='refund']",
        label: "Refund",
      },
    },
    create: {
      id: ids.journeyEvent,
      reportId: ids.report,
      eventType: "click",
      eventAt: new Date("2026-04-07T10:01:06Z"),
      sequenceNumber: 2,
      payloadJson: {
        url: "/orders/1042",
        selector: "button[data-testid='refund']",
        label: "Refund",
      },
    },
  });

  await prisma.aiDraft.upsert({
    where: { id: ids.aiDraft },
    update: {
      caseId: ids.case,
      createdByUserId: ids.adminUser,
      status: "completed",
      title: "[QA] Refund total disappears after clicking Refund",
      summary: "The refund modal loses the total field after clicking Refund.",
      stepsToReproduceJson: [
        "Open Orders",
        "Open Order #1042",
        "Click Refund",
      ],
      expectedText: "The total should remain visible.",
      actualText: "The total disappears.",
      impactText: "Users may lose confidence in the refund confirmation flow.",
      environmentText: "Chrome on macOS, desktop viewport",
    },
    create: {
      id: ids.aiDraft,
      caseId: ids.case,
      createdByUserId: ids.adminUser,
      status: "completed",
      title: "[QA] Refund total disappears after clicking Refund",
      summary: "The refund modal loses the total field after clicking Refund.",
      stepsToReproduceJson: [
        "Open Orders",
        "Open Order #1042",
        "Click Refund",
      ],
      expectedText: "The total should remain visible.",
      actualText: "The total disappears.",
      impactText: "Users may lose confidence in the refund confirmation flow.",
      environmentText: "Chrome on macOS, desktop viewport",
    },
  });

  await prisma.linearWorkspace.upsert({
    where: { id: ids.linearWorkspace },
    update: {
      organizationId: ids.organization,
      providerType: "api_key",
      workspaceName: "Acme Engineering",
      accessTokenEncrypted: "encrypted-demo-token",
    },
    create: {
      id: ids.linearWorkspace,
      organizationId: ids.organization,
      providerType: "api_key",
      workspaceName: "Acme Engineering",
      accessTokenEncrypted: "encrypted-demo-token",
    },
  });

  await prisma.linearProjectMapping.upsert({
    where: { id: ids.linearMapping },
    update: {
      projectId: ids.project,
      linearWorkspaceId: ids.linearWorkspace,
      linearTeamId: "ENG",
      defaultLabelIdsJson: ["label_bug"],
      defaultPriority: 2,
    },
    create: {
      id: ids.linearMapping,
      projectId: ids.project,
      linearWorkspaceId: ids.linearWorkspace,
      linearTeamId: "ENG",
      defaultLabelIdsJson: ["label_bug"],
      defaultPriority: 2,
    },
  });

  await prisma.linearIssueLink.upsert({
    where: { caseId: ids.case },
    update: {
      linearWorkspaceId: ids.linearWorkspace,
      linearIssueId: "lin_demo_123",
      linearIssueIdentifier: "ENG-123",
      linearIssueUrl: "https://linear.app/acme/issue/ENG-123",
    },
    create: {
      id: ids.linearIssueLink,
      caseId: ids.case,
      linearWorkspaceId: ids.linearWorkspace,
      linearIssueId: "lin_demo_123",
      linearIssueIdentifier: "ENG-123",
      linearIssueUrl: "https://linear.app/acme/issue/ENG-123",
    },
  });

  console.log("Seeded demo triage data for packages/db.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { createTriageRepository, RepositoryError, type RequestContext, type TriageRepository } from "./data/triageRepository.js";
import { readJsonBody, toWebResponse } from "./http/web.js";
import { jsonResponse, methodNotAllowedResponse, notFoundResponse, type HttpResponse } from "./http/response.js";
import type { ApiRepository } from "./lib/repository.js";
import { getCaseRoute, listCasesRoute, createReportRoute } from "./routes/index.js";

export type ApiApp = (request: Request) => Promise<Response>;

const getRequestContext = (
  request: Request,
  requireUserId = false,
): RequestContext | Response => {
  const organizationId = request.headers.get("x-organization-id");

  if (!organizationId) {
    return toWebResponse(
      jsonResponse(401, {
        error: {
          code: "missing_organization",
          message: "The x-organization-id header is required.",
        },
      }),
    );
  }

  const userId = request.headers.get("x-user-id");

  if (requireUserId && !userId) {
    return toWebResponse(
      jsonResponse(401, {
        error: {
          code: "missing_user",
          message: "The x-user-id header is required.",
        },
      }),
    );
  }

  return {
    organizationId,
    userId: userId ?? undefined,
  };
};

const toQueryRecord = (url: URL) => {
  const query = Object.create(null) as Record<string, string | string[] | undefined>;

  for (const [key, value] of url.searchParams.entries()) {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
      continue;
    }

    query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }

  return query;
};

const createRouteRepository = (repository: TriageRepository, context: RequestContext): ApiRepository => ({
  createReport: (input) => {
    if (!context.userId) {
      throw new RepositoryError(401, "missing_user", "The x-user-id header is required.");
    }

    return repository.createReport(input, {
      organizationId: context.organizationId,
      userId: context.userId,
    });
  },
  listCases: (query) =>
    repository.listCases(query, {
      organizationId: context.organizationId,
    }),
  getCase: (caseId) =>
    repository.getCaseDetail(caseId, {
      organizationId: context.organizationId,
    }),
});

const toJsonResponse = (result: { status: number; body: unknown }) =>
  toWebResponse(jsonResponse(result.status, result.body));

const handleApplicationError = (error: unknown): HttpResponse => {
  if (error instanceof RepositoryError) {
    return jsonResponse(error.status, {
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof SyntaxError) {
    return jsonResponse(400, {
      error: {
        code: "invalid_json",
        message: "Request body is not valid JSON.",
      },
    });
  }

  return jsonResponse(500, {
    error: {
      code: "internal_error",
      message: "Unexpected API error.",
    },
  });
};

export const createApiApp = (repository?: TriageRepository): ApiApp => {
  let resolvedRepository = repository;

  const getRepository = () => {
    resolvedRepository ??= createTriageRepository();
    return resolvedRepository;
  };

  return async (request) => {
    const url = new URL(request.url);
    const method = request.method || "GET";
    const pathname = url.pathname;

    if (pathname === "/health" || pathname === "/api/health") {
      if (method !== "GET") {
        return toWebResponse(methodNotAllowedResponse(["GET"]));
      }

      return toWebResponse(
        jsonResponse(200, {
          ok: true,
          service: "@silver/api",
        }),
      );
    }

    if (pathname === "/api") {
      if (method !== "GET") {
        return toWebResponse(methodNotAllowedResponse(["GET"]));
      }

      return toWebResponse(
        jsonResponse(200, {
          ok: true,
          routes: ["/health", "POST /api/reports", "GET /api/cases", "GET /api/cases/:caseId"],
        }),
      );
    }

    try {
      if (pathname === "/api/reports") {
        if (method !== "POST") {
          return toWebResponse(methodNotAllowedResponse(["POST"]));
        }

        const routeContext = getRequestContext(request, true);
        if (routeContext instanceof Response) {
          return routeContext;
        }

        return toJsonResponse(
          await createReportRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { body: await readJsonBody(request) },
          ),
        );
      }

      if (pathname === "/api/cases") {
        if (method !== "GET") {
          return toWebResponse(methodNotAllowedResponse(["GET"]));
        }

        const routeContext = getRequestContext(request);
        if (routeContext instanceof Response) {
          return routeContext;
        }

        return toJsonResponse(
          await listCasesRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { query: toQueryRecord(url) },
          ),
        );
      }

      const caseMatch = /^\/api\/cases\/([^/]+)$/.exec(pathname);
      if (caseMatch) {
        if (method !== "GET") {
          return toWebResponse(methodNotAllowedResponse(["GET"]));
        }

        const routeContext = getRequestContext(request);
        if (routeContext instanceof Response) {
          return routeContext;
        }

        return toJsonResponse(
          await getCaseRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { params: { caseId: decodeURIComponent(caseMatch[1]) } },
          ),
        );
      }
    } catch (error) {
      return toWebResponse(handleApplicationError(error));
    }

    if (pathname.startsWith("/api")) {
      return toWebResponse(
        jsonResponse(404, {
          error: {
            code: "not_found",
            message: "API route not implemented yet",
            method,
            path: pathname,
          },
        }),
      );
    }

    return toWebResponse(notFoundResponse());
  };
};

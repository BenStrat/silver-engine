import { createServer, type IncomingMessage } from "node:http";

import { createApiRequestListener, type ApiRouteHandler } from "./http/server.js";
import { readJsonBody } from "./http/request.js";
import { jsonResponse, methodNotAllowedResponse, type HttpResponse } from "./http/response.js";
import { createTriageRepository, RepositoryError, type RequestContext, type TriageRepository } from "./data/triageRepository.js";
import type { ApiRepository } from "./lib/repository.js";
import { getCaseRoute, listCasesRoute, createReportRoute } from "./routes/index.js";

export type StartApiServerOptions = {
  host?: string;
  port?: number;
  apiHandler?: ApiRouteHandler;
};

const getHeader = (request: IncomingMessage, name: string) => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const getRequestContext = (
  request: IncomingMessage,
  requireUserId = false,
): RequestContext | HttpResponse => {
  const organizationId = getHeader(request, "x-organization-id");

  if (!organizationId) {
    return jsonResponse(401, {
      error: {
        code: "missing_organization",
        message: "The x-organization-id header is required.",
      },
    });
  }

  const userId = getHeader(request, "x-user-id");

  if (requireUserId && !userId) {
    return jsonResponse(401, {
      error: {
        code: "missing_user",
        message: "The x-user-id header is required.",
      },
    });
  }

  return {
    organizationId,
    userId,
  };
};

const isHttpResponse = (value: RequestContext | HttpResponse): value is HttpResponse =>
  "status" in value;

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

const toJsonHttpResponse = (result: { status: number; body: unknown }) =>
  jsonResponse(result.status, result.body);

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

export const createDefaultApiHandler = (repository?: TriageRepository): ApiRouteHandler => {
  let resolvedRepository = repository;

  const getRepository = () => {
    resolvedRepository ??= createTriageRepository();
    return resolvedRepository;
  };

  return async ({ method, pathname, request, url }) => {
    if (method === "GET" && pathname === "/api") {
      return jsonResponse(200, {
        ok: true,
        routes: ["/health", "POST /api/reports", "GET /api/cases", "GET /api/cases/:caseId"],
      });
    }

    const routeContext = getRequestContext(request, method === "POST");
    if (isHttpResponse(routeContext)) {
      return routeContext;
    }

    try {
      if (pathname === "/api/reports") {
        if (method !== "POST") {
          return methodNotAllowedResponse(["POST"]);
        }

        return toJsonHttpResponse(
          await createReportRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { body: await readJsonBody(request) },
          ),
        );
      }

      if (pathname === "/api/cases") {
        if (method !== "GET") {
          return methodNotAllowedResponse(["GET"]);
        }

        return toJsonHttpResponse(
          await listCasesRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { query: toQueryRecord(url) },
          ),
        );
      }

      const caseMatch = /^\/api\/cases\/([^/]+)$/.exec(pathname);
      if (caseMatch) {
        if (method !== "GET") {
          return methodNotAllowedResponse(["GET"]);
        }

        return toJsonHttpResponse(
          await getCaseRoute(
            { repository: createRouteRepository(getRepository(), routeContext) },
            { params: { caseId: decodeURIComponent(caseMatch[1]) } },
          ),
        );
      }
    } catch (error) {
      return handleApplicationError(error);
    }

    return jsonResponse(404, {
      error: {
        code: "not_found",
        message: "API route not implemented yet",
        method,
        path: pathname,
      },
    });
  };
};

export const startApiServer = (options: StartApiServerOptions = {}) => {
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const listener = createApiRequestListener({
    apiHandler: options.apiHandler ?? createDefaultApiHandler(),
  });

  const server = createServer((request, response) => {
    void listener(request, response);
  });

  server.listen(port, host, () => {
    process.stdout.write(`@silver/api listening on http://${host}:${port}\n`);
  });

  return server;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startApiServer();
}

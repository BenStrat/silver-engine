import type { IncomingMessage, ServerResponse } from "node:http";

import { methodNotAllowedResponse, notFoundResponse, type HttpResponse } from "./response.js";
import { getRequestUrl } from "./request.js";

export type ApiRouteContext = {
  method: string;
  pathname: string;
  url: URL;
  request: IncomingMessage;
};

export type ApiRouteHandler = (context: ApiRouteContext) => Promise<HttpResponse> | HttpResponse;

export type ApiServerConfig = {
  apiHandler?: ApiRouteHandler;
};

const healthRoute = () =>
  ({
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: Buffer.from(
      JSON.stringify({
        ok: true,
        service: "@silver/api",
      }),
    ),
  }) satisfies HttpResponse;

const toNodeResponse = async (response: HttpResponse, outgoing: ServerResponse) => {
  outgoing.statusCode = response.status;

  if (response.headers) {
    for (const [key, value] of Object.entries(response.headers)) {
      if (value === undefined) {
        continue;
      }

      outgoing.setHeader(key, value);
    }
  }

  if (!response.body) {
    outgoing.end();
    return;
  }

  if (typeof response.body === "string") {
    outgoing.end(response.body);
    return;
  }

  outgoing.end(Buffer.from(response.body));
};

export const createApiRequestListener = (config: ApiServerConfig = {}) => {
  const apiHandler = config.apiHandler ?? (() => notFoundResponse("API route not implemented yet"));

  return async (request: IncomingMessage, response: ServerResponse) => {
    const url = getRequestUrl(request);

    if (url.pathname === "/health") {
      if (request.method !== "GET") {
        await toNodeResponse(methodNotAllowedResponse(["GET"]), response);
        return;
      }

      await toNodeResponse(healthRoute(), response);
      return;
    }

    if (url.pathname.startsWith("/api")) {
      const handledResponse = await apiHandler({
        method: request.method ?? "GET",
        pathname: url.pathname,
        url,
        request,
      });

      await toNodeResponse(handledResponse, response);
      return;
    }

    await toNodeResponse(notFoundResponse(), response);
  };
};

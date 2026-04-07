import { createServer, type IncomingMessage, type IncomingHttpHeaders, type ServerResponse } from "node:http";

import { createApiApp, type ApiApp } from "./app.js";

export type StartApiServerOptions = {
  host?: string;
  port?: number;
  app?: ApiApp;
};

const readRequestBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
};

const toHeaders = (headers: IncomingHttpHeaders) => {
  const requestHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        requestHeaders.append(key, item);
      }
      continue;
    }

    requestHeaders.set(key, value);
  }

  return requestHeaders;
};

const toWebRequest = async (request: IncomingMessage) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const body = method === "GET" || method === "HEAD" ? undefined : await readRequestBody(request);

  return new Request(url, {
    method,
    headers: toHeaders(request.headers),
    body,
  });
};

const writeResponse = async (response: Response, outgoing: ServerResponse) => {
  outgoing.statusCode = response.status;

  response.headers.forEach((value, key) => {
    outgoing.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  outgoing.end(body);
};

export const startApiServer = (options: StartApiServerOptions = {}) => {
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const app = options.app ?? createApiApp();

  const server = createServer((request, response) => {
    void (async () => {
      const webRequest = await toWebRequest(request);
      const webResponse = await app(webRequest);
      await writeResponse(webResponse, response);
    })().catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(
        JSON.stringify({
          error: {
            code: "internal_error",
            message: error instanceof Error ? error.message : "Unexpected API error.",
          },
        }),
      );
    });
  });

  server.listen(port, host, () => {
    process.stdout.write(`@silver/api listening on http://${host}:${port}\n`);
  });

  return server;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startApiServer();
}

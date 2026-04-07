import type { OutgoingHttpHeaders } from "node:http";

import type { HttpResponse } from "./response.js";

const toResponseHeaders = (headers: OutgoingHttpHeaders | undefined) => {
  const responseHeaders = new Headers();

  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      responseHeaders.set(key, value.join(", "));
      continue;
    }

    responseHeaders.set(key, String(value));
  }

  return responseHeaders;
};

export const readJsonBody = async <T = unknown>(request: Request): Promise<T> => {
  const rawBody = (await request.text()).trim();

  if (!rawBody) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
};

const toResponseBody = (body: HttpResponse["body"]) => {
  if (body === undefined || typeof body === "string") {
    return body;
  }

  return new Uint8Array(body).buffer;
};

export const toWebResponse = (response: HttpResponse) =>
  new Response(toResponseBody(response.body), {
    status: response.status,
    headers: toResponseHeaders(response.headers),
  });

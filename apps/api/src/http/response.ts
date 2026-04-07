import type { OutgoingHttpHeaders } from "node:http";

const jsonContentType = "application/json; charset=utf-8";

export type HttpResponse = {
  status: number;
  headers?: OutgoingHttpHeaders;
  body?: string | Uint8Array | undefined;
};

export const jsonResponse = (status: number, body: unknown, headers: OutgoingHttpHeaders = {}): HttpResponse => ({
  status,
  headers: {
    "content-type": jsonContentType,
    ...headers,
  },
  body: Buffer.from(JSON.stringify(body)),
});

export const textResponse = (status: number, body: string, headers: OutgoingHttpHeaders = {}): HttpResponse => ({
  status,
  headers: {
    "content-type": "text/plain; charset=utf-8",
    ...headers,
  },
  body,
});

export const notFoundResponse = (message = "Not found"): HttpResponse => jsonResponse(404, { error: { message } });

export const methodNotAllowedResponse = (allowedMethods: string[]): HttpResponse =>
  jsonResponse(
    405,
    {
      error: {
        message: "Method not allowed",
        allowedMethods,
      },
    },
    {
      allow: allowedMethods.join(", "),
    },
  );

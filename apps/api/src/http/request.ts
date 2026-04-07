import type { IncomingMessage } from "node:http";

export const getRequestUrl = (request: IncomingMessage) => {
  const host = request.headers.host ?? "localhost";
  return new URL(request.url ?? "/", `http://${host}`);
};

export const readJsonBody = async <T = unknown>(request: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
};

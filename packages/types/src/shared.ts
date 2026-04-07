import { z } from "zod";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const nonEmptyStringSchema = z.string().trim().min(1);
export const idSchema = nonEmptyStringSchema;
export const urlSchema = z.url();
export const isoDatetimeSchema = z.iso.datetime({ offset: true });

export const userRoleSchema = z.enum(["admin", "member"]);
export const deviceTypeSchema = z.enum(["desktop", "tablet", "mobile"]);
export const reportStatusSchema = z.enum(["new", "triaged", "attached"]);
export const reportSourceSchema = z.enum(["widget", "extension", "manual"]);
export const caseStatusSchema = z.enum([
  "new",
  "investigating",
  "needs_info",
  "confirmed",
  "duplicate",
  "wont_fix",
  "sent_to_linear",
]);
export const caseSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const attachmentKindSchema = z.enum(["screenshot", "image", "log"]);
export const aiDraftStatusSchema = z.enum(["pending", "completed", "failed"]);
export const linearProviderTypeSchema = z.enum(["oauth", "api_key"]);
export const journeyEventTypeSchema = z.enum([
  "navigation",
  "click",
  "input",
  "submit",
  "console_error",
  "network_error",
]);

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const stringArraySchema = z.array(nonEmptyStringSchema);

export type DeviceType = z.infer<typeof deviceTypeSchema>;
export type Json = z.infer<typeof jsonValueSchema>;

import prismaClientPackage from "@prisma/client";

export type { Prisma as PrismaNamespace, PrismaClient as PrismaClientType } from "@prisma/client";

export const Prisma = (prismaClientPackage as { Prisma: unknown }).Prisma;
export const PrismaClient = (prismaClientPackage as {
  PrismaClient: unknown;
}).PrismaClient;
export * from "./client.js";

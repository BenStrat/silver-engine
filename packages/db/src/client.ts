import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { Pool } from "pg";

const { PrismaClient } = prismaClientPackage as {
  PrismaClient: new (...args: any[]) => PrismaClientType;
};

const globalForPrisma = globalThis as typeof globalThis & {
  __silverDatabaseUrl?: string;
  __silverPgPool?: Pool;
  __silverPrismaClient?: PrismaClientType;
};

const readDatabaseUrl = () => {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  const databaseUrl = runtime.process?.env?.DATABASE_URL ?? globalForPrisma.__silverDatabaseUrl;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before creating a Prisma client.");
  }

  return databaseUrl;
};

const createPrismaResources = (databaseUrl = readDatabaseUrl()) => {
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  return { client, pool };
};

export const createPrismaClient = (databaseUrl = readDatabaseUrl()) => {
  globalForPrisma.__silverDatabaseUrl = databaseUrl;
  return createPrismaResources(databaseUrl).client;
};

export const getPrismaClient = () => {
  if (!globalForPrisma.__silverPrismaClient) {
    const databaseUrl = readDatabaseUrl();
    const { client, pool } = createPrismaResources(databaseUrl);

    globalForPrisma.__silverDatabaseUrl = databaseUrl;
    globalForPrisma.__silverPgPool = pool;
    globalForPrisma.__silverPrismaClient = client;
  }

  return globalForPrisma.__silverPrismaClient;
};

export const resetPrismaClient = async () => {
  if (!globalForPrisma.__silverPrismaClient) {
    return;
  }

  await globalForPrisma.__silverPrismaClient.$disconnect();
  if (globalForPrisma.__silverPgPool) {
    await globalForPrisma.__silverPgPool.end();
  }

  delete globalForPrisma.__silverDatabaseUrl;
  delete globalForPrisma.__silverPgPool;
  delete globalForPrisma.__silverPrismaClient;
};

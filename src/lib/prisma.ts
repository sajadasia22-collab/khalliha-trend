import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (prismaInstance) {
    return prismaInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Return a dummy object during build phase to prevent crashes
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return {} as PrismaClient;
    }
    throw new Error("DATABASE_URL is required before using the Prisma client.");
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  } else {
    prismaInstance = client;
  }

  return client;
}

// Export a lazy Proxy to prevent crashes on module evaluation (e.g. during build)
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrismaClient();
    return Reflect.get(client, prop, receiver);
  },
});

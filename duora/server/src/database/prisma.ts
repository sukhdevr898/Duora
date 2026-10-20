import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Single shared Prisma instance. In tests this module is mocked, so no live
// database connection is required for the unit/integration test suite.
export const prisma = new PrismaClient({
  log: env.isTest ? [] : ['warn', 'error'],
});

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

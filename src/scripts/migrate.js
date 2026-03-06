/**
 * Pre-migration script: clears old PostgreSQL-era migration history
 * so that prisma migrate deploy can apply the fresh SQLite baseline.
 * Safe to run on both fresh and existing databases.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.$executeRaw`DROP TABLE IF EXISTS _prisma_migrations`;
  console.log('Cleared old migration history');
} catch (e) {
  console.log('No existing migration history to clear (fresh database)');
} finally {
  await prisma.$disconnect();
}

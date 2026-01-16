import { PrismaClient } from '@prisma/client';
import { fixSequencesOnStartup } from './fix-sequences';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  sequencesChecked: boolean;
};

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Fix sequences on startup (runs once per process)
if (!globalForPrisma.sequencesChecked) {
  globalForPrisma.sequencesChecked = true;
  // Run async without blocking - fire and forget
  fixSequencesOnStartup(db).catch((err) => {
    console.error('[DB] Sequence fix error:', err);
  });
}

export default db;

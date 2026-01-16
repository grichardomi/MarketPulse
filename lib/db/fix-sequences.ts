/**
 * Auto-fix PostgreSQL sequences on startup
 *
 * Checks if any auto-increment sequences are out of sync with actual max IDs
 * and fixes them automatically. This prevents P2002 "Unique constraint failed on id" errors.
 */

import { PrismaClient } from '@prisma/client';

let hasRun = false;

/**
 * Get all tables that actually exist in the database and have id sequences
 */
async function getTablesWithSequences(prisma: PrismaClient): Promise<string[]> {
  const result = await prisma.$queryRawUnsafe<{ tablename: string }[]>(`
    SELECT t.tablename
    FROM pg_tables t
    INNER JOIN pg_sequences s ON s.sequencename = t.tablename || '_id_seq'
    WHERE t.schemaname = 'public'
      AND s.schemaname = 'public'
  `);
  return result.map((r) => r.tablename);
}

/**
 * Check and fix a single table's sequence if out of sync
 */
async function checkAndFixSequence(
  prisma: PrismaClient,
  tableName: string
): Promise<{ fixed: boolean; error?: string }> {
  try {
    // Get max ID in table
    const maxResult = await prisma.$queryRawUnsafe<{ max: number | null }[]>(
      `SELECT MAX(id) as max FROM "${tableName}"`
    );
    const maxId = maxResult[0]?.max;

    if (maxId === null) {
      // Table is empty, no fix needed
      return { fixed: false };
    }

    // Get current sequence value by querying the sequence directly
    // This returns last_value and is_called - the next ID will be:
    // - last_value if is_called = false
    // - last_value + 1 if is_called = true
    const seqResult = await prisma.$queryRawUnsafe<{ last_value: bigint; is_called: boolean }[]>(
      `SELECT last_value, is_called FROM "${tableName}_id_seq"`
    );

    if (!seqResult[0]) {
      return { fixed: false, error: 'Sequence not found' };
    }

    const lastValue = Number(seqResult[0].last_value);
    const isCalled = seqResult[0].is_called;
    // Calculate what the next ID would be
    const nextId = isCalled ? lastValue + 1 : lastValue;

    // Only fix if next ID would conflict with existing data
    if (nextId <= maxId) {
      const newNextId = maxId + 1;
      await prisma.$executeRawUnsafe(`
        SELECT setval('"${tableName}_id_seq"', ${newNextId}, false)
      `);
      console.log(`[DB] Fixed ${tableName} sequence: next was ${nextId}, max ID is ${maxId}, now ${newNextId}`);
      return { fixed: true };
    }

    return { fixed: false };
  } catch (error: any) {
    // Table might not exist or other issue - silently skip
    return { fixed: false, error: error.message };
  }
}

/**
 * Check and fix all sequences on startup
 * Only runs once per process
 */
export async function fixSequencesOnStartup(prisma: PrismaClient): Promise<void> {
  if (hasRun) {
    return;
  }
  hasRun = true;

  try {
    // Only check tables that actually exist in the database
    const tables = await getTablesWithSequences(prisma);
    let fixedCount = 0;

    for (const table of tables) {
      const result = await checkAndFixSequence(prisma, table);
      if (result.fixed) {
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      console.log(`[DB] Fixed ${fixedCount} out-of-sync sequences`);
    }
  } catch (error) {
    console.error('[DB] Error checking sequences:', error);
    // Don't throw - this shouldn't prevent app startup
  }
}

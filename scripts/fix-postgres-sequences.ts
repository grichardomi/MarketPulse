/**
 * Fix PostgreSQL Sequence Synchronization Issues
 *
 * This script fixes the P2002 "Unique constraint failed on the fields: (id)" error
 * that occurs when PostgreSQL auto-increment sequences get out of sync with actual data.
 *
 * This can happen after:
 * - Bulk data imports
 * - Database restoration from backups
 * - Manual ID insertions
 *
 * Usage:
 *   npx ts-node scripts/fix-postgres-sequences.ts
 *   # or in production
 *   npx tsx scripts/fix-postgres-sequences.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SequenceInfo {
  table: string;
  column: string;
  sequence?: string;
}

// Tables with auto-increment id columns that might need fixing
const TABLES_WITH_SEQUENCES: SequenceInfo[] = [
  { table: 'Competitor', column: 'id' },
  { table: 'CompetitorDiscoveryCache', column: 'id' },
  { table: 'DiscoveryEvent', column: 'id' },
  { table: 'Alert', column: 'id' },
  { table: 'Business', column: 'id' },
  { table: 'User', column: 'id' },
  { table: 'Subscription', column: 'id' },
  { table: 'EmailQueue', column: 'id' },
  { table: 'CrawlQueue', column: 'id' },
  { table: 'PriceSnapshot', column: 'id' },
];

async function getMaxId(tableName: string): Promise<number | null> {
  try {
    const result = await prisma.$queryRawUnsafe<{ max: number | null }[]>(
      `SELECT MAX(id) as max FROM "${tableName}"`
    );
    return result[0]?.max ?? null;
  } catch (error) {
    console.error(`  Error getting max ID for ${tableName}:`, error);
    return null;
  }
}

async function getCurrentSequenceValue(tableName: string): Promise<number | null> {
  try {
    const result = await prisma.$queryRawUnsafe<{ last_value: bigint }[]>(
      `SELECT last_value FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '${tableName}_id_seq'`
    );
    return result[0] ? Number(result[0].last_value) : null;
  } catch (error) {
    // Sequence might have a different name
    return null;
  }
}

async function fixSequence(tableName: string): Promise<boolean> {
  try {
    const maxId = await getMaxId(tableName);
    const currentSeq = await getCurrentSequenceValue(tableName);

    console.log(`  Table: ${tableName}`);
    console.log(`    Max ID in table: ${maxId ?? 'none'}`);
    console.log(`    Current sequence value: ${currentSeq ?? 'unknown'}`);

    if (maxId === null) {
      console.log(`    Skipping - table is empty`);
      return true;
    }

    // Reset the sequence to max(id) + 1
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
        false
      )
    `);

    const newSeq = await getCurrentSequenceValue(tableName);
    console.log(`    New sequence value: ${newSeq}`);
    console.log(`    ✓ Fixed`);

    return true;
  } catch (error: any) {
    console.error(`    ✗ Error fixing ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('PostgreSQL Sequence Fix Script');
  console.log('==============================\n');

  console.log('Checking and fixing sequences for tables with auto-increment IDs...\n');

  let fixedCount = 0;
  let errorCount = 0;

  for (const { table } of TABLES_WITH_SEQUENCES) {
    const success = await fixSequence(table);
    if (success) {
      fixedCount++;
    } else {
      errorCount++;
    }
    console.log('');
  }

  console.log('==============================');
  console.log(`Summary: ${fixedCount} tables fixed, ${errorCount} errors`);

  if (errorCount > 0) {
    console.log('\nSome tables could not be fixed. This might be because:');
    console.log('- The table does not exist');
    console.log('- The sequence has a different naming convention');
    console.log('- Database connection issues');
  }

  console.log('\nDone!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

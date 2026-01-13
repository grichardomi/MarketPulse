#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const DEV_URL = 'postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/railway';
const PROD_URL = 'postgresql://postgres:DvrzrWDeAoDfgcAoJkSrvTNubhdymKSe@caboose.proxy.rlwy.net:14069/railway';

// Create two Prisma clients
const devDb = new PrismaClient({
  datasources: { db: { url: DEV_URL } }
});

const prodDb = new PrismaClient({
  datasources: { db: { url: PROD_URL } }
});

async function copyData() {
  console.log('🔄 Starting database migration from development to production...\n');

  try {
    await devDb.$connect();
    await prodDb.$connect();
    console.log('✅ Connected to both databases\n');

    // Get all tables from dev
    const tables = await devDb.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('📋 Tables found:', tables.map(t => t.tablename).join(', '));
    console.log('');

    // Clear production data (in reverse order to handle foreign keys)
    console.log('🗑️  Clearing production database...');
    for (const table of tables.reverse()) {
      const tableName = table.tablename;
      if (tableName.startsWith('_')) continue; // Skip Prisma migration tables

      console.log(`  Truncating ${tableName}...`);
      await prodDb.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
    console.log('✅ Production database cleared\n');

    // Copy data table by table in correct order (respect foreign keys)
    const tableOrder = [
      'User',
      'Account',
      'Session',
      'VerificationToken',
      'Business',
      'NotificationPreferences',
      'PushSubscription',
      'Subscription',
      'Payment',
      'Competitor',
      'CompetitorDiscoveryCache',
      'Alert',
      'PriceSnapshot',
      'CrawlQueue',
      'EmailQueue',
      'SmsQueue',
      'ExtractionCache',
      'DiscoveryEvent',
      'WebhookDestination',
      'WebhookEvent',
      'WebhookDelivery',
      'RateLimit',
      '_prisma_migrations'
    ];

    console.log('📦 Copying data to production...');

    for (const tableName of tableOrder) {
      if (tableName.startsWith('_')) continue; // Skip Prisma migration tables

      // Get count from dev
      const countResult = await devDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);
      const count = parseInt(countResult[0].count);

      if (count === 0) {
        console.log(`  Skipping ${tableName} (empty)`);
        continue;
      }

      console.log(`  Copying ${tableName} (${count} rows)...`);

      // Get all data from dev
      const data = await devDb.$queryRawUnsafe(`SELECT * FROM "${tableName}";`);

      // Insert into production
      for (const row of data) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(', ');

        // Convert values to proper types (handle JSONB)
        const processedValues = Object.values(row).map(v => {
          if (Array.isArray(v) || (typeof v === 'object' && v !== null && !(v instanceof Date))) {
            return JSON.stringify(v);
          }
          return v;
        });

        const values = processedValues.map((v, i) => `$${i + 1}`).join(', ');

        await prodDb.$executeRawUnsafe(
          `INSERT INTO "${tableName}" (${columns}) VALUES (${values});`,
          ...processedValues
        );
      }

      console.log(`  ✅ Copied ${count} rows to ${tableName}`);
    }

    console.log('\n🔍 Verifying migration...');

    // Verify counts
    for (const table of tables) {
      const tableName = table.tablename;
      if (tableName.startsWith('_')) continue;

      const devCount = await devDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);
      const prodCount = await prodDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);

      const devNum = parseInt(devCount[0].count);
      const prodNum = parseInt(prodCount[0].count);

      if (devNum !== prodNum) {
        console.log(`  ⚠️  ${tableName}: Dev=${devNum}, Prod=${prodNum} (MISMATCH)`);
      } else if (devNum > 0) {
        console.log(`  ✅ ${tableName}: ${prodNum} rows`);
      }
    }

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await devDb.$disconnect();
    await prodDb.$disconnect();
  }
}

copyData();

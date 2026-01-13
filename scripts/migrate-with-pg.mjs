#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const DEV_URL = 'postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/railway';
const PROD_URL = 'postgresql://postgres:DvrzrWDeAoDfgcAoJkSrvTNubhdymKSe@caboose.proxy.rlwy.net:14069/railway';

async function migrate() {
  const devClient = new Client({ connectionString: DEV_URL });
  const prodClient = new Client({ connectionString: PROD_URL });

  try {
    console.log('🔄 Starting database migration from development to production...\n');

    await devClient.connect();
    await prodClient.connect();
    console.log('✅ Connected to both databases\n');

    // Table order (respecting foreign keys)
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
      'RateLimit'
    ];

    // Clear production database
    console.log('🗑️  Clearing production database...');
    for (const table of [...tableOrder].reverse()) {
      await prodClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`  Cleared ${table}`);
    }
    console.log('✅ Production database cleared\n');

    // Copy data
    console.log('📦 Copying data to production...');
    for (const table of tableOrder) {
      // Get count
      const countResult = await devClient.query(`SELECT COUNT(*) as count FROM "${table}";`);
      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        console.log(`  Skipping ${table} (empty)`);
        continue;
      }

      console.log(`  Copying ${table} (${count} rows)...`);

      // Get all data
      const data = await devClient.query(`SELECT * FROM "${table}";`);

      // Insert each row
      for (const row of data.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(v => {
          // Convert objects/arrays to JSON strings for JSON/JSONB columns
          if (v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Buffer)) {
            return JSON.stringify(v);
          }
          return v;
        });
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.map(c => `"${c}"`).join(', ');

        await prodClient.query(
          `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders});`,
          values
        );
      }

      console.log(`  ✅ Copied ${count} rows`);
    }

    // Verify
    console.log('\n🔍 Verifying migration...');
    const verification = await prodClient.query(`
      SELECT
        (SELECT COUNT(*) FROM "User") as users,
        (SELECT COUNT(*) FROM "Business") as businesses,
        (SELECT COUNT(*) FROM "Competitor") as competitors,
        (SELECT COUNT(*) FROM "Alert") as alerts;
    `);

    console.log('Production database counts:');
    console.log(`  Users: ${verification.rows[0].users}`);
    console.log(`  Businesses: ${verification.rows[0].businesses}`);
    console.log(`  Competitors: ${verification.rows[0].competitors}`);
    console.log(`  Alerts: ${verification.rows[0].alerts}`);

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

migrate();

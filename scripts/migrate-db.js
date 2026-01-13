#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DEV_URL = 'postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/railway';
const PROD_URL = 'postgresql://postgres:DvrzrWDeAoDfgcAoJkSrvTNubhdymKSe@postgres.railway.internal:5432/railway';

async function migrate() {
  console.log('🔄 Starting database migration from development to production...\n');

  try {
    // Step 1: Backup development database
    console.log('📦 Step 1: Backing up development database...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = `dev_backup_${timestamp}.sql`;

    await execAsync(`npx pg_dump "${DEV_URL}" --clean --if-exists --no-owner --no-privileges > ${backupFile}`, {
      cwd: __dirname
    });
    console.log(`✅ Development database backed up to: ${backupFile}\n`);

    // Step 2: Restore to production
    console.log('📥 Step 2: Restoring to production database...');
    await execAsync(`npx psql "${PROD_URL}" < ${backupFile}`, {
      cwd: __dirname
    });
    console.log('✅ Data restored to production database\n');

    // Step 3: Verify
    console.log('🔍 Step 3: Verifying migration...');
    const { stdout } = await execAsync(`npx psql "${PROD_URL}" -c "\\dt"`, {
      cwd: __dirname
    });
    console.log('Tables in production database:');
    console.log(stdout);

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error.stderr || error.stdout);
    process.exit(1);
  }
}

migrate();

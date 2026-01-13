#!/bin/bash

# Database URLs
DEV_URL="postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/railway"
PROD_URL="postgresql://postgres:DvrzrWDeAoDfgcAoJkSrvTNubhdymKSe@caboose.proxy.rlwy.net:14069/railway"

echo "🔄 Starting database migration from development to production..."
echo ""

# Backup file
BACKUP_FILE="dev_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Step 1: Dumping development database..."
docker run --rm postgres:16 pg_dump "$DEV_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Development database backed up to: $BACKUP_FILE"
  echo ""
else
  echo "❌ Failed to backup development database"
  exit 1
fi

echo "📥 Step 2: Restoring to production database..."
docker run --rm -i postgres:16 psql "$PROD_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Data restored to production database"
  echo ""
else
  echo "❌ Failed to restore to production database"
  exit 1
fi

echo "🔍 Step 3: Verifying migration..."
docker run --rm postgres:16 psql "$PROD_URL" -c "SELECT
  (SELECT COUNT(*) FROM \"User\") as users,
  (SELECT COUNT(*) FROM \"Business\") as businesses,
  (SELECT COUNT(*) FROM \"Competitor\") as competitors,
  (SELECT COUNT(*) FROM \"Alert\") as alerts;"

echo ""
echo "✨ Migration completed successfully!"
echo "Backup file: $BACKUP_FILE"

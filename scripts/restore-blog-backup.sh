#!/bin/bash

# Restore blog database backup
# Usage: bash scripts/restore-blog-backup.sh

BACKUP_FILE="/home/guy/MarketPulse/8-2-1stkare"
DB_URL="postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/blog"

echo "🔄 Restoring blog database from backup..."
echo "Backup file: $BACKUP_FILE (231 MB)"
echo ""

# Use Docker to run pg_restore
docker run --rm -v /home/guy/MarketPulse:/backup postgres:16 \
  pg_restore \
  -d "$DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  /backup/8-2-1stkare

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Blog database restored successfully!"
else
  echo ""
  echo "❌ Restore failed. Check errors above."
  exit 1
fi

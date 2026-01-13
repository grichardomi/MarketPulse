#!/bin/bash
echo "🔄 Restoring correct blog database from 1stkare_blog_7_27 (952 KB)..."
echo ""

sudo docker run --rm -v /home/guy/MarketPulse:/backup postgres:16 pg_restore \
  -d "postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/blog" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  /backup/1stkare_blog_7_27

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Blog database restored successfully!"
else
  echo ""
  echo "⚠️  Restore completed with some warnings (check above)"
fi

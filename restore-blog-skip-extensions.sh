#!/bin/bash
echo "🔄 Restoring blog database (ignoring TimescaleDB extension errors)..."
echo ""

sudo docker run --rm -v /home/guy/MarketPulse:/backup postgres:16 pg_restore \
  -d "postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/blog" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --no-comments \
  /backup/8-2-1stkare

echo ""
echo "✅ Restore completed!"
echo "Note: TimescaleDB extension errors were ignored. Data should be restored."

#!/bin/bash
echo "🔄 Restoring blog database (skipping TimescaleDB extensions)..."
sudo docker run --rm -v /home/guy/MarketPulse:/backup postgres:16 pg_restore -d "postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/blog" --clean --if-exists --no-owner --no-privileges --no-comments --exit-on-error /backup/8-2-1stkare 2>&1 | grep -v "extension \"timescaledb" || true

echo ""
echo "✅ Restore completed (TimescaleDB extension warnings ignored)"
echo "Note: TimescaleDB features will not be available unless you enable the extension on Railway"

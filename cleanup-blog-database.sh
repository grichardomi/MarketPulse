#!/bin/bash
echo "🗑️  Cleaning up blog database (removing all tables and data)..."
echo ""

# Drop and recreate the blog database
sudo docker run --rm postgres:16 psql \
  "postgresql://postgres:ciSKlvvohOuTavfTlVilAfmFeBZnKwXF@tramway.proxy.rlwy.net:39540/postgres" \
  -c "DROP DATABASE IF EXISTS blog;" \
  -c "CREATE DATABASE blog;"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Blog database cleaned successfully!"
  echo "The database is now empty and ready for the correct restore."
else
  echo ""
  echo "❌ Cleanup failed. See errors above."
  exit 1
fi

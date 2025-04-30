#!/bin/bash

# Script to set up and test PostgreSQL features
echo "=== Setting Up PostgreSQL Features ==="

# Run migrations to create triggers and stored procedures
echo "1. Running database migrations..."
npx tsx scripts/run-migrations.ts

# Set up PostgreSQL features
echo "2. Setting up advanced PostgreSQL features..."
npx tsx scripts/setup-postgresql-features.ts

# Test PostgreSQL features
echo "3. Testing PostgreSQL features..."
npx tsx scripts/test-postgresql-features.ts

echo "=== PostgreSQL Features Setup Complete ==="
echo "You can now use transactions, triggers, and stored procedures in your application."
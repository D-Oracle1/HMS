#!/usr/bin/env node

/**
 * Database Setup Script
 * Runs the database-setup.sql file against your Supabase database
 *
 * Usage: node setup-database.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Your Supabase connection details
const DB_HOST = 'db.mnjqupwgvxvckouhzqhw.supabase.co';
const DB_USER = 'postgres';
const DB_PASSWORD = 'VicsonDigitals';
const DB_NAME = 'postgres';
const DB_PORT = '5432';

const SQL_FILE = path.join(__dirname, 'database-setup.sql');

console.log('🗄️  Setting up HMS Database...\n');

try {
  // Check if SQL file exists
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ Error: database-setup.sql not found!');
    process.exit(1);
  }

  console.log('📂 SQL file found: database-setup.sql');
  console.log('🔗 Connecting to Supabase...');

  // Build connection string
  const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  // Execute SQL file
  const command = `psql "${connectionString}" -f "${SQL_FILE}"`;

  console.log('⚙️  Executing SQL script...\n');

  const output = execSync(command, {
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  console.log(output);
  console.log('\n✅ Database setup complete!');
  console.log('\n📊 Your database now has:');
  console.log('   - 5 tables (Tenant, Hotel, Room, User, Booking)');
  console.log('   - 1 demo tenant');
  console.log('   - 1 demo hotel');
  console.log('   - 6 rooms');
  console.log('   - 5 users');
  console.log('   - 3 sample bookings');
  console.log('\n🔐 Demo login credentials:');
  console.log('   superadmin@hms.com / demo123');
  console.log('   admin@demo.com / demo123');
  console.log('   user@demo.com / demo123');

} catch (error) {
  console.error('\n❌ Error setting up database:');
  console.error(error.message);
  console.error('\nAlternative: Copy database-setup.sql contents and run in Supabase SQL Editor');
  console.error('URL: https://supabase.com/dashboard/project/mnjqupwgvxvckouhzqhw/sql/new');
  process.exit(1);
}

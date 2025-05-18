#!/usr/bin/env node

// This script applies the SQL migrations directly to Supabase
// Usage: node apply_migrations_direct.js

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
// const { createClient } = require("@supabase/supabase-js"); // No longer needed for SQL execution
const { Client } = require("pg"); // Import pg Client

// Validate environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL || // Used to derive host
  !process.env.SUPABASE_SERVICE_ROLE_KEY || // Kept for potential other uses, though not for pg connection
  !process.env.SUPABASE_DB_PASSWORD // Add check for DB password
) {
  console.error(
    "Error: Missing required environment variables NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_DB_PASSWORD"
  );
  console.error("Make sure these are set in your .env.local file");
  process.exit(1);
}

// Construct PostgreSQL connection URI
// Example: postgresql://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-PROJECT-REF].db.supabase.co:5432/postgres
// We need to extract the host from NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const dbHost = supabaseUrl.hostname
  .replace("supabase.co", "db.supabase.co")
  .replace(".supabase.co", ".db.supabase.co"); // Construct the db host

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${dbHost}:5432/postgres`;

const pgClient = new Client({ connectionString });

// Migration file order
const migrationFiles = [
  "01_core_tables.sql",
  "02_customization_settings.sql",
  "03_row_level_security.sql",
  "04_analytics_functions.sql",
];

// Apply migrations sequentially
async function applyMigrations() {
  console.log("Starting database migrations...");
  await pgClient.connect();
  console.log("Connected to database.");

  for (const filename of migrationFiles) {
    try {
      console.log(`Applying migration: ${filename}`);
      const filePath = path.join(__dirname, filename);
      const sql = fs.readFileSync(filePath, "utf8");

      // Execute the SQL query directly using pg
      await pgClient.query(sql);

      console.log(`✅ Successfully applied ${filename}`);
    } catch (error) {
      console.error(`❌ Error applying migration ${filename}:`, error);
      // Optional: Decide if you want to exit on first error or try to continue
      await pgClient.end();
      process.exit(1);
    }
  }
  await pgClient.end();
  console.log("Disconnected from database.");
  console.log("🎉 All migrations successfully applied!");
}

// Run migrations
async function run() {
  try {
    await applyMigrations();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1); // Ensure process exits if applyMigrations itself throws an unhandled error
  }
}

run();

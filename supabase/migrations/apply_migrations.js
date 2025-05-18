#!/usr/bin/env node

// This script applies the SQL migrations to Supabase
// Usage: node apply_migrations.js

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Validate environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Error: Missing required environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error("Make sure these are set in your .env.local file");
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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

  for (const filename of migrationFiles) {
    try {
      console.log(`Applying migration: ${filename}`);
      const filePath = path.join(__dirname, filename);
      const sql = fs.readFileSync(filePath, "utf8");

      // Execute the SQL query
      const { error } = await supabase.rpc("pgmigrate", {
        query: sql,
      });

      if (error) throw error;

      console.log(`✅ Successfully applied ${filename}`);
    } catch (error) {
      console.error(`❌ Error applying migration ${filename}:`, error);
      process.exit(1);
    }
  }

  console.log("🎉 All migrations successfully applied!");
}

// Create a stored procedure to run SQL directly (will be used just once)
async function createProcedure() {
  try {
    console.log("Creating pgmigrate procedure...");
    const { error } = await supabase.rpc("admin.create_pg_function");

    if (error) {
      // If the function already exists, this is fine
      if (error.message.includes("already exists")) {
        console.log("pgmigrate procedure already exists, continuing...");
        return;
      }
      throw error;
    }

    console.log("✅ pgmigrate procedure created");
  } catch (error) {
    // Try creating the function manually if it doesn't exist
    try {
      const { error: createError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION pgmigrate(query text) RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE query;
        END;
        $$;
      `);

      if (createError) throw createError;
      console.log("✅ pgmigrate procedure created manually");
    } catch (manualError) {
      console.error("❌ Error creating pgmigrate procedure:", manualError);
      process.exit(1);
    }
  }
}

// Run migrations
async function run() {
  try {
    await createProcedure();
    await applyMigrations();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();

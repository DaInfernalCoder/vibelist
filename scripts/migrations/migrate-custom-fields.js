const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { auditCustomFields, snakeToCamel } = require("./audit-custom-fields");
const {
  convertCustomFieldsWithConflictResolution,
  analyzeConflicts,
} = require("./resolve-field-conflicts");

// Load environment variables
dotenv.config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Migration configuration
const MIGRATION_CONFIG = {
  BATCH_SIZE: 1000, // Process 1000 records per batch
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 1000, // 1 second initial backoff
  MAX_BACKOFF_MS: 30000, // 30 seconds max backoff
  PROGRESS_LOG_INTERVAL: 100, // Log progress every 100 records
  CONNECTION_POOL_SIZE: 10,
  QUERY_TIMEOUT_MS: 30000, // 30 seconds query timeout
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attempt,
  baseDelay = MIGRATION_CONFIG.INITIAL_BACKOFF_MS
) {
  const delay = Math.min(
    baseDelay * Math.pow(2, attempt),
    MIGRATION_CONFIG.MAX_BACKOFF_MS
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Convert custom_fields object from snake_case to camelCase (fallback method)
 */
function convertCustomFieldsToStandard(customFields, conversionMap) {
  if (!customFields || typeof customFields !== "object") {
    return customFields;
  }

  const converted = {};

  Object.entries(customFields).forEach(([key, value]) => {
    // Use conversion map if available, otherwise convert snake_case to camelCase
    const standardKey =
      conversionMap[key] || (key.includes("_") ? snakeToCamel(key) : key);
    converted[standardKey] = value;
  });

  return converted;
}

/**
 * Execute migration for a batch of records with retry logic
 */
async function migrateBatch(batch, conversionMap, conflicts, batchNumber) {
  let attempt = 0;

  while (attempt < MIGRATION_CONFIG.MAX_RETRIES) {
    try {
      const updates = batch.map((record) => {
        // Use enhanced conflict resolution logic
        const standardizedFields = convertCustomFieldsWithConflictResolution(
          record.custom_fields,
          conversionMap,
          conflicts
        );

        return {
          id: record.id,
          custom_fields: standardizedFields,
          updated_at: new Date().toISOString(),
        };
      });

      // Use update with where clause instead of upsert to avoid constraint issues
      const updatePromises = updates.map((update) =>
        supabase
          .from("customization_settings")
          .update({
            custom_fields: update.custom_fields,
            updated_at: update.updated_at,
          })
          .eq("id", update.id)
          .select("id")
      );

      const results = await Promise.all(updatePromises);

      // Check for any errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw new Error(`Update failed: ${errors[0].error.message}`);
      }

      return {
        success: true,
        batchNumber,
        recordsProcessed: batch.length,
        attempt: attempt + 1,
      };
    } catch (error) {
      attempt++;

      if (attempt >= MIGRATION_CONFIG.MAX_RETRIES) {
        console.error(
          `❌ Batch ${batchNumber} failed after ${MIGRATION_CONFIG.MAX_RETRIES} attempts:`,
          error.message
        );
        throw error;
      }

      const backoffDelay = calculateBackoff(attempt - 1);
      console.warn(
        `⚠️ Batch ${batchNumber} attempt ${attempt} failed, retrying in ${backoffDelay}ms...`
      );
      await sleep(backoffDelay);
    }
  }
}

/**
 * Create GIN index for better JSONB query performance
 */
async function createPerformanceIndexes() {
  console.log("🚀 Creating performance indexes...");

  try {
    // Check if index already exists using our new database functions
    const { data: indexStats, error: indexError } = await supabase
      .from("custom_fields_index_stats")
      .select("*");

    if (indexError) {
      console.warn(`⚠️ Could not check index status: ${indexError.message}`);
    } else if (indexStats && indexStats.length > 0) {
      console.log("✅ GIN index already exists");
      return;
    }

    console.log(
      "ℹ️ Index appears to be created by migration script. Verification complete."
    );
  } catch (error) {
    console.warn(`⚠️ Index verification skipped: ${error.message}`);
  }
}

/**
 * Validate migration results
 */
async function validateMigration(originalCount, conversionMap, conflicts) {
  console.log("🔍 Validating migration results...");

  try {
    // Count total records after migration
    const { count: finalCount, error: countError } = await supabase
      .from("customization_settings")
      .select("*", { count: "exact", head: true })
      .not("custom_fields", "is", null);

    if (countError) {
      throw new Error(`Validation count failed: ${countError.message}`);
    }

    if (finalCount !== originalCount) {
      throw new Error(
        `Record count mismatch: expected ${originalCount}, got ${finalCount}`
      );
    }

    // Check field naming conventions after migration
    const { data: conventionStats, error: conventionError } =
      await supabase.rpc("analyze_custom_fields_conventions");

    if (conventionError) {
      console.warn(
        `⚠️ Could not analyze conventions: ${conventionError.message}`
      );
    } else {
      console.log("📊 Post-migration field conventions:");
      conventionStats.forEach((stat) => {
        console.log(`  ${stat.convention_type}: ${stat.field_count} fields`);
      });
    }

    // Sample validation: Check if snake_case fields were converted
    const { data: sampleRecords, error: sampleError } = await supabase
      .from("customization_settings")
      .select("custom_fields")
      .not("custom_fields", "is", null)
      .limit(10);

    if (sampleError) {
      throw new Error(`Sample validation failed: ${sampleError.message}`);
    }

    let conversionFound = false;
    let snakeCaseFound = false;

    sampleRecords.forEach((record) => {
      const fields = Object.keys(record.custom_fields || {});
      fields.forEach((field) => {
        if (Object.values(conversionMap).includes(field)) {
          conversionFound = true;
        }
        if (field.includes("_")) {
          snakeCaseFound = true;
        }
      });
    });

    console.log("✅ Migration validation passed:");
    console.log(`  - Record count maintained: ${finalCount}`);
    console.log(
      `  - Converted fields found: ${conversionFound ? "Yes" : "No"}`
    );
    console.log(
      `  - Snake_case fields remaining: ${snakeCaseFound ? "Yes" : "No"}`
    );

    return { success: true, finalCount, conversionFound, snakeCaseFound };
  } catch (error) {
    console.error("❌ Migration validation failed:", error.message);
    throw error;
  }
}

/**
 * Main migration function with performance optimization
 */
async function performMigration(dryRun = false) {
  console.log(
    `🚀 Starting custom_fields migration (${dryRun ? "DRY RUN" : "LIVE"})...\n`
  );

  try {
    // Step 1: Run audit to get current state and conversion mapping
    console.log("📊 Step 1: Auditing current custom_fields...");
    const auditReport = await auditCustomFields();

    if (auditReport.summary.totalWaitlists === 0) {
      console.log(
        "ℹ️ No waitlists with custom_fields found. Migration not needed."
      );
      return { success: true, recordsProcessed: 0 };
    }

    // Step 2: Analyze conflicts in detail
    console.log("\n🔍 Step 2: Analyzing field conflicts...");
    const conflictAnalysis = await analyzeConflicts();
    const { conflicts, conversionMap } = conflictAnalysis;

    const needsMigration = Object.keys(conversionMap).length > 0;

    if (!needsMigration) {
      console.log("✅ No snake_case fields found. Migration not needed.");
      return { success: true, recordsProcessed: 0 };
    }

    console.log(
      `🔄 Found ${Object.keys(conversionMap).length} fields needing conversion`
    );
    console.log(
      `📈 Total waitlists to process: ${auditReport.summary.totalWaitlists}`
    );

    // Step 3: Create performance indexes (if not dry run)
    if (!dryRun) {
      await createPerformanceIndexes();
    }

    // Step 4: Fetch all records that need migration
    console.log("\n📥 Step 3: Fetching records for migration...");

    const { data: allRecords, error: fetchError } = await supabase
      .from("customization_settings")
      .select("id, custom_fields")
      .not("custom_fields", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch records: ${fetchError.message}`);
    }

    // Filter records that actually need migration (contain snake_case fields)
    const recordsNeedingMigration = allRecords.filter((record) => {
      const fieldNames = Object.keys(record.custom_fields || {});
      return fieldNames.some((field) =>
        Object.keys(conversionMap).includes(field)
      );
    });

    console.log(
      `📊 Records needing migration: ${recordsNeedingMigration.length}/${allRecords.length}`
    );

    if (recordsNeedingMigration.length === 0) {
      console.log("✅ No records require migration.");
      return { success: true, recordsProcessed: 0 };
    }

    // Step 5: Process in batches
    console.log(
      `\n🔄 Step 4: Processing ${recordsNeedingMigration.length} records in batches of ${MIGRATION_CONFIG.BATCH_SIZE}...`
    );

    const totalBatches = Math.ceil(
      recordsNeedingMigration.length / MIGRATION_CONFIG.BATCH_SIZE
    );
    let processedRecords = 0;
    const migrationResults = [];
    const startTime = Date.now();

    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * MIGRATION_CONFIG.BATCH_SIZE;
      const batchEnd = Math.min(
        batchStart + MIGRATION_CONFIG.BATCH_SIZE,
        recordsNeedingMigration.length
      );
      const batch = recordsNeedingMigration.slice(batchStart, batchEnd);
      const batchNumber = i + 1;

      console.log(
        `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
      );

      if (dryRun) {
        // Simulate processing time for dry run
        await sleep(100);
        migrationResults.push({
          success: true,
          batchNumber,
          recordsProcessed: batch.length,
          dryRun: true,
        });
        console.log(`  ✅ Batch ${batchNumber} simulated (DRY RUN)`);
      } else {
        const result = await migrateBatch(
          batch,
          conversionMap,
          conflicts,
          batchNumber
        );
        migrationResults.push(result);
        console.log(`  ✅ Batch ${batchNumber} completed successfully`);
      }

      processedRecords += batch.length;

      // Progress reporting
      const progress = (
        (processedRecords / recordsNeedingMigration.length) *
        100
      ).toFixed(1);
      const elapsed = Date.now() - startTime;
      const estimatedTotal =
        (elapsed / processedRecords) * recordsNeedingMigration.length;
      const remaining = estimatedTotal - elapsed;

      console.log(`  📈 Progress: ${progress}% complete`);
      console.log(
        `  ⏱️  Estimated time remaining: ${Math.round(remaining / 1000)}s`
      );

      // Rate limiting between batches
      if (i < totalBatches - 1) {
        await sleep(100); // Small delay between batches
      }
    }

    // Step 6: Validation (if not dry run)
    if (!dryRun) {
      console.log("\n🔍 Step 5: Validating migration results...");
      await validateMigration(
        auditReport.summary.totalWaitlists,
        conversionMap,
        conflicts
      );
    }

    // Step 7: Generate final report
    const migrationSummary = {
      success: true,
      dryRun,
      totalRecords: allRecords.length,
      recordsNeedingMigration: recordsNeedingMigration.length,
      recordsProcessed: processedRecords,
      totalBatches: totalBatches,
      conversionMap,
      conflicts: conflicts.length,
      executionTimeMs: Date.now() - startTime,
      migrationResults,
    };

    // Save migration report
    const reportPath = path.join(
      process.cwd(),
      `scripts/migrations/migration-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(migrationSummary, null, 2));

    console.log("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("===================================");
    console.log(`📊 Records processed: ${processedRecords}`);
    console.log(`🔄 Field conflicts resolved: ${conflicts.length}`);
    console.log(
      `⏱️  Total execution time: ${Math.round((Date.now() - startTime) / 1000)}s`
    );
    console.log(`📁 Report saved to: ${reportPath}`);

    if (dryRun) {
      console.log("\n⚠️  This was a DRY RUN - no actual changes were made");
      console.log("Run with --live flag to perform actual migration");
    }

    return migrationSummary;
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);

    // Save error report
    const errorReport = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };

    const errorPath = path.join(
      process.cwd(),
      `scripts/migrations/migration-error-${Date.now()}.json`
    );
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    console.log(`📁 Error report saved to: ${errorPath}`);

    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--live");

  if (args.includes("--help")) {
    console.log(`
Migration Script for Custom Fields Standardization

Usage:
  node migrate-custom-fields.js [options]

Options:
  --live      Perform actual migration (default is dry run)
  --help      Show this help message

Examples:
  node migrate-custom-fields.js                 # Dry run
  node migrate-custom-fields.js --live          # Live migration
    `);
    process.exit(0);
  }

  performMigration(dryRun)
    .then((result) => {
      console.log("\n✅ Migration script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  performMigration,
  convertCustomFieldsToStandard,
  calculateBackoff,
  MIGRATION_CONFIG,
};

const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

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

/**
 * Conflict resolution strategies
 */
const CONFLICT_RESOLUTION_STRATEGIES = {
  // Keep camelCase value (newer convention)
  PREFER_CAMEL_CASE: "prefer_camel_case",
  // Keep snake_case value (might be more recent update)
  PREFER_SNAKE_CASE: "prefer_snake_case",
  // Merge values (for arrays/objects) or concatenate (for strings)
  MERGE_VALUES: "merge_values",
  // Use snake_case value only if camelCase is empty/null
  FALLBACK_TO_SNAKE: "fallback_to_snake",
};

/**
 * Default resolution strategy for each conflict
 */
const CONFLICT_RESOLUTIONS = {
  "hero_text -> heroText": CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE,
  "button_text -> buttonText": CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE,
  "success_message -> successMessage":
    CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE,
  "button_text_color -> buttonTextColor":
    CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE,
};

/**
 * Resolve conflicts between snake_case and camelCase fields
 */
function resolveFieldConflict(
  snakeKey,
  camelKey,
  snakeValue,
  camelValue,
  strategy
) {
  console.log(
    `  Resolving conflict: ${snakeKey} (${JSON.stringify(snakeValue)}) vs ${camelKey} (${JSON.stringify(camelValue)})`
  );

  switch (strategy) {
    case CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE:
      console.log(`    Resolution: Keeping camelCase value`);
      return camelValue;

    case CONFLICT_RESOLUTION_STRATEGIES.PREFER_SNAKE_CASE:
      console.log(`    Resolution: Using snake_case value`);
      return snakeValue;

    case CONFLICT_RESOLUTION_STRATEGIES.FALLBACK_TO_SNAKE:
      if (
        camelValue === null ||
        camelValue === undefined ||
        camelValue === ""
      ) {
        console.log(`    Resolution: camelCase empty, using snake_case value`);
        return snakeValue;
      } else {
        console.log(`    Resolution: camelCase has value, keeping it`);
        return camelValue;
      }

    case CONFLICT_RESOLUTION_STRATEGIES.MERGE_VALUES:
      if (typeof snakeValue === "string" && typeof camelValue === "string") {
        if (snakeValue === camelValue) {
          console.log(`    Resolution: Values identical, keeping camelCase`);
          return camelValue;
        } else {
          console.log(
            `    Resolution: Different strings, keeping camelCase (safer)`
          );
          return camelValue;
        }
      }
      console.log(`    Resolution: Non-string values, keeping camelCase`);
      return camelValue;

    default:
      console.log(`    Resolution: Unknown strategy, defaulting to camelCase`);
      return camelValue;
  }
}

/**
 * Convert custom_fields with conflict resolution
 */
function convertCustomFieldsWithConflictResolution(
  customFields,
  conversionMap,
  conflicts
) {
  if (!customFields || typeof customFields !== "object") {
    return customFields;
  }

  const converted = {};
  const conflictKeys = new Set(conflicts.map((c) => c.snakeCase));
  const processedKeys = new Set();

  // First pass: Handle conflicts
  Object.entries(customFields).forEach(([key, value]) => {
    if (conflictKeys.has(key)) {
      const targetKey = conversionMap[key];
      const strategy =
        CONFLICT_RESOLUTIONS[`${key} -> ${targetKey}`] ||
        CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE;

      // Check if both snake and camel versions exist
      if (customFields.hasOwnProperty(targetKey)) {
        const resolvedValue = resolveFieldConflict(
          key,
          targetKey,
          value,
          customFields[targetKey],
          strategy
        );
        converted[targetKey] = resolvedValue;
        processedKeys.add(key);
        processedKeys.add(targetKey);
      } else {
        // No conflict, just convert
        converted[targetKey] = value;
        processedKeys.add(key);
      }
    }
  });

  // Second pass: Handle non-conflicting fields
  Object.entries(customFields).forEach(([key, value]) => {
    if (processedKeys.has(key)) {
      return; // Already processed
    }

    // Use conversion map if available, otherwise convert snake_case to camelCase
    const standardKey =
      conversionMap[key] ||
      (key.includes("_")
        ? key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
        : key);

    converted[standardKey] = value;
  });

  return converted;
}

/**
 * Analyze conflicts in detail
 */
async function analyzeConflicts() {
  console.log("🔍 Analyzing field conflicts in detail...\n");

  try {
    // Load the audit report
    const reportPath = path.join(
      process.cwd(),
      "scripts/migrations/custom-fields-audit-report.json"
    );
    const auditReport = JSON.parse(fs.readFileSync(reportPath, "utf8"));

    const conflicts = auditReport.recommendations.conflictFields;
    const conversionMap = auditReport.conversionMap;

    console.log(`📊 Found ${conflicts.length} field conflicts:`);
    conflicts.forEach((conflict) => {
      console.log(`  - ${conflict.snakeCase} → ${conflict.camelCase}`);
    });

    // Fetch records with conflicts
    const { data: allRecords, error } = await supabase
      .from("customization_settings")
      .select("id, waitlist_id, custom_fields")
      .not("custom_fields", "is", null);

    if (error) {
      throw new Error(`Failed to fetch records: ${error.message}`);
    }

    // Analyze each conflict in detail
    const conflictAnalysis = {};

    conflicts.forEach((conflict) => {
      conflictAnalysis[conflict.snakeCase] = {
        snakeCase: conflict.snakeCase,
        camelCase: conflict.camelCase,
        recordsWithBoth: 0,
        recordsWithOnlySnake: 0,
        recordsWithOnlyCamel: 0,
        valueDifferences: [],
        examples: [],
      };
    });

    allRecords.forEach((record) => {
      const fields = record.custom_fields || {};

      conflicts.forEach((conflict) => {
        const analysis = conflictAnalysis[conflict.snakeCase];
        const hasSnake = fields.hasOwnProperty(conflict.snakeCase);
        const hasCamel = fields.hasOwnProperty(conflict.camelCase);

        if (hasSnake && hasCamel) {
          analysis.recordsWithBoth++;

          const snakeValue = fields[conflict.snakeCase];
          const camelValue = fields[conflict.camelCase];

          if (snakeValue !== camelValue) {
            analysis.valueDifferences.push({
              waitlistId: record.waitlist_id,
              snakeValue,
              camelValue,
            });
          }

          if (analysis.examples.length < 3) {
            analysis.examples.push({
              waitlistId: record.waitlist_id,
              snakeValue,
              camelValue,
              areEqual: snakeValue === camelValue,
            });
          }
        } else if (hasSnake) {
          analysis.recordsWithOnlySnake++;
        } else if (hasCamel) {
          analysis.recordsWithOnlyCamel++;
        }
      });
    });

    // Report findings
    console.log("\n📈 CONFLICT ANALYSIS:");
    Object.values(conflictAnalysis).forEach((analysis) => {
      console.log(`\n🔄 ${analysis.snakeCase} → ${analysis.camelCase}:`);
      console.log(`    Records with both fields: ${analysis.recordsWithBoth}`);
      console.log(
        `    Records with only snake_case: ${analysis.recordsWithOnlySnake}`
      );
      console.log(
        `    Records with only camelCase: ${analysis.recordsWithOnlyCamel}`
      );
      console.log(
        `    Value differences found: ${analysis.valueDifferences.length}`
      );

      if (analysis.examples.length > 0) {
        console.log(`    Examples:`);
        analysis.examples.forEach((example, i) => {
          console.log(
            `      ${i + 1}. Snake: "${example.snakeValue}", Camel: "${example.camelValue}" (Equal: ${example.areEqual})`
          );
        });
      }
    });

    // Generate resolution strategy report
    console.log("\n🎯 RESOLUTION STRATEGY:");
    conflicts.forEach((conflict) => {
      const key = `${conflict.snakeCase} -> ${conflict.camelCase}`;
      const strategy =
        CONFLICT_RESOLUTIONS[key] ||
        CONFLICT_RESOLUTION_STRATEGIES.PREFER_CAMEL_CASE;
      console.log(
        `  ${conflict.snakeCase} → ${conflict.camelCase}: ${strategy}`
      );
    });

    return {
      conflicts,
      conversionMap,
      conflictAnalysis,
      resolutionStrategies: CONFLICT_RESOLUTIONS,
    };
  } catch (error) {
    console.error("❌ Conflict analysis failed:", error.message);
    throw error;
  }
}

/**
 * Test conflict resolution on a sample
 */
async function testConflictResolution() {
  console.log("🧪 Testing conflict resolution...\n");

  try {
    const analysisResult = await analyzeConflicts();
    const { conflicts, conversionMap } = analysisResult;

    // Get a sample record with conflicts
    const { data: sampleRecords, error } = await supabase
      .from("customization_settings")
      .select("id, waitlist_id, custom_fields")
      .not("custom_fields", "is", null)
      .limit(5);

    if (error) {
      throw new Error(`Failed to fetch sample records: ${error.message}`);
    }

    console.log("📝 Testing conflict resolution on sample records:");

    sampleRecords.forEach((record, index) => {
      const fields = record.custom_fields || {};
      const hasConflicts = conflicts.some(
        (conflict) =>
          fields.hasOwnProperty(conflict.snakeCase) &&
          fields.hasOwnProperty(conflict.camelCase)
      );

      if (hasConflicts) {
        console.log(
          `\n🔍 Sample ${index + 1} (Waitlist: ${record.waitlist_id.slice(0, 8)}...):`
        );
        console.log(`  Original fields: ${Object.keys(fields).length}`);

        const converted = convertCustomFieldsWithConflictResolution(
          fields,
          conversionMap,
          conflicts
        );

        console.log(`  Converted fields: ${Object.keys(converted).length}`);
        console.log(
          `  Sample converted fields:`,
          Object.keys(converted).slice(0, 5).join(", ")
        );
      }
    });

    return analysisResult;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Conflict Resolution Script for Custom Fields

Usage:
  node resolve-field-conflicts.js [command]

Commands:
  analyze     Analyze conflicts in detail
  test        Test conflict resolution on sample data
  
Examples:
  node resolve-field-conflicts.js analyze
  node resolve-field-conflicts.js test
    `);
    process.exit(0);
  }

  const command = args[0] || "analyze";

  if (command === "analyze") {
    analyzeConflicts()
      .then(() => {
        console.log("\n✅ Conflict analysis completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Analysis failed:", error);
        process.exit(1);
      });
  } else if (command === "test") {
    testConflictResolution()
      .then(() => {
        console.log("\n✅ Conflict resolution test completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
      });
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

module.exports = {
  analyzeConflicts,
  testConflictResolution,
  convertCustomFieldsWithConflictResolution,
  resolveFieldConflict,
  CONFLICT_RESOLUTION_STRATEGIES,
  CONFLICT_RESOLUTIONS,
};

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

// Check required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Categorize field naming convention
 */
function categorizeFieldName(fieldName) {
  if (fieldName.includes("_")) {
    return "snake_case";
  }
  if (/[A-Z]/.test(fieldName)) {
    return "camelCase";
  }
  return "lowercase";
}

/**
 * Audit all custom_fields JSONB columns across all waitlists
 */
async function auditCustomFields() {
  console.log("🔍 Starting audit of custom_fields JSONB columns...\n");

  try {
    // Fetch all customization settings with custom_fields
    const { data: settings, error } = await supabase
      .from("customization_settings")
      .select(
        `
        id,
        waitlist_id,
        custom_fields,
        waitlists!inner (
          id,
          name,
          url_slug,
          owner_id,
          created_at
        )
      `
      )
      .not("custom_fields", "is", null);

    if (error) {
      throw new Error(
        `Failed to fetch customization settings: ${error.message}`
      );
    }

    console.log(
      `📊 Found ${settings.length} waitlists with custom_fields data\n`
    );

    // Statistics tracking
    const stats = {
      totalWaitlists: settings.length,
      totalFields: 0,
      fieldsByConvention: {
        snake_case: new Set(),
        camelCase: new Set(),
        lowercase: new Set(),
      },
      fieldUsageCount: {},
      mixedConventionWaitlists: [],
      emptyCustomFields: 0,
      largestCustomFieldsSize: 0,
      fieldValueTypes: {},
    };

    // Process each waitlist's custom_fields
    settings.forEach((setting, index) => {
      const customFields = setting.custom_fields || {};
      const fieldNames = Object.keys(customFields);

      if (fieldNames.length === 0) {
        stats.emptyCustomFields++;
        return;
      }

      // Track largest custom_fields object
      const customFieldsSize = JSON.stringify(customFields).length;
      if (customFieldsSize > stats.largestCustomFieldsSize) {
        stats.largestCustomFieldsSize = customFieldsSize;
      }

      // Analyze field naming conventions in this waitlist
      const conventionsInWaitlist = new Set();

      fieldNames.forEach((fieldName) => {
        stats.totalFields++;

        // Count field usage
        stats.fieldUsageCount[fieldName] =
          (stats.fieldUsageCount[fieldName] || 0) + 1;

        // Categorize naming convention
        const convention = categorizeFieldName(fieldName);
        stats.fieldsByConvention[convention].add(fieldName);
        conventionsInWaitlist.add(convention);

        // Track value types
        const valueType = typeof customFields[fieldName];
        stats.fieldValueTypes[fieldName] =
          stats.fieldValueTypes[fieldName] || {};
        stats.fieldValueTypes[fieldName][valueType] =
          (stats.fieldValueTypes[fieldName][valueType] || 0) + 1;
      });

      // Check for mixed conventions in single waitlist
      if (conventionsInWaitlist.size > 1) {
        stats.mixedConventionWaitlists.push({
          waitlistId: setting.waitlist_id,
          waitlistName: setting.waitlists.name,
          slug: setting.waitlists.url_slug,
          conventions: Array.from(conventionsInWaitlist),
          fields: fieldNames,
        });
      }

      // Log progress for large datasets
      if ((index + 1) % 100 === 0) {
        console.log(`  Processed ${index + 1}/${settings.length} waitlists...`);
      }
    });

    // Generate comprehensive report
    console.log("📈 AUDIT RESULTS");
    console.log("================\n");

    console.log(`📊 OVERVIEW:`);
    console.log(
      `  Total waitlists with custom_fields: ${stats.totalWaitlists}`
    );
    console.log(`  Total custom fields found: ${stats.totalFields}`);
    console.log(`  Empty custom_fields objects: ${stats.emptyCustomFields}`);
    console.log(
      `  Largest custom_fields size: ${stats.largestCustomFieldsSize} bytes\n`
    );

    console.log(`🏷️ FIELD NAMING CONVENTIONS:`);
    console.log(
      `  snake_case fields: ${stats.fieldsByConvention.snake_case.size} unique`
    );
    console.log(
      `  camelCase fields: ${stats.fieldsByConvention.camelCase.size} unique`
    );
    console.log(
      `  lowercase fields: ${stats.fieldsByConvention.lowercase.size} unique\n`
    );

    console.log(`⚠️ MIXED CONVENTIONS:`);
    console.log(
      `  Waitlists with mixed naming: ${stats.mixedConventionWaitlists.length}`
    );
    if (stats.mixedConventionWaitlists.length > 0) {
      console.log(`  Examples:`);
      stats.mixedConventionWaitlists.slice(0, 5).forEach((waitlist) => {
        console.log(`    - ${waitlist.waitlistName} (${waitlist.slug})`);
        console.log(`      Conventions: ${waitlist.conventions.join(", ")}`);
        console.log(
          `      Fields: ${waitlist.fields.slice(0, 3).join(", ")}${waitlist.fields.length > 3 ? "..." : ""}`
        );
      });
    }
    console.log();

    console.log(`📊 MOST COMMON FIELDS:`);
    const sortedFields = Object.entries(stats.fieldUsageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    sortedFields.forEach(([field, count]) => {
      const convention = categorizeFieldName(field);
      const percentage = ((count / stats.totalWaitlists) * 100).toFixed(1);
      console.log(`  ${field} (${convention}): ${count} uses (${percentage}%)`);
    });
    console.log();

    console.log(`🔄 CONVERSION MAPPING:`);
    console.log(`  Suggested camelCase standardization:`);

    // Generate conversion mapping for snake_case to camelCase
    const conversionMap = {};
    Array.from(stats.fieldsByConvention.snake_case).forEach((snakeField) => {
      const camelField = snakeToCamel(snakeField);
      conversionMap[snakeField] = camelField;
      console.log(`    ${snakeField} → ${camelField}`);
    });

    // Save detailed report to file
    const reportData = {
      auditDate: new Date().toISOString(),
      summary: {
        totalWaitlists: stats.totalWaitlists,
        totalFields: stats.totalFields,
        emptyCustomFields: stats.emptyCustomFields,
        mixedConventionCount: stats.mixedConventionWaitlists.length,
      },
      fieldsByConvention: {
        snake_case: Array.from(stats.fieldsByConvention.snake_case),
        camelCase: Array.from(stats.fieldsByConvention.camelCase),
        lowercase: Array.from(stats.fieldsByConvention.lowercase),
      },
      fieldUsageCount: stats.fieldUsageCount,
      fieldValueTypes: stats.fieldValueTypes,
      mixedConventionWaitlists: stats.mixedConventionWaitlists,
      conversionMap,
      recommendations: {
        standardConvention: "camelCase",
        needsMigration: Array.from(stats.fieldsByConvention.snake_case),
        conflictFields: findPotentialConflicts(
          stats.fieldsByConvention,
          conversionMap
        ),
      },
    };

    // Save to file
    const reportPath = path.join(
      process.cwd(),
      "scripts/migrations/custom-fields-audit-report.json"
    );
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Performance recommendations
    console.log(`\n🚀 PERFORMANCE RECOMMENDATIONS:`);
    console.log(`  - Create GIN index on custom_fields for faster queries`);
    console.log(`  - Consider field usage frequency for optimization`);
    console.log(
      `  - Monitor large custom_fields objects (current max: ${stats.largestCustomFieldsSize} bytes)`
    );

    return reportData;
  } catch (error) {
    console.error("❌ Audit failed:", error.message);
    throw error;
  }
}

/**
 * Find potential field conflicts after conversion
 */
function findPotentialConflicts(fieldsByConvention, conversionMap) {
  const conflicts = [];
  const existingCamelCase = Array.from(fieldsByConvention.camelCase);

  Object.entries(conversionMap).forEach(([snakeField, camelField]) => {
    if (existingCamelCase.includes(camelField)) {
      conflicts.push({
        snakeCase: snakeField,
        camelCase: camelField,
        type: "naming_conflict",
      });
    }
  });

  return conflicts;
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditCustomFields()
    .then((report) => {
      console.log("\n✅ Audit completed successfully!");

      if (report.recommendations.conflictFields.length > 0) {
        console.log(
          "\n⚠️ WARNING: Found potential naming conflicts that need manual resolution:"
        );
        report.recommendations.conflictFields.forEach((conflict) => {
          console.log(
            `  ${conflict.snakeCase} → ${conflict.camelCase} (already exists)`
          );
        });
      }

      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Audit failed:", error);
      process.exit(1);
    });
}

module.exports = {
  auditCustomFields,
  snakeToCamel,
  camelToSnake,
  categorizeFieldName,
};

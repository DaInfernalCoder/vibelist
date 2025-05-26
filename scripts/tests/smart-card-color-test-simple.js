const { createClient } = require("@supabase/supabase-js");

// Load environment variables
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load .env
dotenv.config();

// Also load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Create admin Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Replicated utility functions from lib/waitlist-templates.js for testing
function isLightColor(hexColor) {
  if (!hexColor) return true; // Default to light if no color provided

  // Remove # if present and ensure we have a valid hex color
  hexColor = hexColor.replace("#", "").toUpperCase();

  // Handle 3-digit hex colors by expanding them
  if (hexColor.length === 3) {
    hexColor = hexColor
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hexColor.length !== 6) return true; // Default to light if invalid format

  try {
    // Extract RGB values
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);

    // Calculate relative luminance (simplified)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if luminance > 0.5 (light color)
    return luminance > 0.5;
  } catch (error) {
    // Default to light if we can't parse the color
    return true;
  }
}

function getContextualCardColor(bgColor) {
  // If background is light, use white or very light card
  if (isLightColor(bgColor)) {
    return "#ffffff";
  }
  // If background is dark, use a slightly lighter dark card for contrast
  return "#2a2a2a";
}

function getContextualBorderColor(bgColor) {
  // If background is light, use light gray border
  if (isLightColor(bgColor)) {
    return "#e2e8f0";
  }
  // If background is dark, use medium gray border
  return "#4a5568";
}

async function testColorLogic() {
  console.log("🧪 Testing Smart Card Color Logic Functions...\n");

  // Test cases for color detection
  const testCases = [
    { color: "#ffffff", expected: true, name: "Pure White" },
    { color: "#000000", expected: false, name: "Pure Black" },
    { color: "#f0f9ff", expected: true, name: "Light Blue Background" },
    { color: "#111111", expected: false, name: "Dark Background" },
    { color: "#f0fdf4", expected: true, name: "Light Green Background" },
    { color: "#f5f3ff", expected: true, name: "Light Purple Background" },
    { color: "#fef2f2", expected: true, name: "Light Red Background" },
    { color: "#1a1a1a", expected: false, name: "Very Dark Gray" },
  ];

  console.log("🎨 Testing isLightColor() function:");
  let allColorTestsPassed = true;

  testCases.forEach(({ color, expected, name }) => {
    const result = isLightColor(color);
    const status = result === expected ? "✅" : "❌";
    console.log(
      `   ${status} ${name} (${color}): ${result ? "light" : "dark"} ${result !== expected ? `(expected ${expected ? "light" : "dark"})` : ""}`
    );
    if (result !== expected) allColorTestsPassed = false;
  });

  if (allColorTestsPassed) {
    console.log("✅ All color detection tests passed!\n");
  } else {
    console.log("❌ Some color detection tests failed!\n");
  }

  console.log("🎯 Testing contextual card color assignment:");
  const cardTestCases = [
    {
      bgColor: "#f0f9ff",
      expectedCard: "#ffffff",
      expectedBorder: "#e2e8f0",
      name: "Corporate Blue Theme",
    },
    {
      bgColor: "#111111",
      expectedCard: "#2a2a2a",
      expectedBorder: "#4a5568",
      name: "Dark Mode Theme",
    },
    {
      bgColor: "#f0fdf4",
      expectedCard: "#ffffff",
      expectedBorder: "#e2e8f0",
      name: "Eco Green Theme",
    },
    {
      bgColor: "#f5f3ff",
      expectedCard: "#ffffff",
      expectedBorder: "#e2e8f0",
      name: "Bold Purple Theme",
    },
  ];

  let allCardTestsPassed = true;

  cardTestCases.forEach(({ bgColor, expectedCard, expectedBorder, name }) => {
    const cardColor = getContextualCardColor(bgColor);
    const borderColor = getContextualBorderColor(bgColor);

    const cardStatus = cardColor === expectedCard ? "✅" : "❌";
    const borderStatus = borderColor === expectedBorder ? "✅" : "❌";

    console.log(`   ${name} (${bgColor}):`);
    console.log(
      `     ${cardStatus} Card: ${cardColor} ${cardColor !== expectedCard ? `(expected ${expectedCard})` : ""}`
    );
    console.log(
      `     ${borderStatus} Border: ${borderColor} ${borderColor !== expectedBorder ? `(expected ${expectedBorder})` : ""}`
    );

    if (cardColor !== expectedCard || borderColor !== expectedBorder) {
      allCardTestsPassed = false;
    }
  });

  if (allCardTestsPassed) {
    console.log("\n✅ All card color assignment tests passed!");
  } else {
    console.log("\n❌ Some card color assignment tests failed!");
  }

  console.log("\n🗄️ Testing against real database data:");

  try {
    // Test against actual problematic data from before migration
    const testColors = ["#f0f9ff", "#f0fdf4", "#f5f3ff", "#111111"];

    for (const bgColor of testColors) {
      const expectedCard = getContextualCardColor(bgColor);
      const expectedBorder = getContextualBorderColor(bgColor);
      const isLight = isLightColor(bgColor);

      console.log(`   Background ${bgColor} (${isLight ? "light" : "dark"}):`);
      console.log(`     → Card: ${expectedCard}`);
      console.log(`     → Border: ${expectedBorder}`);
    }

    // Check current database state after migration
    const { data: currentData, error } = await supabase
      .from("customization_settings")
      .select("custom_fields")
      .limit(5);

    if (error) {
      console.log("❌ Database query failed:", error.message);
    } else if (currentData && currentData.length > 0) {
      console.log("\n📊 Sample of current database state after migration:");
      currentData.forEach((record, index) => {
        const fields = record.custom_fields || {};
        if (fields.bgColor) {
          console.log(
            `   Record ${index + 1}: bg=${fields.bgColor}, card=${fields.cardBackgroundColor || "none"}, border=${fields.cardBorderColor || "none"}`
          );
        }
      });
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }

  console.log("\n🎉 Color logic testing completed!");
}

// Run the test
testColorLogic().catch(console.error);

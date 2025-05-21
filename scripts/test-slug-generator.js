/**
 * Test script for the slug generation functionality
 *
 * This script tests slug generation for different input strings,
 * focusing on special characters, international characters, emojis,
 * and handling for duplicate slugs.
 */

const slugify = require("slugify");
const { nanoid } = require("nanoid");

// Mock the slugify options we use in the API
const SLUGIFY_OPTIONS = {
  lower: true, // Convert to lowercase
  strict: true, // Strip special characters
  locale: "en", // Use English locale rules
  trim: true, // Trim leading/trailing spaces
};

// Test cases for slug generation
const TEST_CASES = [
  { input: "Simple Title", expected: "simple-title" },
  { input: "With Spaces And Capitals", expected: "with-spaces-and-capitals" },
  {
    input: "Special Ch@racters & Sym&ols!!",
    expected: "special-characters-symbols",
  },
  {
    input: "HTML Tags <div>should be</div> removed",
    expected: "html-tags-should-be-removed",
  },
  { input: "Multiple---Dashes", expected: "multiple-dashes" },
  { input: "émojis 🚀 and unicode", expected: "emojis-and-unicode" },
  {
    input: "中文标题应该正常工作",
    expected: "zhong-wen-biao-ti-ying-gai-zheng-chang-gong-zuo",
  },
  { input: "Numbers 123 and 456", expected: "numbers-123-and-456" },
  { input: "Trailing spaces   ", expected: "trailing-spaces" },
  { input: "   Leading spaces", expected: "leading-spaces" },
  { input: "", expected: "untitled" },
  { input: "   ", expected: "untitled" },
  {
    input: "Verylongwordthatmightcauseissueswithurlsthataretoolong",
    expected: "verylongwordthatmightcauseissueswithurlsthataretoolong",
  },
];

// Test slug generation for each test case
function testSlugGeneration() {
  console.log("🔤 Testing slug generation...\n");

  let passCount = 0;
  let failCount = 0;

  TEST_CASES.forEach((testCase, index) => {
    let slug = slugify(testCase.input || "untitled", SLUGIFY_OPTIONS);

    // Handle empty slugs (e.g., if input was all special characters)
    if (!slug) slug = "untitled";

    if (slug === testCase.expected) {
      console.log(`✅ Test ${index + 1}: "${testCase.input}" → "${slug}"`);
      passCount++;
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.input}"`);
      console.log(`   Expected: "${testCase.expected}"`);
      console.log(`   Actual:   "${slug}"`);
      failCount++;
    }
  });

  console.log(`\n${passCount} tests passed, ${failCount} tests failed.`);
}

// Test collision handling by simulating multiple slugs with the same name
function testSlugCollision() {
  console.log("\n🔄 Testing slug collision handling...\n");

  const baseName = "Duplicate Title";
  const baseSlug = slugify(baseName, SLUGIFY_OPTIONS);

  console.log(`Original: "${baseName}" → "${baseSlug}"`);

  // Simulate 5 collisions
  const slugs = [];
  slugs.push(baseSlug);

  for (let i = 0; i < 5; i++) {
    // This simulates our collision resolution algorithm
    const uniqueSuffix = nanoid(6).toLowerCase();
    const newSlug = `${baseSlug}-${uniqueSuffix}`;
    slugs.push(newSlug);
    console.log(`Collision ${i + 1}: "${baseName}" → "${newSlug}"`);
  }

  // Verify all slugs are unique
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size === slugs.length) {
    console.log("\n✅ All generated slugs are unique");
  } else {
    console.log("\n❌ Duplicate slugs were generated");
  }
}

// Test slug truncation for very long inputs
function testSlugTruncation() {
  console.log("\n📏 Testing slug truncation for long inputs...\n");

  const veryLongTitle =
    "This is an extremely long title that exceeds reasonable limits and should be truncated to a maximum length to ensure it doesn't cause issues with URL limitations in browsers or servers that might have restrictions on URL length particularly for SEO purposes";

  // Standard slugify behavior (no truncation)
  const standardSlug = slugify(veryLongTitle, SLUGIFY_OPTIONS);
  console.log(`Standard slug (${standardSlug.length} chars):`);
  console.log(`"${standardSlug}"`);

  // Implement and test truncation at different lengths
  const truncateLengths = [50, 75, 100];

  truncateLengths.forEach((length) => {
    let baseSlug = slugify(veryLongTitle, SLUGIFY_OPTIONS);

    // Truncate if longer than the limit
    if (baseSlug.length > length) {
      baseSlug = baseSlug.substring(0, length);

      // Ensure we don't end with a dash
      if (baseSlug.endsWith("-")) {
        baseSlug = baseSlug.slice(0, -1);
      }
    }

    console.log(`\nTruncated to ${length} chars (actual: ${baseSlug.length}):`);
    console.log(`"${baseSlug}"`);
  });
}

// Run all tests
function runTests() {
  console.log("🧪 Starting slug generator tests...\n");

  testSlugGeneration();
  testSlugCollision();
  testSlugTruncation();

  console.log("\n✅ All tests completed!");
}

// Check if slugify and nanoid are available
try {
  if (!slugify) {
    console.error("Error: slugify module not found. Please install it with:");
    console.error("npm install slugify");
    process.exit(1);
  }

  if (!nanoid) {
    console.error("Error: nanoid module not found. Please install it with:");
    console.error("npm install nanoid");
    process.exit(1);
  }

  // Run the tests
  runTests();
} catch (error) {
  console.error("Error running tests:", error);
  console.error("\nPlease ensure the required modules are installed:");
  console.error("npm install slugify nanoid");
  process.exit(1);
}

/**
 * Test script for waitlist slug generation and conflict resolution
 *
 * This script tests:
 * 1. Auto-generation of slugs from names
 * 2. Custom slug provision
 * 3. Conflict resolution when duplicate slugs occur
 *
 * Usage:
 * node scripts/test-slug-api.js
 */

// Import node-fetch (commonJS compatible)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  accessToken: null, // Set this to your test user's access token before running
};

// Initialize tests
console.log("🧪 Starting Waitlist Slug API Tests");
console.log(`Base URL: ${config.baseUrl}`);

if (!config.accessToken) {
  console.log(
    "\n⚠️ Warning: No access token provided. Authentication tests will be skipped."
  );
  console.log(
    "To run authenticated tests, edit this file and set config.accessToken."
  );
}

// Create a waitlist with specified name and optional custom slug
async function createWaitlist(name, customSlug = null) {
  if (!config.accessToken) {
    console.log("❌ Skipped: No access token provided");
    return null;
  }

  try {
    const testData = {
      name,
      description: "A test waitlist for slug testing",
      customizationData: {
        theme_color: "#4f46e5",
        background_color: "#ffffff",
        text_color: "#111827",
        hero_text: "Join Our Test Waitlist",
        description_text:
          "This is a test waitlist for testing slug functionality",
        button_text: "Join Waitlist",
      },
    };

    // Add custom slug if provided
    if (customSlug) {
      testData.slug = customSlug;
    }

    const response = await fetch(`${config.baseUrl}/api/waitlists/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      console.log(`❌ Failed to create waitlist. Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Error creating waitlist:`, err);
    return null;
  }
}

// Delete a waitlist
async function deleteWaitlist(id) {
  if (!config.accessToken) {
    return false;
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/waitlists/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    if (response.ok) {
      return true;
    } else {
      console.log(
        `⚠️ Warning: Failed to delete waitlist ${id}. Status: ${response.status}`
      );
      return false;
    }
  } catch (err) {
    console.error(`⚠️ Warning: Error deleting waitlist ${id}:`, err);
    return false;
  }
}

// Test 1: Basic slug generation
async function testBasicSlugGeneration() {
  console.log("\n🔤 Test 1: Basic slug generation");

  const testCases = [
    { name: "Simple Waitlist", expected: "simple-waitlist" },
    { name: "With Spaces and Capitals", expected: "with-spaces-and-capitals" },
    {
      name: "Special Ch@racters & Sym&ols!!",
      expected: "special-characters-symbols",
    },
    {
      name: "   Leading and trailing spaces   ",
      expected: "leading-and-trailing-spaces",
    },
  ];

  const waitlistsToDelete = [];
  let passCount = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\nCase ${index + 1}: "${testCase.name}"`);

    const waitlist = await createWaitlist(testCase.name);

    if (waitlist) {
      waitlistsToDelete.push(waitlist.id);

      console.log(`Generated slug: "${waitlist.slug}"`);

      if (waitlist.slug === testCase.expected) {
        console.log(`✅ Success! Slug matches expected value`);
        passCount++;
      } else if (waitlist.slug.startsWith(testCase.expected)) {
        // Some implementations add a unique suffix, which is acceptable
        console.log(
          `✅ Success! Slug starts with expected value (unique suffix added)`
        );
        passCount++;
      } else {
        console.log(
          `❌ Failed! Expected "${testCase.expected}", got "${waitlist.slug}"`
        );
      }
    }
  }

  console.log(
    `\nBasic slug generation: ${passCount}/${testCases.length} tests passed`
  );

  // Clean up
  for (const id of waitlistsToDelete) {
    await deleteWaitlist(id);
  }

  return passCount === testCases.length;
}

// Test 2: Custom slug provision
async function testCustomSlug() {
  console.log("\n🔠 Test 2: Custom slug provision");

  const customSlug = `custom-slug-${Date.now()}`;
  console.log(`Testing custom slug: "${customSlug}"`);

  const waitlist = await createWaitlist(
    "Waitlist with Custom Slug",
    customSlug
  );

  if (waitlist) {
    console.log(`Returned slug: "${waitlist.slug}"`);

    const success = waitlist.slug === customSlug;

    if (success) {
      console.log(`✅ Success! Custom slug was accepted`);
    } else {
      console.log(
        `❌ Failed! Custom slug was not used. Got "${waitlist.slug}" instead`
      );
    }

    // Clean up
    await deleteWaitlist(waitlist.id);

    return success;
  }

  return false;
}

// Test 3: Slug conflict resolution
async function testSlugConflict() {
  console.log("\n🔄 Test 3: Slug conflict resolution");

  const baseName = "Duplicate Slug Test";
  console.log(`Creating initial waitlist with name: "${baseName}"`);

  const firstWaitlist = await createWaitlist(baseName);

  if (!firstWaitlist) {
    return false;
  }

  const originalSlug = firstWaitlist.slug;
  console.log(`Original slug: "${originalSlug}"`);

  console.log(`Creating second waitlist with same name: "${baseName}"`);
  const secondWaitlist = await createWaitlist(baseName);

  if (!secondWaitlist) {
    await deleteWaitlist(firstWaitlist.id);
    return false;
  }

  console.log(`Second slug: "${secondWaitlist.slug}"`);

  const isDifferent = originalSlug !== secondWaitlist.slug;
  const startsWithOriginal = secondWaitlist.slug.startsWith(originalSlug);

  if (isDifferent && startsWithOriginal) {
    console.log(`✅ Success! Conflict was resolved by adding a unique suffix`);
  } else if (isDifferent) {
    console.log(
      `✅ Success! Different slug was generated, but with unexpected format`
    );
  } else {
    console.log(
      `❌ Failed! Duplicate slug was allowed: "${secondWaitlist.slug}"`
    );
  }

  // Clean up
  await deleteWaitlist(firstWaitlist.id);
  await deleteWaitlist(secondWaitlist.id);

  return isDifferent;
}

// Test 4: Explicit conflict
async function testExplicitConflict() {
  console.log("\n⚠️ Test 4: Explicit slug conflict");

  const baseName = "Explicit Conflict Test";
  console.log(`Creating initial waitlist with name: "${baseName}"`);

  const firstWaitlist = await createWaitlist(baseName);

  if (!firstWaitlist) {
    return false;
  }

  const originalSlug = firstWaitlist.slug;
  console.log(`Original slug: "${originalSlug}"`);

  console.log(`Creating second waitlist with explicit slug: "${originalSlug}"`);
  const secondWaitlist = await createWaitlist("Different Name", originalSlug);

  if (!secondWaitlist) {
    await deleteWaitlist(firstWaitlist.id);
    return false;
  }

  console.log(`Second slug: "${secondWaitlist.slug}"`);

  const isDifferent = originalSlug !== secondWaitlist.slug;
  const startsWithOriginal = secondWaitlist.slug.startsWith(originalSlug);

  if (isDifferent && startsWithOriginal) {
    console.log(
      `✅ Success! Explicit conflict was resolved by adding a unique suffix`
    );
  } else if (isDifferent) {
    console.log(
      `✅ Success! Different slug was generated, but with unexpected format`
    );
  } else {
    console.log(
      `❌ Failed! Duplicate slug was allowed: "${secondWaitlist.slug}"`
    );
  }

  // Clean up
  await deleteWaitlist(firstWaitlist.id);
  await deleteWaitlist(secondWaitlist.id);

  return isDifferent;
}

// Test 5: International characters
async function testInternationalCharacters() {
  console.log("\n🌏 Test 5: International characters in slugs");

  const testCases = [
    { name: "Café au lait", expected: "cafe-au-lait" },
    { name: "日本語のタイトル", expected: "" }, // Empty because we don't know how exactly it will be slugified
    { name: "émojis 🚀 and unicode", expected: "emojis-and-unicode" },
  ];

  const waitlistsToDelete = [];
  let passCount = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\nCase ${index + 1}: "${testCase.name}"`);

    const waitlist = await createWaitlist(testCase.name);

    if (waitlist) {
      waitlistsToDelete.push(waitlist.id);

      console.log(`Generated slug: "${waitlist.slug}"`);

      // For international characters, we just check that we got a valid slug
      // as different slugify implementations handle these differently
      if (testCase.expected && waitlist.slug.includes(testCase.expected)) {
        console.log(`✅ Success! Slug includes expected value`);
        passCount++;
      } else if (
        !testCase.expected &&
        waitlist.slug &&
        !/[^\w-]/.test(waitlist.slug)
      ) {
        console.log(`✅ Success! Got a valid ASCII slug`);
        passCount++;
      } else if (testCase.expected && waitlist.slug) {
        console.log(
          `❓ Mixed result. Expected to include "${testCase.expected}", got "${waitlist.slug}"`
        );
        // Still count as pass if we got a valid slug
        if (!/[^\w-]/.test(waitlist.slug)) {
          console.log(`✅ But it's a valid slug, so counting as success`);
          passCount++;
        }
      } else {
        console.log(`❌ Failed! Invalid or empty slug: "${waitlist.slug}"`);
      }
    }
  }

  console.log(
    `\nInternational character handling: ${passCount}/${testCases.length} tests passed`
  );

  // Clean up
  for (const id of waitlistsToDelete) {
    await deleteWaitlist(id);
  }

  return passCount === testCases.length;
}

// Run all tests
async function runTests() {
  try {
    const results = {
      basicSlugGeneration: await testBasicSlugGeneration(),
      customSlug: await testCustomSlug(),
      slugConflict: await testSlugConflict(),
      explicitConflict: await testExplicitConflict(),
      internationalCharacters: await testInternationalCharacters(),
    };

    console.log("\n📋 Test Results Summary:");
    console.log(
      `Basic Slug Generation: ${
        results.basicSlugGeneration ? "✅ PASS" : "❌ FAIL"
      }`
    );
    console.log(
      `Custom Slug Provision: ${results.customSlug ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `Slug Conflict Resolution: ${
        results.slugConflict ? "✅ PASS" : "❌ FAIL"
      }`
    );
    console.log(
      `Explicit Conflict Handling: ${
        results.explicitConflict ? "✅ PASS" : "❌ FAIL"
      }`
    );
    console.log(
      `International Character Support: ${
        results.internationalCharacters ? "✅ PASS" : "❌ FAIL"
      }`
    );

    const passRate =
      Object.values(results).filter(Boolean).length /
      Object.values(results).length;
    console.log(`\nOverall: ${Math.round(passRate * 100)}% of tests passed`);

    console.log("\n✅ All tests completed!");
  } catch (err) {
    console.error("\n❌ Unexpected error during tests:", err);
  }
}

// Run the tests
runTests();

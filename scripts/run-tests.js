/**
 * Test runner script for waitlist functionality
 *
 * This script runs all waitlist tests except test-waitlist-api.js
 *
 * Usage:
 * node scripts/run-tests.js
 */

const { spawn } = require("child_process");
const path = require("path");

// List of test scripts to run in order
const testScripts = [
  "test-slug-generator.js",
  "get-test-token.js", // Get a token first for the authenticated tests
  "test-slug-api.js",
  "test-waitlist-api-endpoints.js",
  "test-public-waitlist-page.js",
  "test-waitlist-publish-api.js",
];

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n==========================================`);
    console.log(`RUNNING: ${path.basename(scriptPath)}`);
    console.log(`==========================================\n`);

    const process = spawn("node", [scriptPath], {
      stdio: "inherit",
    });

    process.on("close", (code) => {
      if (code !== 0) {
        console.log(
          `\n❌ ${path.basename(scriptPath)} completed with exit code ${code}`
        );
      } else {
        console.log(`\n✅ ${path.basename(scriptPath)} completed successfully`);
      }
      resolve(code);
    });

    process.on("error", (err) => {
      console.error(
        `\n❌ Failed to start ${path.basename(scriptPath)}: ${err}`
      );
      reject(err);
    });
  });
}

// Run all tests in sequence
async function runAllTests() {
  console.log("🧪 Starting all tests...\n");

  const startTime = Date.now();
  const results = [];

  for (const script of testScripts) {
    const scriptPath = path.join(__dirname, script);
    try {
      const exitCode = await runScript(scriptPath);
      results.push({
        script,
        success: exitCode === 0,
        exitCode,
      });
    } catch (error) {
      results.push({
        script,
        success: false,
        error: error.message,
      });
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Print summary
  console.log("\n\n==========================================");
  console.log("TEST SUMMARY");
  console.log("==========================================");

  let passCount = 0;

  results.forEach((result) => {
    if (result.success) {
      passCount++;
      console.log(`✅ ${result.script}: PASSED`);
    } else {
      console.log(
        `❌ ${result.script}: FAILED (exit code: ${result.exitCode})`
      );
    }
  });

  console.log("------------------------------------------");
  console.log(`Tests completed in ${duration.toFixed(2)} seconds`);
  console.log(`${passCount}/${results.length} tests passed`);
  console.log("==========================================");
}

// Run tests
runAllTests().catch((err) => {
  console.error("Error running tests:", err);
  process.exit(1);
});

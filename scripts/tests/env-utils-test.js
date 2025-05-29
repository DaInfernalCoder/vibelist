/**
 * Test script for environment utilities
 * Verifies that URL detection and configuration work correctly
 */

// Load environment variables
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load .env files
dotenv.config();

// Also load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Set NODE_ENV for testing if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const {
  getBaseUrl,
  getAuthCallbackUrl,
  isDevelopment,
  isProduction,
  getEnvironmentConfig,
  buildUrl,
  getAuthRedirectUrl,
} = require("../../lib/env-utils");

function testEnvironmentUtils() {
  console.log("🧪 Testing Environment Utilities...\n");

  // Test 1: Environment Detection
  console.log("📍 Test 1: Environment Detection");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   isDevelopment(): ${isDevelopment()}`);
  console.log(`   isProduction(): ${isProduction()}`);
  console.log("");

  // Test 2: Base URL Detection
  console.log("📍 Test 2: Base URL Detection");
  const baseUrl = getBaseUrl();
  console.log(`   getBaseUrl(): ${baseUrl}`);
  console.log(`   NEXT_PUBLIC_URL: ${process.env.NEXT_PUBLIC_URL}`);

  // Validate base URL format
  const isValidUrl = /^https?:\/\/.+/.test(baseUrl);
  console.log(`   ✅ Valid URL format: ${isValidUrl}`);
  console.log("");

  // Test 3: Auth Callback URL
  console.log("📍 Test 3: Auth Callback URL");
  const authCallbackUrl = getAuthCallbackUrl();
  console.log(`   getAuthCallbackUrl(): ${authCallbackUrl}`);

  // Validate callback URL
  const hasCallbackPath = authCallbackUrl.includes("/auth/callback");
  console.log(`   ✅ Contains /auth/callback: ${hasCallbackPath}`);
  console.log("");

  // Test 4: Environment Configuration
  console.log("📍 Test 4: Environment Configuration");
  const envConfig = getEnvironmentConfig();
  console.log("   Environment Config:");
  console.log(`     baseUrl: ${envConfig.baseUrl}`);
  console.log(`     authCallbackUrl: ${envConfig.authCallbackUrl}`);
  console.log(`     isDevelopment: ${envConfig.isDevelopment}`);
  console.log(`     isProduction: ${envConfig.isProduction}`);
  console.log(`     domain: ${envConfig.domain}`);
  console.log(`     protocol: ${envConfig.protocol}`);
  console.log(`     supabase.redirectUrl: ${envConfig.supabase.redirectUrl}`);
  console.log("");

  // Test 5: URL Building
  console.log("📍 Test 5: URL Building");
  const testPaths = ["/dashboard", "pricing", "/auth/signin"];
  testPaths.forEach((path) => {
    const fullUrl = buildUrl(path);
    console.log(`   buildUrl('${path}'): ${fullUrl}`);
  });
  console.log("");

  // Test 6: Auth Redirect URLs
  console.log("📍 Test 6: Auth Redirect URLs");
  const defaultRedirect = getAuthRedirectUrl();
  const customRedirect = getAuthRedirectUrl("/custom-page");
  console.log(`   Default redirect: ${defaultRedirect}`);
  console.log(`   Custom redirect: ${customRedirect}`);
  console.log("");

  // Test 7: Expected URLs for Different Environments
  console.log("📍 Test 7: Expected URLs by Environment");

  if (isDevelopment()) {
    console.log("   🔧 Development Environment Expectations:");
    console.log(
      `   ✅ Base URL should be localhost: ${baseUrl.includes("localhost")}`
    );
    console.log(
      `   ✅ Protocol should be HTTP: ${baseUrl.startsWith("http://")}`
    );
    console.log(`   ✅ Port should be 3000: ${baseUrl.includes(":3000")}`);
  } else {
    console.log("   🚀 Production Environment Expectations:");
    console.log(
      `   ✅ Base URL should be vibe-list.com: ${baseUrl.includes("vibe-list.com")}`
    );
    console.log(
      `   ✅ Protocol should be HTTPS: ${baseUrl.startsWith("https://")}`
    );
    console.log(`   ✅ No port specified: ${!baseUrl.includes(":")}`);
  }
  console.log("");

  // Test 8: Supabase Configuration
  console.log("📍 Test 8: Supabase Configuration");
  console.log(`   Supabase URL: ${envConfig.supabase.url}`);
  console.log(
    `   Supabase Anon Key: ${envConfig.supabase.anonKey ? "Set" : "Missing"}`
  );
  console.log(`   Supabase Redirect URL: ${envConfig.supabase.redirectUrl}`);

  // Validate Supabase redirect URL matches auth callback
  const supabaseRedirectMatches =
    envConfig.supabase.redirectUrl === authCallbackUrl;
  console.log(
    `   ✅ Redirect URL matches callback: ${supabaseRedirectMatches}`
  );
  console.log("");

  // Test 9: Production Simulation
  console.log("📍 Test 9: Production Environment Simulation");
  const originalNodeEnv = process.env.NODE_ENV;
  const originalUrl = process.env.NEXT_PUBLIC_URL;

  // Simulate production
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_URL = "https://vibe-list.com";

  const prodBaseUrl = getBaseUrl();
  const prodCallbackUrl = getAuthCallbackUrl();
  const prodConfig = getEnvironmentConfig();

  console.log(`   Production Base URL: ${prodBaseUrl}`);
  console.log(`   Production Callback URL: ${prodCallbackUrl}`);
  console.log(`   Production Domain: ${prodConfig.domain}`);
  console.log(`   Production Protocol: ${prodConfig.protocol}`);

  // Restore original values
  process.env.NODE_ENV = originalNodeEnv;
  process.env.NEXT_PUBLIC_URL = originalUrl;
  console.log("");

  // Summary
  console.log("📋 Test Summary:");
  console.log(
    `   Environment: ${isDevelopment() ? "Development" : "Production"}`
  );
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Auth Callback: ${authCallbackUrl}`);
  console.log(`   Configuration: ${envConfig.domain}`);
  console.log("");

  console.log("✅ Environment utilities test completed!");

  return {
    baseUrl,
    authCallbackUrl,
    envConfig,
    success: true,
  };
}

// Run the test if this file is executed directly
if (require.main === module) {
  try {
    testEnvironmentUtils();
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

module.exports = { testEnvironmentUtils };

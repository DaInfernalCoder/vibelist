const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Also load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

console.log("🔍 Testing Authentication Configuration");
console.log("=====================================");

// Test environment variables
console.log("\n📋 Environment Variables:");
console.log(`NEXT_PUBLIC_URL: ${process.env.NEXT_PUBLIC_URL}`);
console.log(
  `NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Test URL construction
const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const authCallbackUrl = `${baseUrl}/api/auth/callback`;

console.log("\n🔗 Constructed URLs:");
console.log(`Base URL: ${baseUrl}`);
console.log(`Auth Callback URL: ${authCallbackUrl}`);

// Test what the signin page would use
console.log("\n🌐 Client-side URL (simulated):");
const simulatedOrigin = "http://localhost:3000";
const clientRedirectURL = simulatedOrigin + "/api/auth/callback";
console.log(`Client Redirect URL: ${clientRedirectURL}`);

// Recommendations
console.log("\n💡 Recommendations:");
console.log("1. Ensure your Supabase dashboard has these redirect URLs:");
console.log(`   - http://localhost:3000/api/auth/callback (for local dev)`);
console.log(`   - https://vibe-list.com/api/auth/callback (for production)`);
console.log("\n2. Make sure you're using HTTP (not HTTPS) for localhost");
console.log("\n3. Verify your development server is running on port 3000");

// Test fetch to local callback (just to see if it's reachable)
async function testCallbackEndpoint() {
  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${baseUrl}/api/auth/callback`, {
      method: "GET",
      redirect: "manual", // Don't follow redirects
    });

    console.log(`\n🔍 Callback endpoint test:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${response.type}`);

    if (response.status === 302 || response.status === 307) {
      console.log("✅ Callback endpoint is working (redirecting as expected)");
    } else {
      console.log(
        "ℹ️  Callback endpoint responded but may need a code parameter"
      );
    }
  } catch (error) {
    console.log(`\n❌ Could not reach callback endpoint: ${error.message}`);
    console.log(
      "Make sure your development server is running with 'npm run dev'"
    );
  }
}

testCallbackEndpoint();

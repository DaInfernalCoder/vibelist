const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

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

// Handle ESM modules in CommonJS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Create a public Supabase client (simulates anonymous user on other devices)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create a service role client for testing
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPublicWaitlistAccess() {
  console.log(
    "Testing public waitlist access (simulating anonymous user on other device)...\n"
  );

  try {
    // Test 1: Fetch a published waitlist by slug (this is what the client-side code does)
    console.log("Test 1: Fetching waitlist by slug...");
    const { data: waitlistData, error: waitlistError } = await supabase
      .from("waitlists")
      .select(
        `
        id, 
        name, 
        description, 
        url_slug, 
        published, 
        created_at, 
        updated_at, 
        customization_settings (*)
      `
      )
      .eq("url_slug", "supabase")
      .eq("published", true)
      .single();

    if (waitlistError) {
      console.error("❌ Error fetching waitlist:", waitlistError.message);
      return false;
    }

    if (!waitlistData) {
      console.error("❌ No waitlist data returned");
      return false;
    }

    console.log("✅ Successfully fetched waitlist:", {
      id: waitlistData.id,
      name: waitlistData.name,
      slug: waitlistData.url_slug,
      hasCustomizationSettings: !!waitlistData.customization_settings,
    });

    // Test 2: Test the API endpoint
    console.log("\nTest 2: Testing API endpoint...");
    const response = await fetch(
      `http://localhost:3000/api/waitlists/slug/supabase`
    );

    if (!response.ok) {
      console.error(
        "❌ API endpoint failed:",
        response.status,
        response.statusText
      );
      return false;
    }

    const apiData = await response.json();
    console.log("✅ API endpoint working:", {
      id: apiData.id,
      name: apiData.name,
      slug: apiData.slug,
      hasTemplateData: !!apiData.template_data,
    });

    // Test 3: Test waitlist signup (should work for anonymous users)
    console.log("\nTest 3: Testing waitlist signup with anonymous client...");
    const testEmail = `test-${Date.now()}@example.com`;

    console.log("Debug: Using waitlist ID:", waitlistData.id);
    console.log("Debug: Test email:", testEmail);

    const { data: signupData, error: signupError } = await supabase
      .from("waitlist_signups")
      .insert([
        {
          waitlist_id: waitlistData.id,
          email: testEmail,
          name: "Test User",
        },
      ])
      .select()
      .single();

    if (signupError) {
      console.error(
        "❌ Error creating signup with anonymous client:",
        signupError.message
      );
      console.error("Full error:", signupError);

      // Try with service role client
      console.log("\nTest 3b: Trying with service role client...");
      const serviceTestEmail = `service-test-${Date.now()}@example.com`;

      const { data: serviceSignupData, error: serviceSignupError } =
        await serviceSupabase
          .from("waitlist_signups")
          .insert([
            {
              waitlist_id: waitlistData.id,
              email: serviceTestEmail,
              name: "Service Test User",
            },
          ])
          .select()
          .single();

      if (serviceSignupError) {
        console.error(
          "❌ Error with service role client too:",
          serviceSignupError.message
        );
      } else {
        console.log("✅ Service role client works:", {
          id: serviceSignupData.id,
          email: serviceSignupData.email,
        });

        // Clean up service test
        await serviceSupabase
          .from("waitlist_signups")
          .delete()
          .eq("id", serviceSignupData.id);
      }

      return false;
    }

    console.log("✅ Successfully created signup:", {
      id: signupData.id,
      email: signupData.email,
      waitlist_id: signupData.waitlist_id,
    });

    // Clean up the test signup
    await supabase.from("waitlist_signups").delete().eq("id", signupData.id);

    console.log(
      "\n🎉 All tests passed! Public waitlist access is working correctly."
    );
    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    return false;
  }
}

// Run the test
testPublicWaitlistAccess()
  .then((success) => {
    if (success) {
      console.log("\n✅ Test completed successfully");
      process.exit(0);
    } else {
      console.log("\n❌ Test failed");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  });

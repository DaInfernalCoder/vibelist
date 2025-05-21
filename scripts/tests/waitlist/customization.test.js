// Node.js test for waitlist customization
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables from .env
dotenv.config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envLocal = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envLocal) {
    process.env[k] = envLocal[k];
  }
}

// Check if required env variables are set
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

// Create Supabase client with service role key (admin rights for testing)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const testWaitlist = {
  name: "Test Customization Waitlist",
  description: "A waitlist for testing custom styles",
  url_slug: `test-customization-${Date.now()}`, // Unique slug
  published: true,
};

// Customization settings
const customSettings = {
  theme_color: "#FF5733", // Custom orange
  custom_fields: {
    background_color: "#F8F9FA",
    text_color: "#212529",
    button_text: "Sign Up Now",
    hero_text: "Join Our Exclusive Test Waitlist",
    description_text:
      "This waitlist features custom styling for testing purposes",
    button_text_color: "#FFFFFF",
    secondary_color: "#6610F2",
    accent_color: "#20C997",
    input_background_color: "#E9ECEF",
    input_border_color: "#CED4DA",
    button_border_radius: "1rem",
    input_border_radius: "0.5rem",
    card_background_color: "#FFFFFF",
    card_border_color: "#DEE2E6",
    success_message: "You've successfully signed up for our test waitlist!",
  },
};

// Test setup - create waitlist and customization settings
async function setupTest() {
  console.log("Setting up test waitlist with custom styling...");

  try {
    // 1. Create a user/profile if needed
    // This step depends on your database schema
    // For this test, we'll use a hardcoded user ID (you should use a real one)
    // In real tests, you might create a test user first

    const ownerId = process.env.TEST_USER_ID;
    if (!ownerId) {
      console.error("TEST_USER_ID environment variable not set");
      console.error(
        "Please set TEST_USER_ID to a valid user ID in your database"
      );
      process.exit(1);
    }

    console.log(`Using owner ID: ${ownerId}`);

    // 2. Create the test waitlist
    const { data: waitlist, error: waitlistError } = await supabase
      .from("waitlists")
      .insert([
        {
          ...testWaitlist,
          owner_id: ownerId,
          status: "draft",
        },
      ])
      .select()
      .single();

    if (waitlistError) {
      console.error("Error creating test waitlist:", waitlistError);
      throw waitlistError;
    }

    console.log(`Created test waitlist: ${waitlist.name} (ID: ${waitlist.id})`);

    // 3. Create customization settings
    const { data: settings, error: settingsError } = await supabase
      .from("customization_settings")
      .insert([
        {
          waitlist_id: waitlist.id,
          theme_color: customSettings.theme_color,
          custom_fields: customSettings.custom_fields,
        },
      ])
      .select()
      .single();

    if (settingsError) {
      console.error("Error creating customization settings:", settingsError);
      throw settingsError;
    }

    console.log("Created customization settings with custom styling");

    // 4. Update waitlist to published state
    const { error: publishError } = await supabase
      .from("waitlists")
      .update({ published: true, status: "published" })
      .eq("id", waitlist.id);

    if (publishError) {
      console.error("Error publishing waitlist:", publishError);
      throw publishError;
    }

    console.log(`Published waitlist with slug: ${waitlist.url_slug}`);

    // Return created test data for reference
    return {
      waitlistId: waitlist.id,
      waitlistSlug: waitlist.url_slug,
      settingsId: settings.id,
    };
  } catch (err) {
    console.error("Error in test setup:", err);
    throw err;
  }
}

// Verify customization settings exist and match expected values
async function verifyCustomizationSettings(testData) {
  console.log("\nVerifying customization settings...");

  try {
    const { data: waitlist, error: waitlistError } = await supabase
      .from("waitlists")
      .select(
        `
        *,
        customization_settings (
          *
        )
      `
      )
      .eq("id", testData.waitlistId)
      .single();

    if (waitlistError) {
      console.error("Error fetching waitlist with settings:", waitlistError);
      throw waitlistError;
    }

    console.log("Retrieved waitlist with settings:", waitlist.name);

    // Check that customization settings exist
    if (!waitlist.customization_settings) {
      throw new Error("Customization settings not found for waitlist");
    }

    const settings = waitlist.customization_settings;
    console.log("✅ Found customization settings");

    // Verify theme color
    if (settings.theme_color !== customSettings.theme_color) {
      throw new Error(
        `Theme color mismatch. Expected: ${customSettings.theme_color}, Got: ${settings.theme_color}`
      );
    }
    console.log(`✅ Theme color matches: ${settings.theme_color}`);

    // Verify custom fields
    if (!settings.custom_fields) {
      throw new Error("Custom fields not found in settings");
    }

    // Check a few key custom fields
    const fields = settings.custom_fields;
    const expected = customSettings.custom_fields;

    if (fields.button_text !== expected.button_text) {
      throw new Error(
        `Button text mismatch. Expected: ${expected.button_text}, Got: ${fields.button_text}`
      );
    }
    console.log(`✅ Button text matches: ${fields.button_text}`);

    if (fields.background_color !== expected.background_color) {
      throw new Error(
        `Background color mismatch. Expected: ${expected.background_color}, Got: ${fields.background_color}`
      );
    }
    console.log(`✅ Background color matches: ${fields.background_color}`);

    if (fields.button_border_radius !== expected.button_border_radius) {
      throw new Error(
        `Button radius mismatch. Expected: ${expected.button_border_radius}, Got: ${fields.button_border_radius}`
      );
    }
    console.log(`✅ Button radius matches: ${fields.button_border_radius}`);

    console.log("All customization settings verified successfully!");
    return waitlist;
  } catch (err) {
    console.error("Error verifying customization settings:", err);
    throw err;
  }
}

// Clean up test data
async function cleanup(testData) {
  console.log("\nCleaning up test data...");

  try {
    // Delete customization settings
    const { error: settingsError } = await supabase
      .from("customization_settings")
      .delete()
      .eq("id", testData.settingsId);

    if (settingsError) {
      console.error("Error deleting customization settings:", settingsError);
    } else {
      console.log("✅ Deleted customization settings");
    }

    // Delete waitlist
    const { error: waitlistError } = await supabase
      .from("waitlists")
      .delete()
      .eq("id", testData.waitlistId);

    if (waitlistError) {
      console.error("Error deleting waitlist:", waitlistError);
    } else {
      console.log("✅ Deleted test waitlist");
    }
  } catch (err) {
    console.error("Error in cleanup:", err);
  }
}

// Main test function
async function runTests() {
  let testData = null;

  try {
    // Setup
    testData = await setupTest();

    // Display URL for manual testing
    const waitlistUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/waitlist/${testData.waitlistSlug}`;
    console.log(`\n📋 For manual testing, visit: ${waitlistUrl}`);

    // Verify
    await verifyCustomizationSettings(testData);

    console.log("\n✅ All tests passed!");
    console.log(
      "To manually verify the UI styling, please visit the URL above in your browser"
    );
    console.log(
      "The waitlist should display with custom orange theme, rounded buttons, and custom text"
    );
  } catch (err) {
    console.error("\n❌ Test failed:", err);
  } finally {
    // Clean up
    if (testData) {
      await cleanup(testData);
    }
  }
}

// Run the tests
runTests();

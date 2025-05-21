/**
 * Test script to diagnose waitlist loading issues
 *
 * This script creates a test waitlist with custom settings and then loads it
 * to diagnose issues with custom waitlist display.
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Required environment variables missing. Check .env.local file."
  );
  process.exit(1);
}

// Create a Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let testUser = null;
let testWaitlist = null;

async function findOrCreateTestUser() {
  console.log("\nFinding or creating test user...");

  // Try to find an existing test user
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", "test@example.com")
    .maybeSingle();

  if (error) {
    throw new Error(`Error finding test user: ${error.message}`);
  }

  if (data) {
    console.log(`Found existing test user: ${data.id}`);
    return data;
  }

  // Create a new test user if none exists
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: "test@example.com",
      password: "password123",
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Failed to create test auth user: ${authError.message}`);
  }

  // Verify the user profile exists (should be created by a trigger)
  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.user.id)
    .maybeSingle();

  if (profileError || !newProfile) {
    throw new Error("Test user profile not found after creation");
  }

  console.log(`Created new test user: ${newProfile.id}`);
  return newProfile;
}

async function createTestWaitlist() {
  console.log("\nCreating test waitlist with custom settings...");

  const waitlistName = `Test Waitlist ${Date.now()}`;
  const waitlistDescription = "A test waitlist with custom settings";

  // Create a waitlist
  const { data, error } = await supabase
    .from("waitlists")
    .insert({
      name: waitlistName,
      description: waitlistDescription,
      owner_id: testUser.id,
      status: "published",
      published: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test waitlist: ${error.message}`);
  }

  testWaitlist = data;
  console.log(`Created waitlist: ${testWaitlist.id} (${testWaitlist.name})`);

  // Generate a custom slug if none was generated automatically
  if (!testWaitlist.url_slug) {
    const customSlug = `test-waitlist-${Date.now()}`;
    const { data: updatedWaitlist, error: slugError } = await supabase
      .from("waitlists")
      .update({ url_slug: customSlug })
      .eq("id", testWaitlist.id)
      .select()
      .single();

    if (slugError) {
      throw new Error(`Failed to update waitlist slug: ${slugError.message}`);
    }

    testWaitlist = updatedWaitlist;
    console.log(`Set custom slug: ${testWaitlist.url_slug}`);
  } else {
    console.log(`Generated slug: ${testWaitlist.url_slug}`);
  }

  // Create custom settings for the waitlist
  const customSettings = {
    waitlist_id: testWaitlist.id,
    theme_color: "#FF5733", // Custom theme color
    logo_url: "https://picsum.photos/200", // Sample logo URL
    custom_fields: {
      hero_text: "Join our exclusive custom waitlist today!",
      description_text:
        "This is a custom waitlist description with special formatting.",
      button_text: "Sign Up Now",
      background_color: "#F8F9FA",
      text_color: "#212529",
      button_text_color: "#FFFFFF",
    },
    show_social_proof: true,
    show_referral: true,
  };

  // Check if customization settings already exist
  const { data: existingSettings, error: settingsError } = await supabase
    .from("customization_settings")
    .select()
    .eq("waitlist_id", testWaitlist.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(
      `Error checking existing settings: ${settingsError.message}`
    );
  }

  if (existingSettings) {
    // Update existing settings
    console.log("Updating existing customization settings...");
    const { error: updateError } = await supabase
      .from("customization_settings")
      .update(customSettings)
      .eq("id", existingSettings.id);

    if (updateError) {
      throw new Error(
        `Failed to update customization settings: ${updateError.message}`
      );
    }
  } else {
    // Insert new settings
    console.log("Creating new customization settings...");
    const { error: insertError } = await supabase
      .from("customization_settings")
      .insert(customSettings);

    if (insertError) {
      throw new Error(
        `Failed to create customization settings: ${insertError.message}`
      );
    }
  }

  console.log("Custom settings created/updated successfully.");

  // Verify the customization settings
  const { data: verifySettings, error: verifyError } = await supabase
    .from("customization_settings")
    .select("*")
    .eq("waitlist_id", testWaitlist.id)
    .single();

  if (verifyError || !verifySettings) {
    throw new Error(
      `Failed to verify customization settings: ${verifyError?.message || "not found"}`
    );
  }

  console.log("Verified custom settings:");
  console.log(` - Theme color: ${verifySettings.theme_color}`);
  console.log(` - Logo URL exists: ${!!verifySettings.logo_url}`);
  console.log(` - Custom fields exist: ${!!verifySettings.custom_fields}`);

  // Return the full waitlist data for testing
  return testWaitlist;
}

async function checkWaitlistAPI() {
  console.log("\nTesting waitlist API to verify correct data is returned...");

  // Construct the API URL
  const apiUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/waitlists/slug/${testWaitlist.url_slug}`;
  console.log(`Checking API URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error: ${data.error || response.statusText}`);
      return;
    }

    console.log("API returned waitlist data:");
    console.log(` - ID: ${data.id}`);
    console.log(` - Name: ${data.name}`);
    console.log(` - Slug: ${data.slug}`);

    if (data.template_data) {
      console.log("Template data present:", Object.keys(data.template_data));
      console.log(` - Theme color: ${data.template_data.theme_color}`);
      console.log(` - Logo URL exists: ${!!data.template_data.logo_url}`);
    } else {
      console.error("No template data found in API response");
    }

    return data;
  } catch (err) {
    console.error("Error checking waitlist API:", err);
  }
}

async function fetchDirectWaitlistData() {
  console.log("\nDirectly fetching waitlist data from Supabase...");

  // Query the waitlist with its customization settings
  const { data, error } = await supabase
    .from("waitlists")
    .select(
      `
      *,
      customization_settings (*)
    `
    )
    .eq("id", testWaitlist.id)
    .single();

  if (error) {
    console.error(`Error fetching waitlist data: ${error.message}`);
    return;
  }

  console.log("Direct database query results:");
  console.log(` - ID: ${data.id}`);
  console.log(` - Name: ${data.name}`);
  console.log(` - Slug: ${data.url_slug}`);

  if (data.customization_settings) {
    console.log("Customization settings found:");
    console.log(` - Theme color: ${data.customization_settings.theme_color}`);
    console.log(
      ` - Logo URL exists: ${!!data.customization_settings.logo_url}`
    );
    console.log(
      ` - Custom fields:`,
      Object.keys(data.customization_settings.custom_fields || {})
    );
  } else {
    console.error("No customization settings found in direct database query");
  }

  return data;
}

async function runTest() {
  try {
    console.log("🧪 WAITLIST DISPLAY DIAGNOSTIC TEST 🧪");
    console.log("======================================");

    // Find or create test user
    testUser = await findOrCreateTestUser();

    // Create test waitlist with custom settings
    testWaitlist = await createTestWaitlist();

    // Check API response for the waitlist
    await checkWaitlistAPI();

    // Fetch data directly from database
    await fetchDirectWaitlistData();

    console.log("\nTest completed successfully!");
    console.log(
      `\nTo test the waitlist page, visit: ${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/waitlist/${testWaitlist.url_slug}`
    );
    console.log("Check the browser console for detailed logs.");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

// Run the test
runTest();

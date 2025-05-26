const { createClient } = require("@supabase/supabase-js");
const {
  updateCustomizationSettings,
} = require("../../lib/waitlist-templates.js");

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

async function testSmartCardColors() {
  console.log("🧪 Testing Smart Card Color Logic...\n");

  try {
    // Find a waitlist that has bgColor but no cardBackgroundColor
    const { data: testWaitlist, error } = await supabase
      .from("customization_settings")
      .select("id, waitlist_id, custom_fields")
      .eq("custom_fields->>bgColor", "#f0f9ff") // Light blue background
      .not("custom_fields", "cs", '{"cardBackgroundColor"}') // No card background color
      .limit(1)
      .single();

    if (error || !testWaitlist) {
      console.log("❌ No suitable test waitlist found. Error:", error?.message);
      return;
    }

    console.log(`✅ Found test waitlist: ${testWaitlist.waitlist_id}`);
    console.log(`   Current bgColor: ${testWaitlist.custom_fields.bgColor}`);
    console.log(
      `   Has cardBackgroundColor: ${!!testWaitlist.custom_fields.cardBackgroundColor}`
    );

    // Test light theme settings (should get white card)
    console.log("\n🎨 Testing light theme (should auto-set white card)...");
    const lightThemeSettings = {
      bgColor: "#f0f9ff", // Light blue
      headingTextColor: "#0c4a6e",
      buttonColor: "#0284c7",
      // Intentionally NOT including cardBackgroundColor to test auto-setting
    };

    const lightResult = await updateCustomizationSettings(
      supabase,
      testWaitlist.waitlist_id,
      lightThemeSettings
    );

    if (lightResult.success) {
      console.log("✅ Light theme update successful");

      // Verify the auto-set card color
      const { data: updatedLight } = await supabase
        .from("customization_settings")
        .select("custom_fields")
        .eq("waitlist_id", testWaitlist.waitlist_id)
        .single();

      console.log(
        `   Auto-set cardBackgroundColor: ${updatedLight.custom_fields.cardBackgroundColor}`
      );
      console.log(
        `   Auto-set cardBorderColor: ${updatedLight.custom_fields.cardBorderColor}`
      );

      if (updatedLight.custom_fields.cardBackgroundColor === "#ffffff") {
        console.log("✅ Light theme correctly auto-set to white card");
      } else {
        console.log(
          `❌ Expected white card, got: ${updatedLight.custom_fields.cardBackgroundColor}`
        );
      }
    } else {
      console.log("❌ Light theme update failed:", lightResult.error);
    }

    // Test dark theme settings (should get dark card)
    console.log("\n🌙 Testing dark theme (should auto-set dark card)...");
    const darkThemeSettings = {
      bgColor: "#111111", // Dark background
      headingTextColor: "#ffffff",
      buttonColor: "#3b82f6",
      // Intentionally NOT including cardBackgroundColor to test auto-setting
    };

    const darkResult = await updateCustomizationSettings(
      supabase,
      testWaitlist.waitlist_id,
      darkThemeSettings
    );

    if (darkResult.success) {
      console.log("✅ Dark theme update successful");

      // Verify the auto-set card color
      const { data: updatedDark } = await supabase
        .from("customization_settings")
        .select("custom_fields")
        .eq("waitlist_id", testWaitlist.waitlist_id)
        .single();

      console.log(
        `   Auto-set cardBackgroundColor: ${updatedDark.custom_fields.cardBackgroundColor}`
      );
      console.log(
        `   Auto-set cardBorderColor: ${updatedDark.custom_fields.cardBorderColor}`
      );

      if (updatedDark.custom_fields.cardBackgroundColor === "#2a2a2a") {
        console.log("✅ Dark theme correctly auto-set to dark card");
      } else {
        console.log(
          `❌ Expected dark card (#2a2a2a), got: ${updatedDark.custom_fields.cardBackgroundColor}`
        );
      }
    } else {
      console.log("❌ Dark theme update failed:", darkResult.error);
    }

    // Test explicit card color (should NOT be overridden)
    console.log("\n🎯 Testing explicit card color (should NOT be auto-set)...");
    const explicitSettings = {
      bgColor: "#f0f9ff", // Light background
      cardBackgroundColor: "#fef2f2", // Custom light red card
      cardBorderColor: "#fca5a5", // Custom red border
      headingTextColor: "#0c4a6e",
      buttonColor: "#0284c7",
    };

    const explicitResult = await updateCustomizationSettings(
      supabase,
      testWaitlist.waitlist_id,
      explicitSettings
    );

    if (explicitResult.success) {
      console.log("✅ Explicit color update successful");

      // Verify the explicit colors were preserved
      const { data: updatedExplicit } = await supabase
        .from("customization_settings")
        .select("custom_fields")
        .eq("waitlist_id", testWaitlist.waitlist_id)
        .single();

      console.log(
        `   Preserved cardBackgroundColor: ${updatedExplicit.custom_fields.cardBackgroundColor}`
      );
      console.log(
        `   Preserved cardBorderColor: ${updatedExplicit.custom_fields.cardBorderColor}`
      );

      if (updatedExplicit.custom_fields.cardBackgroundColor === "#fef2f2") {
        console.log("✅ Explicit card color correctly preserved");
      } else {
        console.log(
          `❌ Expected explicit color (#fef2f2), got: ${updatedExplicit.custom_fields.cardBackgroundColor}`
        );
      }
    } else {
      console.log("❌ Explicit color update failed:", explicitResult.error);
    }

    console.log("\n🎉 Smart card color test completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testSmartCardColors().catch(console.error);

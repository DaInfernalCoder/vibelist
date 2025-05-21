// lib/waitlist-templates.js
import { createClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Fetch template data by ID
 * @param {string} templateId - UUID of the template to fetch
 * @returns {Promise<Object>} Template data or null if not found
 */
export async function getTemplateById(templateId) {
  const supabase = createClient({ cookies });

  if (!templateId) return null;

  const { data, error } = await supabase
    .from("waitlist_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    console.error("Error fetching template:", error);
    return null;
  }

  return data;
}

/**
 * Get default customization settings
 * @returns {Object} Default customization settings
 */
export function getDefaultCustomizationSettings() {
  return {
    theme_color: "#4f46e5", // Indigo
    secondary_color: "#9333ea", // Purple
    background_color: "#ffffff",
    text_color: "#111827",
    logo_url: "",
    show_social_proof: true,
    show_referral: false,
    // Default values from defaultTemplate (app/dashboard/create/utils/templateUtils.js)
    projectTitle: "digitalseobull",
    heroText: "Signup to our waitlist",
    subText:
      "Updates, news, exclusive discounts, and so much more cool stuff happens behind-the-scenes",
    placeholderInputText: "Email",
    buttonText: "Join the waitlist",
    successMessage: "Success! You're on the waitlist 🎉",
    showLogo: true,
    logoSize: "1X",
    enableReferrals: false,
    whiteLabel: false,
    bgColor: "#ffffff",
    headingTextColor: "#000000",
    inputColor: "#f5f5f5",
    inputBorderWidth: "1px",
    inputBorderColor: "#e5e5e5",
    inputBorderRadius: "Medium",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    buttonTextWeight: "Medium",
    buttonBorderWidth: "0px",
    signupTextColor: "#4b5563",
    pingDotColor: "#10b981",
  };
}

/**
 * Merge default settings with template settings and custom settings
 * @param {Object} templateData - Settings from a selected template (from DB)
 * @param {Object} customData - User provided custom settings (from request body)
 * @returns {Object} Merged settings object
 */
export function mergeCustomizationSettings(
  templateData = null,
  customData = null
) {
  const defaultSettings = getDefaultCustomizationSettings();

  let mergedSettings = { ...defaultSettings };
  if (templateData && templateData.template_data) {
    // template_data from DB contains all settings for a saved template
    mergedSettings = { ...mergedSettings, ...templateData.template_data };
  }

  if (customData) {
    // customData from request body also contains all settings from the editor
    mergedSettings = { ...mergedSettings, ...customData };
  }

  return mergedSettings;
}

/**
 * Validate customization data format
 * @param {Object} customizationData - User provided customization data
 * @returns {Object|null} Error object or null if valid
 */
export function validateCustomizationData(customizationData) {
  if (!customizationData) return null;

  if (typeof customizationData !== "object" || customizationData === null) {
    return {
      error: "Customization data must be an object",
      status: 400,
    };
  }

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (
    customizationData.theme_color &&
    !hexColorRegex.test(customizationData.theme_color)
  ) {
    return {
      error:
        "Theme color must be a valid hex color code (e.g. #RRGGBB or #RGB)",
      status: 400,
    };
  }

  if (
    customizationData.secondary_color &&
    !hexColorRegex.test(customizationData.secondary_color)
  ) {
    return {
      error:
        "Secondary color must be a valid hex color code (e.g. #RRGGBB or #RGB)",
      status: 400,
    };
  }

  if (
    customizationData.background_color &&
    !hexColorRegex.test(customizationData.background_color)
  ) {
    return {
      error:
        "Background color must be a valid hex color code (e.g. #RRGGBB or #RGB)",
      status: 400,
    };
  }

  if (
    customizationData.text_color &&
    !hexColorRegex.test(customizationData.text_color)
  ) {
    return {
      error: "Text color must be a valid hex color code (e.g. #RRGGBB or #RGB)",
      status: 400,
    };
  }

  if (
    customizationData.logo_url &&
    typeof customizationData.logo_url !== "string"
  ) {
    return {
      error: "Logo URL must be a string",
      status: 400,
    };
  }

  if (
    customizationData.show_social_proof !== undefined &&
    typeof customizationData.show_social_proof !== "boolean"
  ) {
    return { error: "show_social_proof must be a boolean", status: 400 };
  }

  if (
    customizationData.show_referral !== undefined &&
    typeof customizationData.show_referral !== "boolean"
  ) {
    return { error: "show_referral must be a boolean", status: 400 };
  }

  return null;
}

/**
 * Update customization settings for a waitlist
 * @param {Object} supabase - Supabase client
 * @param {string} waitlistId - Waitlist ID
 * @param {Object} allSettings - All customization settings from the editor/template
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateCustomizationSettings(
  supabase,
  waitlistId,
  allSettings
) {
  try {
    // Define columns that exist directly in the customization_settings table
    const knownColumns = [
      "theme_color",
      "logo_url",
      "redirect_url",
      "email_template",
      "show_social_proof",
      "show_referral",
      // Add other direct columns if they exist, e.g., background_color, text_color if you add them to the table
    ];

    const settingsForTable = { waitlist_id: waitlistId };
    const customFieldsData = {};

    // Separate settings into direct columns and those for the custom_fields JSONB column
    for (const key in allSettings) {
      if (Object.prototype.hasOwnProperty.call(allSettings, key)) {
        if (knownColumns.includes(key)) {
          settingsForTable[key] = allSettings[key];
        } else {
          // Store all other settings in the custom_fields JSONB object
          customFieldsData[key] = allSettings[key];
        }
      }
    }
    settingsForTable.custom_fields = customFieldsData;

    // Check if settings already exist for this waitlist_id
    const { data: existingSettings, error: queryError } = await supabase
      .from("customization_settings")
      .select("id")
      .eq("waitlist_id", waitlistId)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking for existing settings:", queryError);
      return {
        success: false,
        error: `Error checking for existing settings: ${queryError.message}`,
      };
    }

    if (existingSettings) {
      // Update existing settings
      // For update, remove waitlist_id from the payload as it's the key we're matching on
      const { waitlist_id, ...updatePayload } = settingsForTable;
      const { error: updateError } = await supabase
        .from("customization_settings")
        .update(updatePayload)
        .eq("id", existingSettings.id);

      if (updateError) {
        console.error("Error updating settings:", updateError);
        return {
          success: false,
          error: `Error updating settings: ${updateError.message}`,
        };
      }
      return { success: true, action: "updated" };
    } else {
      // Create new settings, includes waitlist_id
      const { error: insertError } = await supabase
        .from("customization_settings")
        .insert(settingsForTable);

      if (insertError) {
        console.error("Error creating settings:", insertError);
        return {
          success: false,
          error: `Error creating settings: ${insertError.message}`,
        };
      }
      return { success: true, action: "created" };
    }
  } catch (err) {
    console.error(
      "Internal error in updateCustomizationSettings:",
      err.message,
      err.stack
    );
    return {
      success: false,
      error: `Unexpected error in updateCustomizationSettings: ${err.message}`,
    };
  }
}

import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Fetch template data by ID
 * @param {string} templateId - UUID of the template to fetch
 * @returns {Promise<Object>} Template data or null if not found
 */
export async function getTemplateById(templateId) {
  const supabase = createRouteHandlerClient({ cookies });

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
  };
}

/**
 * Merge default settings with template settings and custom settings
 * @param {Object} templateData - Settings from a selected template
 * @param {Object} customData - User provided custom settings
 * @returns {Object} Merged settings object
 */
export function mergeCustomizationSettings(
  templateData = null,
  customData = null
) {
  // Start with default settings
  const defaultSettings = getDefaultCustomizationSettings();

  // Layer 1: Apply template settings if available
  let mergedSettings = { ...defaultSettings };
  if (templateData && templateData.template_data) {
    mergedSettings = { ...mergedSettings, ...templateData.template_data };
  }

  // Layer 2: Apply custom settings if available
  if (customData) {
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

  // Check if it's an object
  if (typeof customizationData !== "object" || customizationData === null) {
    return {
      error: "Customization data must be an object",
      status: 400,
    };
  }

  // Validate theme_color if provided
  if (
    customizationData.theme_color &&
    !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customizationData.theme_color)
  ) {
    return {
      error: "Theme color must be a valid hex color code (e.g. #ff0000)",
      status: 400,
    };
  }

  // Validate secondary_color if provided
  if (
    customizationData.secondary_color &&
    !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
      customizationData.secondary_color
    )
  ) {
    return {
      error: "Secondary color must be a valid hex color code (e.g. #ff0000)",
      status: 400,
    };
  }

  // Validate logo_url if provided
  if (
    customizationData.logo_url &&
    typeof customizationData.logo_url !== "string"
  ) {
    return {
      error: "Logo URL must be a string",
      status: 400,
    };
  }

  // All validations passed
  return null;
}

/**
 * Update customization settings for a waitlist
 * @param {Object} supabase - Supabase client
 * @param {string} waitlistId - Waitlist ID
 * @param {Object} customizationData - Settings to apply
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateCustomizationSettings(
  supabase,
  waitlistId,
  customizationData
) {
  try {
    // First check if settings already exist
    const { data: existingSettings, error: queryError } = await supabase
      .from("customization_settings")
      .select("id")
      .eq("waitlist_id", waitlistId)
      .maybeSingle();

    if (queryError) {
      return {
        success: false,
        error: `Error checking for existing settings: ${queryError.message}`,
      };
    }

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("customization_settings")
        .update(customizationData)
        .eq("id", existingSettings.id);

      if (updateError) {
        return {
          success: false,
          error: `Error updating settings: ${updateError.message}`,
        };
      }

      return { success: true, action: "updated" };
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from("customization_settings")
        .insert({
          waitlist_id: waitlistId,
          ...customizationData,
        });

      if (insertError) {
        return {
          success: false,
          error: `Error creating settings: ${insertError.message}`,
        };
      }

      return { success: true, action: "created" };
    }
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

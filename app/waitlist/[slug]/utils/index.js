// Generate unique request ID for tracking
export const generateRequestId = () => {
  return `wl_client_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Helper to convert snake_case to camelCase
export const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

// Extract tracking data from URL search params
export const extractTrackingData = (searchParams) => {
  return {
    ref: searchParams.get("ref") || null,
    utm_source: searchParams.get("utm_source") || null,
    utm_medium: searchParams.get("utm_medium") || null,
    utm_campaign: searchParams.get("utm_campaign") || null,
  };
};

// Process customization settings from database
export const processCustomizationSettings = (
  directDBSettings,
  defaultTemplate,
  snakeToCamel
) => {
  const resolvedStyles = { ...defaultTemplate };

  // Apply direct columns from customization_settings (snake_case to camelCase)
  for (const key in directDBSettings) {
    if (
      Object.hasOwnProperty.call(directDBSettings, key) &&
      ![
        "id",
        "waitlist_id",
        "created_at",
        "updated_at",
        "custom_fields",
      ].includes(key) &&
      directDBSettings[key] !== null &&
      directDBSettings[key] !== undefined
    ) {
      resolvedStyles[snakeToCamel(key)] = directDBSettings[key];
    }
  }

  // Merge/override with camelCase fields from `custom_fields` JSONB
  const customFieldsFromDB = directDBSettings.custom_fields || {};
  Object.assign(resolvedStyles, customFieldsFromDB);

  return resolvedStyles;
};

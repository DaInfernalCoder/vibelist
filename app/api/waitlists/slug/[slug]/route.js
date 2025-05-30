import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create public client for unauthenticated operations (cross-device compatible)
const publicSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate a unique request ID for API tracing
const generateRequestId = () => {
  return `api_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Helper to convert snake_case to camelCase
const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

export async function GET(request, { params }) {
  const requestId = generateRequestId();
  console.log(`[${requestId}] API: GET /api/waitlists/slug/${params.slug}`);

  // Use public client for cross-device compatibility
  const supabase = publicSupabase;

  const { slug } = params;

  if (!slug) {
    console.warn(`[${requestId}] Missing slug parameter`);
    return NextResponse.json(
      { error: "Waitlist slug is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`[${requestId}] Fetching waitlist data for slug: ${slug}`);

    const { data: waitlistData, error } = await supabase
      .from("waitlists")
      .select(
        `
        id,
        name,
        description,
        url_slug,
        created_at,
        updated_at,
        customization_settings (
          theme_color,
          logo_url,
          custom_fields,
          redirect_url,
          email_template,
          show_social_proof,
          show_referral
        )
      `
      )
      .eq("url_slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      console.error(`[${requestId}] Database error:`, error.message);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Waitlist not found or is not published" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch waitlist data" },
        { status: 500 }
      );
    }

    if (!waitlistData) {
      console.warn(`[${requestId}] No waitlist found for slug: ${slug}`);
      return NextResponse.json(
        { error: "Waitlist not found or is not published" },
        { status: 404 }
      );
    }

    console.log(`[${requestId}] Waitlist found:`, {
      id: waitlistData.id,
      name: waitlistData.name,
      hasCustomizationSettings: !!waitlistData.customization_settings,
    });

    const settingsFromDB = waitlistData.customization_settings || {};
    const customFieldsFromJSONB = settingsFromDB.custom_fields || {};

    const template_data_for_public_page = {};

    // 1. Add all direct properties from settingsFromDB, converting keys to camelCase
    for (const key in settingsFromDB) {
      if (
        Object.hasOwnProperty.call(settingsFromDB, key) &&
        ![
          "id",
          "waitlist_id",
          "created_at",
          "updated_at",
          "custom_fields",
        ].includes(key) &&
        settingsFromDB[key] !== null &&
        settingsFromDB[key] !== undefined
      ) {
        template_data_for_public_page[snakeToCamel(key)] = settingsFromDB[key];
      }
    }

    // 2. Merge/override with everything from customFieldsFromJSONB (assuming these are already camelCase)
    // This ensures custom_fields from JSONB take precedence if keys conflict.
    Object.assign(template_data_for_public_page, customFieldsFromJSONB);

    console.log(
      `[${requestId}] Merged template_data:`,
      Object.keys(template_data_for_public_page)
    );

    const publicData = {
      id: waitlistData.id,
      name: waitlistData.name,
      description: waitlistData.description,
      slug: waitlistData.url_slug,
      published: true,
      template_data: template_data_for_public_page,
      created_at: waitlistData.created_at,
      updated_at: waitlistData.updated_at,
    };

    console.log(
      `[${requestId}] Returning public data with template fields:`,
      Object.keys(publicData.template_data)
    );

    return NextResponse.json(publicData);
  } catch (err) {
    console.error(
      `[${requestId}] Unexpected error in /api/waitlists/slug/[slug]:`,
      err.message,
      err.stack // Log stack for more details
    );
    return NextResponse.json(
      { error: "An unexpected error occurred", details: err.message },
      { status: 500 }
    );
  }
}

// app/api/waitlists/slug/[slug]/route.js
import { createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const supabase = createClient({ cookies });
  const { slug } = params;

  if (!slug) {
    return NextResponse.json(
      { error: "Waitlist slug is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the waitlist data by slug, and join with customization_settings
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
      .eq("published", true) // Ensure only published waitlists are fetched
      .single();

    if (error) {
      console.error("Error fetching waitlist by slug from DB:", error.message);
      if (error.code === "PGRST116") {
        // PGRST116: "JSON object requested, multiple (or no) rows returned"
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
      return NextResponse.json(
        { error: "Waitlist not found or is not published" },
        { status: 404 }
      );
    }

    // Process customization settings
    // The Supabase JS client, when using a foreign key relationship like `customization_settings(*)`
    // and it's a one-to-one (enforced by UNIQUE(waitlist_id) on customization_settings),
    // should return `customization_settings` as an object, not an array.
    // If it were an array, `waitlistData.customization_settings[0]` would be needed.
    const settings = waitlistData.customization_settings || {};

    const template_data_for_public_page = {
      ...(settings.custom_fields || {}), // Spread fields from JSONB custom_fields first
    };

    // Explicitly add known direct columns from customization_settings, potentially overriding if they were also in custom_fields
    if (settings.theme_color !== undefined)
      template_data_for_public_page.theme_color = settings.theme_color;
    if (settings.logo_url !== undefined)
      template_data_for_public_page.logo_url = settings.logo_url;
    if (settings.redirect_url !== undefined)
      template_data_for_public_page.redirect_url = settings.redirect_url;
    if (settings.email_template !== undefined)
      template_data_for_public_page.email_template = settings.email_template;
    if (settings.show_social_proof !== undefined)
      template_data_for_public_page.show_social_proof =
        settings.show_social_proof;
    if (settings.show_referral !== undefined)
      template_data_for_public_page.show_referral = settings.show_referral;

    // Construct the public data
    const publicData = {
      id: waitlistData.id,
      name: waitlistData.name,
      description: waitlistData.description,
      slug: waitlistData.url_slug, // Use url_slug consistently
      template_data: template_data_for_public_page, // This contains all merged settings
      created_at: waitlistData.created_at,
      updated_at: waitlistData.updated_at,
    };

    return NextResponse.json(publicData);
  } catch (err) {
    console.error(
      "Unexpected error in /api/waitlists/slug/[slug]:",
      err.message,
      "Stack:",
      err.stack
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

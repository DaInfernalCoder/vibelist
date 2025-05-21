import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { nanoid } from "nanoid";
import {
  validateCustomizationData,
  mergeCustomizationSettings,
  getTemplateById,
  updateCustomizationSettings,
} from "@/lib/waitlist-templates";

/**
 * API route handler for publishing a waitlist
 *
 * Expected request body:
 * {
 *   name: string,             // Required: Name of the waitlist
 *   description?: string,     // Optional: Description of the waitlist
 *   templateId?: string,      // Optional: ID of the template to use
 *   customizationData: object // Required: Customization settings for the waitlist
 * }
 */
export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const requestData = await request.json().catch((err) => {
      console.error("Error parsing request body:", err);
      return {};
    });

    // Log request for debugging
    console.log(
      "Publish waitlist request:",
      JSON.stringify(requestData, null, 2)
    );

    const { name, description, templateId, customizationData } = requestData;

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Waitlist name is required" },
        { status: 400 }
      );
    }

    // Validate customization data - make sure it exists
    if (!customizationData) {
      return NextResponse.json(
        { error: "Customization data is required" },
        { status: 400 }
      );
    }

    // Validate customization data format
    const validationError = validateCustomizationData(customizationData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status }
      );
    }

    // Validate template ownership if templateId is provided
    let templateData = null;
    if (templateId) {
      // Validate templateId format
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          templateId
        )
      ) {
        return NextResponse.json(
          { error: "Invalid template ID format" },
          { status: 400 }
        );
      }

      // Fetch template and check ownership
      const { data: template, error: templateError } = await supabase
        .from("waitlist_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        console.error("Error fetching template:", templateError);
        return NextResponse.json(
          { error: "Error validating template" },
          { status: 500 }
        );
      }

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      if (template.user_id !== userId) {
        return NextResponse.json(
          { error: "You do not have permission to use this template" },
          { status: 403 }
        );
      }

      templateData = template;
    }

    // Generate slug from name
    let baseSlug = slugify(name, {
      lower: true, // Convert to lowercase
      strict: true, // Strip special characters
      locale: "en", // Use English locale rules
      trim: true, // Trim leading/trailing spaces
    });

    // Limit slug length to reasonable number
    if (baseSlug.length > 50) {
      baseSlug = baseSlug.substring(0, 50);
    }

    // Handle slug collision
    let slug = baseSlug;
    let slugExists = true;
    let attempts = 0;

    // Try up to 10 times to find a unique slug
    while (slugExists && attempts < 10) {
      // Check if slug exists in database
      const { data, error } = await supabase
        .from("waitlists")
        .select("id")
        .eq("url_slug", slug) // Using url_slug instead of slug
        .maybeSingle();

      if (error) {
        console.error("Error checking slug availability:", error);
        return NextResponse.json(
          { error: "Error checking slug availability" },
          { status: 500 }
        );
      }

      // If no data returned, slug is available
      if (!data) {
        slugExists = false;
      } else {
        // Append random string for uniqueness
        attempts++;
        // Use nanoid to generate a random 6-character string
        slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;
      }
    }

    // If we couldn't find a unique slug after all attempts
    if (slugExists) {
      return NextResponse.json(
        { error: "Unable to generate a unique slug, please try again" },
        { status: 500 }
      );
    }

    // Insert the new waitlist record
    const { data: waitlist, error: insertError } = await supabase
      .from("waitlists")
      .insert([
        {
          name,
          description: description || null,
          url_slug: slug, // Using url_slug instead of slug
          owner_id: userId,
          status: "published",
          published: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating waitlist:", insertError);
      return NextResponse.json(
        { error: "Failed to create waitlist" },
        { status: 500 }
      );
    }

    // Prepare final customization settings
    let finalSettings = mergeCustomizationSettings(
      templateData,
      customizationData
    );

    // Update customization settings
    const settingsResult = await updateCustomizationSettings(
      supabase,
      waitlist.id,
      finalSettings
    );

    if (!settingsResult.success) {
      console.error("Error with customization settings:", settingsResult.error);
      // Don't fail the whole request due to settings issues
    }

    // Return the created waitlist with success status
    return NextResponse.json(waitlist, { status: 201 });
  } catch (err) {
    console.error("Unexpected error creating waitlist:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// app/api/waitlists/publish/route.js
import { createClient } from "@/libs/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { nanoid } from "nanoid";
import {
  validateCustomizationData,
  mergeCustomizationSettings,
  // getTemplateById, // Not used directly here, but available
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
    const supabase = createClient();

    console.log("Attempting to get session...");
    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError.message);
      return NextResponse.json(
        { error: "Failed to authenticate session" },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(
      `Session retrieved for UserID: ${userId}. Parsing request body...`
    );

    // Parse request body
    const requestData = await request.json().catch((err) => {
      console.error("Error parsing request body:", err.message);
      // Return a marker or throw to be caught by the main try-catch
      throw new Error("Invalid JSON in request body");
    });

    console.log(
      "Publish waitlist request payload:",
      JSON.stringify(requestData, null, 2)
    );

    const { name, description, templateId, customizationData } = requestData;

    console.log("Basic validation: Checking name and customizationData...");
    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Waitlist name is required" },
        { status: 400 }
      );
    }

    if (!customizationData) {
      return NextResponse.json(
        { error: "Customization data is required" },
        { status: 400 }
      );
    }
    console.log(
      "Name and customizationData exist. Validating customizationData format..."
    );

    const validationError = validateCustomizationData(customizationData);
    if (validationError) {
      console.error(
        "Customization data validation failed:",
        validationError.error
      );
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status }
      );
    }
    console.log(
      "CustomizationData format valid. Validating templateId if provided..."
    );

    // Validate template ownership if templateId is provided
    let dbTemplate = null; // Renamed to avoid confusion with `templateData` from context/editor
    if (templateId) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          templateId
        )
      ) {
        console.error("Invalid template ID format:", templateId);
        return NextResponse.json(
          { error: "Invalid template ID format" },
          { status: 400 }
        );
      }

      console.log(`Fetching template with ID: ${templateId}`);
      const { data: fetchedTemplate, error: templateFetchError } =
        await supabase
          .from("waitlist_templates")
          .select("*")
          .eq("id", templateId)
          .single();

      if (templateFetchError) {
        console.error(
          "Error fetching template from DB:",
          templateFetchError.message
        );
        return NextResponse.json(
          { error: "Error validating template" },
          { status: 500 }
        );
      }

      if (!fetchedTemplate) {
        console.warn("Template not found in DB for ID:", templateId);
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      if (fetchedTemplate.user_id !== userId) {
        console.error(
          "Template ownership validation failed. User does not own template."
        );
        return NextResponse.json(
          { error: "You do not have permission to use this template" },
          { status: 403 }
        );
      }
      dbTemplate = fetchedTemplate;
      console.log("Template validation successful.");
    } else {
      console.log("No templateId provided, proceeding without DB template.");
    }

    console.log("Generating slug...");
    // Generate slug from name
    let baseSlug = slugify(name, {
      lower: true,
      strict: true,
      locale: "en",
      trim: true,
    });

    if (!baseSlug) {
      // Handle cases where name results in empty slug (e.g. name is all special chars)
      baseSlug = `waitlist-${nanoid(8).toLowerCase()}`;
    }

    if (baseSlug.length > 50) {
      baseSlug = baseSlug.substring(0, 50);
      if (baseSlug.endsWith("-")) {
        // Avoid ending with a dash after truncation
        baseSlug = baseSlug.slice(0, -1);
      }
    }

    let slug = baseSlug;
    let slugExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (slugExists && attempts < maxAttempts) {
      console.log(
        `Checking slug availability (attempt ${attempts + 1}): ${slug}`
      );
      const { data: existingSlug, error: slugCheckError } = await supabase
        .from("waitlists")
        .select("id")
        .eq("url_slug", slug)
        .maybeSingle();

      if (slugCheckError) {
        console.error(
          "Error checking slug availability:",
          slugCheckError.message
        );
        return NextResponse.json(
          { error: "Error checking slug availability" },
          { status: 500 }
        );
      }

      if (!existingSlug) {
        slugExists = false;
      } else {
        attempts++;
        slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;
      }
    }

    if (slugExists) {
      console.error(
        `Unable to generate a unique slug after ${maxAttempts} attempts for base: ${baseSlug}`
      );
      return NextResponse.json(
        {
          error:
            "Unable to generate a unique slug, please try a different name or try again",
        },
        { status: 500 }
      );
    }
    console.log(`Slug generated: ${slug}. Inserting waitlist into DB...`);

    // Insert the new waitlist record
    const { data: waitlist, error: insertError } = await supabase
      .from("waitlists")
      .insert([
        {
          name,
          description: description || null,
          url_slug: slug,
          owner_id: userId,
          status: "published",
          published: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating waitlist in DB:", insertError.message);
      return NextResponse.json(
        { error: `Failed to create waitlist: ${insertError.message}` },
        { status: 500 }
      );
    }
    console.log(
      `Waitlist inserted with ID: ${waitlist.id}. Preparing final settings...`
    );

    // Prepare final customization settings
    // dbTemplate is the template loaded from DB (if templateId was provided)
    // customizationData is from the request body (current editor state)
    let finalSettings = mergeCustomizationSettings(
      dbTemplate,
      customizationData
    );
    console.log("Settings merged. Updating customization settings in DB...");

    // Update customization settings
    const settingsResult = await updateCustomizationSettings(
      supabase,
      waitlist.id,
      finalSettings
    );

    if (!settingsResult.success) {
      // Log the error but don't necessarily fail the whole request,
      // as the waitlist itself was created.
      console.error(
        "Error with customization settings (non-fatal for waitlist creation):",
        settingsResult.error
      );
    } else {
      console.log("Customization settings updated successfully.");
    }

    console.log("Publish process complete. Returning response...");
    return NextResponse.json(waitlist, { status: 201 });
  } catch (err) {
    console.error(
      "Unexpected error in /api/waitlists/publish:",
      err.message,
      "Stack:",
      err.stack,
      "Full Error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during publishing" },
      { status: 500 }
    );
  }
}

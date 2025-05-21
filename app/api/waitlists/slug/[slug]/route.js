import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { slug } = params;

  if (!slug) {
    return NextResponse.json(
      { error: "Waitlist slug is required" },
      { status: 400 }
    );
  }

  // Fetch the waitlist data by slug
  const { data, error } = await supabase
    .from("waitlists")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching waitlist by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Waitlist not found or is not published" },
      { status: 404 }
    );
  }

  // Return only the necessary data for public consumption
  const publicData = {
    id: data.id,
    name: data.name,
    description: data.description,
    slug: data.slug,
    template_data: data.template_data,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return NextResponse.json(publicData);
}

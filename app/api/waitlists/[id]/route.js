// app/api/waitlists/[id]/route.js
import { createClient } from "@/libs/supabase/server"; // Use the server client
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = createClient(); // Correctly initializes server client

    // Verify user is authenticated
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
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Waitlist ID is required" },
        { status: 400 }
      );
    }

    // Fetch the waitlist data
    const { data, error } = await supabase
      .from("waitlists")
      .select("*")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();

    if (error) {
      console.error("Error fetching waitlist:", error);
      return NextResponse.json(
        { error: "Failed to fetch waitlist" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Waitlist not found or you do not have permission to access it",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error fetching waitlist:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

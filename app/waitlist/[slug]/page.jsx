import { createClient } from "@/libs/supabase/server";
import { PublicWaitlistClient } from "./client";
import { notFound } from "next/navigation";
import { getBaseUrl, getWaitlistUrl } from "@/lib/url-utils";

// Generate a unique request ID for server-side tracing
const generateServerRequestId = () => {
  return `wl_srv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Generate metadata for the page based on the waitlist data
export async function generateMetadata({ params }) {
  const requestId = generateServerRequestId();
  console.log(
    `[${requestId}] Generating metadata for waitlist slug: ${params.slug}`
  );

  const { slug } = params;

  if (!slug) {
    console.warn(`[${requestId}] No slug provided for metadata generation`);
    return {
      title: "Waitlist | Vibelist",
      description: "Join our waitlist to get early access",
    };
  }

  try {
    console.log(`[${requestId}] Creating Supabase server client for metadata`);
    const supabase = createClient();

    console.log(
      `[${requestId}] Executing Supabase query for metadata: url_slug=${slug}`
    );
    // Fetch the waitlist by slug
    const { data: waitlist, error } = await supabase
      .from("waitlists")
      .select(
        "id, name, description, template_data, owner_id, customization_settings(*)"
      )
      .eq("url_slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      console.error(
        `[${requestId}] Error fetching waitlist for metadata:`,
        error
      );
      return {
        title: "Waitlist Not Found | Vibelist",
        description:
          "The waitlist you are looking for does not exist or is not published yet.",
      };
    }

    if (!waitlist) {
      console.warn(`[${requestId}] No waitlist found for slug: ${slug}`);
      return {
        title: "Waitlist Not Found | Vibelist",
        description:
          "The waitlist you are looking for does not exist or is not published yet.",
      };
    }

    console.log(`[${requestId}] Waitlist found for metadata:`, {
      id: waitlist.id,
      name: waitlist.name,
      hasTemplateData: !!waitlist.template_data,
      hasCustomizationSettings: !!waitlist.customization_settings,
    });

    // Extract custom values from customization_settings
    let customizationSettings = waitlist.customization_settings || {};
    let customFields = customizationSettings.custom_fields || {};

    console.log(`[${requestId}] Extracted customization data for metadata:`, {
      hasThemeColor: !!customizationSettings.theme_color,
      customFieldsCount: Object.keys(customFields).length,
      logoUrl: customizationSettings.logo_url ? "Set" : "Not set",
    });

    // Construct metadata
    const title = waitlist.name || "Join Our Waitlist";
    const description =
      waitlist.description ||
      customFields.description_text ||
      "Sign up to get early access";
    const logoUrl =
      customizationSettings.logo_url || `${getBaseUrl()}/logo.png`;
    const url = getWaitlistUrl(slug);

    console.log(`[${requestId}] Generated metadata with title: ${title}`);

    return {
      title: `${title} | Vibelist`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: url,
        images: [
          {
            url: logoUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [logoUrl],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error(
      `[${requestId}] Unexpected error generating metadata:`,
      error
    );
    return {
      title: "Waitlist | Vibelist",
      description: "Join our waitlist to get early access",
    };
  }
}

export default function WaitlistPage() {
  return <PublicWaitlistClient />;
}

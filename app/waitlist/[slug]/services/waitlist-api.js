// API service for fetching waitlist data
export const fetchWaitlistFromAPI = async (slug, requestId) => {
  if (!slug) return null;

  console.log(`[${requestId}] Attempting to fetch waitlist from API: ${slug}`);

  try {
    const apiUrl = `/api/waitlists/slug/${slug}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `[${requestId}] API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const apiData = await response.json();
    console.log(`[${requestId}] API data received:`, {
      id: apiData.id,
      name: apiData.name,
      hasTemplateData: !!apiData.template_data,
      templateDataFields: apiData.template_data
        ? Object.keys(apiData.template_data).length
        : 0,
    });

    return apiData;
  } catch (err) {
    console.error(`[${requestId}] Error fetching from API:`, err);
    return null;
  }
};

// Supabase service for fetching waitlist data
export const fetchWaitlistFromSupabase = async (slug, supabase, requestId) => {
  if (!slug) {
    console.error(`[${requestId}] No slug parameter provided`);
    throw new Error("NO_SLUG");
  }

  console.log(`[${requestId}] Starting waitlist fetch for slug: ${slug}`);

  const startTime = performance.now();

  const { data: waitlistData, error: waitlistError } = await supabase
    .from("waitlists")
    .select(
      `id, name, description, url_slug, published, created_at, updated_at, customization_settings (*)`
    )
    .eq("url_slug", slug)
    .eq("published", true)
    .single();

  const queryTime = performance.now() - startTime;
  console.log(
    `[${requestId}] Supabase query completed in ${queryTime.toFixed(2)}ms`
  );

  if (waitlistError) {
    console.error(`[${requestId}] Supabase query error:`, waitlistError);
    throw waitlistError;
  }

  if (!waitlistData) {
    console.error(`[${requestId}] No waitlist data returned for slug: ${slug}`);
    throw new Error("NO_DATA");
  }

  console.log(`[${requestId}] Retrieved waitlist data via direct query:`, {
    id: waitlistData.id,
    name: waitlistData.name,
    slug: waitlistData.url_slug,
    hasCustomizationSettings: !!waitlistData.customization_settings,
  });

  return waitlistData;
};

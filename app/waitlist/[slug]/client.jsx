"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/libs/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Copy,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  CheckCircle,
} from "lucide-react";
import { getBaseUrl, getWaitlistUrl } from "@/lib/url-utils";
import DynamicForm from "./components/DynamicForm";
import { defaultTemplate } from "@/app/dashboard/create/utils/templateUtils"; // Import defaultTemplate for keys

const generateRequestId = () => {
  return `wl_client_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const WAITLIST_STATES = {
  INITIAL: "initial",
  LOADING: "loading",
  READY: "ready",
  API_FALLBACK: "api_fallback",
  ERROR: "error",
  NOT_FOUND: "not_found",
};

// Helper to convert snake_case to camelCase
const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

export function PublicWaitlistClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [waitlist, setWaitlist] = useState(null);
  const [componentState, setComponentState] = useState(WAITLIST_STATES.INITIAL);
  const [error, setError] = useState(null);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [requestId] = useState(generateRequestId());
  const [apiWaitlist, setApiWaitlist] = useState(null);
  const [usingApiData, setUsingApiData] = useState(false);
  const timeoutRef = useRef(null);
  const supabase = createClient();

  const [customStyles, setCustomStyles] = useState(defaultTemplate);

  const getPageUrl = () => {
    return getWaitlistUrl(params.slug);
  };

  const applyCSSVariables = (stylesToApply) => {
    console.log(
      `[${requestId}] Setting up custom CSS variables from resolved styles:`,
      Object.keys(stylesToApply)
    );
    let styleEl = document.getElementById("waitlist-custom-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "waitlist-custom-styles";
      document.head.appendChild(styleEl);
      console.log(`[${requestId}] Created new style element for custom CSS`);
    }

    const cssVariables = `
      :root {
        --waitlist-background-color: ${stylesToApply.bgColor || "#ffffff"};
        --waitlist-text-color: ${stylesToApply.headingTextColor || "#000000"}; /* Adjusted to headingTextColor for main text */
        --waitlist-theme-color: ${stylesToApply.themeColor || stylesToApply.buttonColor || "#3B82F6"};
        --waitlist-secondary-color: ${stylesToApply.secondaryColor || stylesToApply.buttonColor || "#9333ea"};
        --waitlist-accent-color: ${stylesToApply.accentColor || stylesToApply.pingDotColor || "#f97316"};
        --waitlist-font-family: ${stylesToApply.fontFamily || "Inter, system-ui, sans-serif"};
        
        --waitlist-button-text-color: ${stylesToApply.buttonTextColor || "#ffffff"};
        --waitlist-button-border-radius: ${stylesToApply.inputBorderRadius || "0.375rem"}; /* Use inputBorderRadius for button consistency */
        
        --waitlist-input-background-color: ${stylesToApply.inputColor || "#f8fafc"};
        --waitlist-input-border-color: ${stylesToApply.inputBorderColor || "#e2e8f0"};
        --waitlist-input-border-radius: ${stylesToApply.inputBorderRadius || "0.375rem"};
        
        --waitlist-card-background-color: ${stylesToApply.cardBackgroundColor || "#ffffff"};
        --waitlist-card-border-color: ${stylesToApply.cardBorderColor || "#e2e8f0"};
        --waitlist-card-border-radius: ${stylesToApply.cardBorderRadius || "0.5rem"};

        --waitlist-signup-text-color: ${stylesToApply.signupTextColor || "#4b5563"};
        --waitlist-ping-dot-color: ${stylesToApply.pingDotColor || "#10b981"};
      }
      
      .waitlist-page {
        background-color: var(--waitlist-background-color);
        color: white; /* Main page text color */
        font-family: var(--waitlist-font-family);
      }
      
      .waitlist-card {
        background-color: var(--waitlist-card-background-color) !important;
        border-color: var(--waitlist-card-border-color);
        border-radius: var(--waitlist-card-border-radius);
        border-width: 1px; 
        border-style: solid;
      }

      .waitlist-card-title {
         color: var(--waitlist-text-color); /* For CardTitle */
      }

      .waitlist-card-description {
         color: var(--waitlist-signup-text-color); /* For CardDescription */
      }
      
      .waitlist-input {
        background-color: var(--waitlist-input-background-color);
        border-color: var(--waitlist-input-border-color);
        border-radius: var(--waitlist-input-border-radius);
        color: var(--waitlist-text-color);
      }
      
      .waitlist-button {
        background-color: var(--waitlist-theme-color);
        color: var(--waitlist-button-text-color);
        border-radius: var(--waitlist-button-border-radius);
      }
      
      .waitlist-button:hover {
        background-color: var(--waitlist-secondary-color);
      }
      
      .waitlist-accent-color {
        color: var(--waitlist-accent-color);
      }

      .waitlist-poweredby-link {
        color: var(--waitlist-accent-color) !important;
      }
      .waitlist-social-proof-text {
        color: var(--waitlist-signup-text-color);
      }
      .waitlist-ping-dot {
        background-color: var(--waitlist-ping-dot-color);
      }
    `;

    styleEl.textContent = cssVariables;
    console.log(
      `[${requestId}] Applied custom CSS variables to page via applyCSSVariables.`
    );
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchWaitlistFromAPI() {
      if (!params.slug) return;
      console.log(
        `[${requestId}] Attempting to fetch waitlist from API: ${params.slug}`
      );
      try {
        const apiUrl = `/api/waitlists/slug/${params.slug}`;
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
        if (isMounted) setApiWaitlist(apiData);
        return apiData;
      } catch (err) {
        console.error(`[${requestId}] Error fetching from API:`, err);
        return null;
      }
    }
    fetchWaitlistFromAPI();
    return () => {
      isMounted = false;
    };
  }, [params.slug, requestId]);

  useEffect(() => {
    if (componentState === WAITLIST_STATES.LOADING) {
      timeoutRef.current = setTimeout(() => {
        console.log(
          `[${requestId}] Loading timeout reached, checking for fallback options`
        );
        if (apiWaitlist && !waitlist) {
          console.log(`[${requestId}] Timeout fallback: using API data`);
          setWaitlist(apiWaitlist);
          setUsingApiData(true);
          setComponentState(WAITLIST_STATES.API_FALLBACK);
          if (apiWaitlist.template_data) {
            console.log(
              `[${requestId}] Applying customization from API template_data (timeout fallback)`
            );
            // API template_data should already be camelCased by the API route
            const resolvedStyles = {
              ...defaultTemplate,
              ...apiWaitlist.template_data,
            };
            setCustomStyles(resolvedStyles);
            requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
          }
        } else if (!waitlist) {
          console.error(
            `[${requestId}] Timeout reached with no data available`
          );
          setError("Timed out while loading waitlist. Please try again.");
          setComponentState(WAITLIST_STATES.ERROR);
        }
      }, 5000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [componentState, apiWaitlist, waitlist, requestId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchWaitlist() {
      if (!params.slug) {
        console.error(`[${requestId}] No slug parameter provided`);
        if (isMounted) setComponentState(WAITLIST_STATES.NOT_FOUND);
        return;
      }
      if (isMounted) setComponentState(WAITLIST_STATES.LOADING);
      console.log(
        `[${requestId}] Starting waitlist fetch for slug: ${params.slug}`
      );
      const startTime = performance.now();
      try {
        setError(null);
        const { data: waitlistData, error: waitlistError } = await supabase
          .from("waitlists")
          .select(
            `id, name, description, url_slug, published, created_at, updated_at, customization_settings (*)`
          )
          .eq("url_slug", params.slug)
          .eq("published", true)
          .eq("status", "published")
          .single();
        const queryTime = performance.now() - startTime;
        console.log(
          `[${requestId}] Supabase query completed in ${queryTime.toFixed(2)}ms`
        );
        if (!isMounted) return;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (waitlistError) {
          console.error(`[${requestId}] Supabase query error:`, waitlistError);
          if (apiWaitlist) {
            console.log(`[${requestId}] Falling back to API data for waitlist`);
            setWaitlist(apiWaitlist);
            setUsingApiData(true);
            setComponentState(WAITLIST_STATES.API_FALLBACK);
            if (apiWaitlist.template_data) {
              console.log(
                `[${requestId}] Applying customization from API template_data`
              );
              const resolvedStyles = {
                ...defaultTemplate,
                ...apiWaitlist.template_data,
              };
              setCustomStyles(resolvedStyles);
              requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
            }
          } else {
            setError(waitlistError?.message || "Waitlist not found");
            setComponentState(WAITLIST_STATES.ERROR);
          }
        } else if (!waitlistData) {
          console.error(
            `[${requestId}] No waitlist data returned for slug: ${params.slug}`
          );
          if (apiWaitlist) {
            console.log(
              `[${requestId}] Falling back to API data for waitlist (no data case)`
            );
            setWaitlist(apiWaitlist);
            setUsingApiData(true);
            setComponentState(WAITLIST_STATES.API_FALLBACK);
            if (apiWaitlist.template_data) {
              console.log(
                `[${requestId}] Applying customization from API template_data`
              );
              const resolvedStyles = {
                ...defaultTemplate,
                ...apiWaitlist.template_data,
              };
              setCustomStyles(resolvedStyles);
              requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
            }
          } else {
            setComponentState(WAITLIST_STATES.NOT_FOUND);
          }
        } else {
          console.log(
            `[${requestId}] Retrieved waitlist data via direct query:`,
            {
              id: waitlistData.id,
              name: waitlistData.name,
              slug: waitlistData.url_slug,
              hasCustomizationSettings: !!waitlistData.customization_settings,
            }
          );
          setWaitlist(waitlistData);
          setComponentState(WAITLIST_STATES.READY);

          const directDBSettings = waitlistData.customization_settings;
          if (directDBSettings) {
            console.log(
              `[${requestId}] Processing direct DB customization settings`
            );
            const resolvedStyles = { ...defaultTemplate }; // Start with global defaults

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

            console.log(`[${requestId}] Updated styles from direct DB:`, {
              themeColor: resolvedStyles.themeColor,
              logoUrl: resolvedStyles.logoUrl ? "Set" : "Not set",
              heroText: resolvedStyles.heroText?.substring(0, 20) + "...",
            });
            setCustomStyles(resolvedStyles);
            requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
          } else if (apiWaitlist && apiWaitlist.template_data) {
            console.log(
              `[${requestId}] No direct DB customization settings, falling back to API template_data`
            );
            const resolvedStyles = {
              ...defaultTemplate,
              ...apiWaitlist.template_data,
            };
            setCustomStyles(resolvedStyles);
            requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
          } else {
            console.warn(
              `[${requestId}] No customization settings found for waitlist ${waitlistData.id}`
            );
            // applyCSSVariables will use defaults from customStyles state
            requestAnimationFrame(() => applyCSSVariables(customStyles));
          }
        }
        const totalTime = performance.now() - startTime;
        console.log(
          `[${requestId}] Waitlist fetch and processing completed in ${totalTime.toFixed(2)}ms`
        );
      } catch (err) {
        console.error(`[${requestId}] Error fetching waitlist:`, err);
        if (!isMounted) return;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (apiWaitlist && !usingApiData) {
          console.log(`[${requestId}] Last resort: falling back to API data`);
          setWaitlist(apiWaitlist);
          setUsingApiData(true);
          setComponentState(WAITLIST_STATES.API_FALLBACK);
          if (apiWaitlist.template_data) {
            console.log(
              `[${requestId}] Applying customization from API template_data (last resort)`
            );
            const resolvedStyles = {
              ...defaultTemplate,
              ...apiWaitlist.template_data,
            };
            setCustomStyles(resolvedStyles);
            requestAnimationFrame(() => applyCSSVariables(resolvedStyles));
          }
        } else {
          setError(err.message || "Failed to load waitlist");
          setComponentState(WAITLIST_STATES.ERROR);
        }
      }
    }
    fetchWaitlist();
    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [params.slug, supabase, requestId, apiWaitlist, usingApiData]); // `customStyles` removed from deps to avoid loop with setCustomStyles

  // Social sharing functions (kept brief as they are not the core issue)
  const trackShareEvent = (platform) => {
    /* ... */
  };
  const shareOnTwitter = () => {
    /* ... */
  };
  const shareOnFacebook = () => {
    /* ... */
  };
  const shareOnLinkedIn = () => {
    /* ... */
  };
  const copyToClipboard = () => {
    /* ... */
  };

  const getTrackingData = () => {
    return {
      ref: searchParams.get("ref") || null,
      utm_source: searchParams.get("utm_source") || null,
      utm_medium: searchParams.get("utm_medium") || null,
      utm_campaign: searchParams.get("utm_campaign") || null,
    };
  };

  const handleSubmissionSuccess = () => {
    setIsSignedUp(true);
    setShowShareOptions(customStyles.showReferral || false); // Use showReferral from customStyles
  };

  const SocialShareSection = () => (
    <div className="mt-8 space-y-4">
      <h3
        className="text-lg font-semibold text-center"
        style={{ color: customStyles.headingTextColor }}
      >
        Share this waitlist
      </h3>
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={shareOnTwitter}
          title="Share on Twitter"
          aria-label="Share on Twitter"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Twitter className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={shareOnFacebook}
          title="Share on Facebook"
          aria-label="Share on Facebook"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Facebook className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={shareOnLinkedIn}
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Linkedin className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          title="Copy link"
          aria-label="Copy link"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          {copySuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );

  if (
    componentState === WAITLIST_STATES.LOADING ||
    componentState === WAITLIST_STATES.INITIAL
  ) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 waitlist-page"
        style={{ backgroundColor: customStyles.bgColor }}
      >
        <div className="text-center animate-fade-in">
          <Loader2
            className="h-8 w-8 animate-spin mx-auto mb-4"
            style={{ color: customStyles.headingTextColor }}
          />
          <p style={{ color: customStyles.headingTextColor }}>
            Loading waitlist...
          </p>
        </div>
      </div>
    );
  }

  if (componentState === WAITLIST_STATES.ERROR) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 waitlist-page"
        style={{ backgroundColor: customStyles.bgColor }}
      >
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: customStyles.headingTextColor }}
          >
            Oops! Something went wrong
          </h2>
          <p className="mb-6" style={{ color: customStyles.signupTextColor }}>
            {error || "An error occurred while loading the waitlist."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            style={{
              borderColor: customStyles.themeColor,
              color: customStyles.themeColor,
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (componentState === WAITLIST_STATES.NOT_FOUND || !waitlist) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 waitlist-page"
        style={{ backgroundColor: customStyles.bgColor }}
      >
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: customStyles.headingTextColor }}
          >
            Waitlist Not Found
          </h2>
          <p className="mb-6" style={{ color: customStyles.signupTextColor }}>
            This waitlist doesn&apos;t exist or has been removed.
          </p>
          <Button
            asChild
            variant="outline"
            style={{
              borderColor: customStyles.themeColor,
              color: customStyles.themeColor,
            }}
          >
            <a href={getBaseUrl()}>Go home</a>
          </Button>
        </div>
      </div>
    );
  }

  // Log final customStyles being used for render
  console.log(`[${requestId}] Rendering with customStyles:`, customStyles);

  return (
    <div className="min-h-screen flex flex-col waitlist-page animate-fade-in">
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md mx-auto waitlist-card">
          <CardHeader className="text-center">
            {customStyles.showLogo && customStyles.logoUrl && (
              <div className="flex justify-center mb-4">
                <Image
                  src={customStyles.logoUrl}
                  alt={waitlist.name || "Waitlist Logo"}
                  width={
                    100 * parseFloat(customStyles.logoSize?.replace("X", "")) ||
                    100
                  } // Adjust width based on logoSize
                  height={
                    100 * parseFloat(customStyles.logoSize?.replace("X", "")) ||
                    100
                  } // Adjust height
                  className="object-contain max-h-24" // Max height to prevent overly large logos
                />
              </div>
            )}
            <CardTitle className="text-2xl md:text-3xl font-bold waitlist-card-title">
              {customStyles.heroText || waitlist.name}
            </CardTitle>
            <CardDescription className="mt-2 text-base waitlist-card-description">
              {customStyles.subText || waitlist.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSignedUp ? (
              <DynamicForm
                waitlistId={waitlist.id}
                themeColor={customStyles.buttonColor} // Use buttonColor for DynamicForm theme
                buttonText={customStyles.buttonText}
                buttonTextColor={customStyles.buttonTextColor}
                inputBackgroundColor={customStyles.inputColor}
                inputBorderColor={customStyles.inputBorderColor}
                inputBorderRadius={customStyles.inputBorderRadius}
                buttonBorderRadius={customStyles.inputBorderRadius} // Consistent radius
                textColor={customStyles.headingTextColor} // Use headingTextColor for form labels
                onSubmitSuccess={handleSubmissionSuccess}
                customFields={customStyles} // Pass all customStyles as potential custom fields
                trackingData={getTrackingData()}
                placeholderInputText={customStyles.placeholderInputText}
              />
            ) : (
              <>
                <div className="flex flex-col items-center justify-center space-y-4 text-center p-4">
                  <CheckCircle
                    className="h-16 w-16"
                    style={{ color: customStyles.buttonColor }}
                  />
                  <h3
                    className="text-xl font-bold mt-4"
                    style={{ color: customStyles.headingTextColor }}
                  >
                    {customStyles.successMessage || "You're on the list!"}
                  </h3>
                </div>
                {showShareOptions && <SocialShareSection />}
              </>
            )}
            {customStyles.showSocialProof && !isSignedUp && (
              <div className="flex items-center justify-center gap-2 text-sm mt-6">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-200 border-2 border-[var(--waitlist-background-color)]"
                    ></div>
                  ))}
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 waitlist-ping-dot"></span>
                  <span className="waitlist-social-proof-text">
                    Be the first to join
                  </span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center text-xs pt-2 pb-4">
            {!customStyles.whiteLabel && (
              <p
                style={{
                  color: `color-mix(in srgb, ${customStyles.signupTextColor || "#000000"} 60%, transparent)`,
                }}
              >
                Powered by{" "}
                <a
                  href={getBaseUrl()}
                  className="underline waitlist-poweredby-link"
                >
                  Vibelist
                </a>
              </p>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/libs/supabase/client";
import { WAITLIST_STATES } from "../types";
import {
  fetchWaitlistFromAPI,
  fetchWaitlistFromSupabase,
} from "../services/waitlist-api";
import { processCustomizationSettings, snakeToCamel } from "../utils";
import { applyCSSVariables } from "../utils/styling";
import { defaultTemplate } from "@/app/dashboard/create/utils/templateUtils";

export const useWaitlistData = (slug, requestId) => {
  const [waitlist, setWaitlist] = useState(null);
  const [componentState, setComponentState] = useState(WAITLIST_STATES.INITIAL);
  const [error, setError] = useState(null);
  const [apiWaitlist, setApiWaitlist] = useState(null);
  const [usingApiData, setUsingApiData] = useState(false);
  const [customStyles, setCustomStyles] = useState(defaultTemplate);
  const timeoutRef = useRef(null);
  const supabase = createClient();

  // Fetch waitlist from API (fallback)
  useEffect(() => {
    let isMounted = true;

    const fetchFromAPI = async () => {
      const apiData = await fetchWaitlistFromAPI(slug, requestId);
      if (isMounted && apiData) {
        setApiWaitlist(apiData);
      }
    };

    fetchFromAPI();

    return () => {
      isMounted = false;
    };
  }, [slug, requestId]);

  // Handle timeout fallback
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
            const resolvedStyles = {
              ...defaultTemplate,
              ...apiWaitlist.template_data,
            };
            setCustomStyles(resolvedStyles);
            requestAnimationFrame(() =>
              applyCSSVariables(resolvedStyles, requestId)
            );
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

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;

    const fetchWaitlist = async () => {
      if (!slug) {
        console.error(`[${requestId}] No slug parameter provided`);
        if (isMounted) setComponentState(WAITLIST_STATES.NOT_FOUND);
        return;
      }

      if (isMounted) setComponentState(WAITLIST_STATES.LOADING);

      try {
        setError(null);
        const waitlistData = await fetchWaitlistFromSupabase(
          slug,
          supabase,
          requestId
        );

        if (!isMounted) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setWaitlist(waitlistData);
        setComponentState(WAITLIST_STATES.READY);

        // Process customization settings
        const directDBSettings = waitlistData.customization_settings;
        if (directDBSettings) {
          console.log(
            `[${requestId}] Processing direct DB customization settings`
          );

          const resolvedStyles = processCustomizationSettings(
            directDBSettings,
            defaultTemplate,
            snakeToCamel
          );

          console.log(`[${requestId}] Updated styles from direct DB:`, {
            themeColor: resolvedStyles.themeColor,
            logoUrl: resolvedStyles.logoUrl ? "Set" : "Not set",
            heroText: resolvedStyles.heroText?.substring(0, 20) + "...",
          });

          setCustomStyles(resolvedStyles);
          requestAnimationFrame(() =>
            applyCSSVariables(resolvedStyles, requestId)
          );
        } else if (apiWaitlist && apiWaitlist.template_data) {
          console.log(
            `[${requestId}] No direct DB customization settings, falling back to API template_data`
          );
          const resolvedStyles = {
            ...defaultTemplate,
            ...apiWaitlist.template_data,
          };
          setCustomStyles(resolvedStyles);
          requestAnimationFrame(() =>
            applyCSSVariables(resolvedStyles, requestId)
          );
        } else {
          console.warn(
            `[${requestId}] No customization settings found for waitlist ${waitlistData.id}`
          );
          requestAnimationFrame(() =>
            applyCSSVariables(customStyles, requestId)
          );
        }
      } catch (err) {
        console.error(`[${requestId}] Error fetching waitlist:`, err);
        if (!isMounted) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Handle specific error cases
        if (err.message === "NO_SLUG") {
          setComponentState(WAITLIST_STATES.NOT_FOUND);
          return;
        }

        // Try API fallback
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
            requestAnimationFrame(() =>
              applyCSSVariables(resolvedStyles, requestId)
            );
          }
        } else {
          setError(err.message || "Failed to load waitlist");
          setComponentState(WAITLIST_STATES.ERROR);
        }
      }
    };

    fetchWaitlist();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [slug, supabase, requestId, apiWaitlist, usingApiData]);

  return {
    waitlist,
    componentState,
    error,
    customStyles,
    usingApiData,
  };
};

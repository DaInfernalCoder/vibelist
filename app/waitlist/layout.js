"use client";

import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import ButtonInsighto from "@/components/ButtonInsighto";
import config from "@/config";
import { useEffect } from "react";

// Minimal Crisp chat support for waitlist pages (no authentication required)
const MinimalCrispChat = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // Hide crisp on waitlist pages by default for cleaner UX
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  return null;
};

// Minimal layout for waitlist pages - excludes SubscriptionProvider and authentication
// This improves performance and eliminates authentication errors on public signup pages
const WaitlistLayout = ({ children }) => {
  return (
    <ErrorBoundary
      title="Waitlist Error"
      message="We encountered an issue loading the waitlist. Please try refreshing the page."
      context={{ layout: "waitlist" }}
    >
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Waitlist content */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Minimal Crisp chat support */}
      <MinimalCrispChat />

      {/* Insighto feedback button */}
      <ButtonInsighto />
    </ErrorBoundary>
  );
};

export default WaitlistLayout;

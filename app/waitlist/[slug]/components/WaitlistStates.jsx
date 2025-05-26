"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getBaseUrl } from "@/lib/url-utils";

export const LoadingState = ({ customStyles }) => (
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

export const ErrorState = ({ error, customStyles }) => (
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

export const NotFoundState = ({ customStyles }) => (
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

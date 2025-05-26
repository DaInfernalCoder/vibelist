"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { getBaseUrl } from "@/lib/url-utils";
import DynamicForm from "./DynamicForm";
import SocialShareSection from "./SocialShareSection";

const WaitlistContent = ({
  waitlist,
  customStyles,
  trackingData,
  pageUrl,
  requestId,
}) => {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleSubmissionSuccess = () => {
    setIsSignedUp(true);
    setShowShareOptions(customStyles.showReferral || false);
  };

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
                  }
                  height={
                    100 * parseFloat(customStyles.logoSize?.replace("X", "")) ||
                    100
                  }
                  className="object-contain max-h-24"
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
                themeColor={customStyles.buttonColor}
                buttonText={customStyles.buttonText}
                buttonTextColor={customStyles.buttonTextColor}
                inputBackgroundColor={customStyles.inputColor}
                inputBorderColor={customStyles.inputBorderColor}
                inputBorderRadius={customStyles.inputBorderRadius}
                buttonBorderRadius={customStyles.inputBorderRadius}
                textColor={customStyles.headingTextColor}
                onSubmitSuccess={handleSubmissionSuccess}
                customFields={customStyles}
                trackingData={trackingData}
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
                {showShareOptions && (
                  <SocialShareSection
                    url={pageUrl}
                    title={waitlist.name}
                    customStyles={customStyles}
                  />
                )}
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
};

export default WaitlistContent;

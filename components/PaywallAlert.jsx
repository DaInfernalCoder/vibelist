"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * PaywallAlert component for showing upgrade prompts for premium features
 * @param {Object} props - Component props
 * @param {string} props.feature - Name of the feature being restricted
 * @param {string} props.description - Description of what the feature does
 * @param {string} props.className - Additional CSS classes
 */
export default function PaywallAlert({
  feature = "This feature",
  description = "This is a premium feature that requires a Pro subscription.",
  className = "",
}) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  return (
    <Alert
      className={`border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <Crown className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <AlertTitle className="text-amber-900 flex items-center gap-2">
            {feature} - Pro Feature
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </AlertTitle>
          <AlertDescription className="text-amber-800 mb-4">
            {description} Upgrade to Pro to unlock this feature and start
            getting the most out of VibeList.
          </AlertDescription>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUpgrade}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <div className="text-sm text-amber-700 flex items-center">
              <span className="font-medium">✓ Analytics & insights</span>
              <span className="mx-2">•</span>
              <span className="font-medium">✓ Marketing tools</span>
              <span className="mx-2">•</span>
              <span className="font-medium">✓ Advanced features</span>
            </div>
          </div>
        </div>
      </div>
    </Alert>
  );
}

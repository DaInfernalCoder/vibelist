"use client";

import { useSubscription } from "@/contexts/SubscriptionContext";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";

/**
 * PaywallAlert component for showing upgrade prompts for premium features
 * @param {Object} props - Component props
 * @param {string} props.feature - Name of the feature being restricted
 * @param {string} props.description - Description of what the feature does
 * @param {string} props.className - Additional CSS classes
 */
const PaywallAlert = ({
  feature = "Premium Feature",
  description = "This feature requires a premium subscription to access.",
  className = "",
}) => {
  const { hasValidAccess, isLoading } = useSubscription();

  // Don't show paywall if user has access or if still loading
  if (hasValidAccess || isLoading) {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Unlock {feature}
          </h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              ✅ Unlimited waitlists
            </span>
            <span className="flex items-center gap-1">
              ✅ Advanced analytics
            </span>
            <span className="flex items-center gap-1">✅ Custom branding</span>
            <span className="flex items-center gap-1">✅ Priority support</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ButtonCheckout
            priceId={config.stripe.plans[0].priceId}
            mode="payment"
            className="btn btn-primary"
          >
            Upgrade to Pro
          </ButtonCheckout>
        </div>
      </div>
    </div>
  );
};

export default PaywallAlert;

"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

const SubscriptionStatusNotification = () => {
  const {
    hasValidAccess,
    isLoading,
    error,
    lastRefresh,
    expiresAt,
    isAuthenticated,
  } = useSubscription();

  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Track subscription status changes
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    // Show success notification when subscription is activated
    if (hasValidAccess && lastRefresh) {
      const refreshTime = new Date(lastRefresh);
      const now = new Date();
      const timeDiff = now - refreshTime;

      // If the refresh was recent (within last 30 seconds), show success notification
      if (timeDiff < 30000) {
        setNotification({
          type: "success",
          title: "Premium Access Activated!",
          message:
            "Your subscription is now active. Enjoy all premium features!",
          icon: CheckCircle,
        });
        setShowNotification(true);

        // Auto-hide after 5 seconds
        setTimeout(() => setShowNotification(false), 5000);
      }
    }

    // Show warning for expiring subscriptions
    if (hasValidAccess && expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        setNotification({
          type: "warning",
          title: "Subscription Expiring Soon",
          message: `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Renew to continue enjoying premium features.`,
          icon: AlertTriangle,
        });
        setShowNotification(true);
      }
    }

    // Show error notification for subscription issues
    if (error && !hasValidAccess) {
      setNotification({
        type: "error",
        title: "Subscription Status Error",
        message:
          "Unable to verify your subscription status. Please try refreshing or contact support.",
        icon: AlertTriangle,
      });
      setShowNotification(true);
    }
  }, [
    hasValidAccess,
    isLoading,
    error,
    lastRefresh,
    expiresAt,
    isAuthenticated,
  ]);

  // Don't render if no notification or not authenticated
  if (!showNotification || !notification || !isAuthenticated) {
    return null;
  }

  const getNotificationStyles = () => {
    switch (notification.type) {
      case "success":
        return "alert-success";
      case "warning":
        return "alert-warning";
      case "error":
        return "alert-error";
      default:
        return "alert-info";
    }
  };

  const IconComponent = notification.icon;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`alert ${getNotificationStyles()} shadow-lg animate-slide-in-right`}
      >
        <IconComponent className="w-6 h-6" />
        <div>
          <h3 className="font-bold">{notification.title}</h3>
          <div className="text-xs">{notification.message}</div>
        </div>
        <button
          className="btn btn-sm btn-circle btn-ghost"
          onClick={() => setShowNotification(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Payment confirmation component for immediate feedback
export const PaymentConfirmationToast = ({ isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000); // Auto-close after 8 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="alert alert-success shadow-lg animate-slide-in-right">
        <CheckCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Payment Successful!</h3>
          <div className="text-xs">
            Your premium features are being activated. This may take a few
            moments.
          </div>
        </div>
        <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

// Subscription upgrade prompt component
export const SubscriptionUpgradePrompt = ({
  feature,
  onUpgrade,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="alert alert-info shadow-lg">
        <Info className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Upgrade to Access {feature}</h3>
          <div className="text-xs">
            This feature requires a premium subscription.
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-xs btn-primary" onClick={onUpgrade}>
            Upgrade
          </button>
          <button className="btn btn-xs btn-ghost" onClick={onDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusNotification;

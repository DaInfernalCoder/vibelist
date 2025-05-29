"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Crown, Sparkles } from "lucide-react";
import { getWaitlistDashboardUrl } from "@/lib/url-utils";
import { createClient } from "@/libs/supabase/client";

/**
 * Modal component for publishing a waitlist
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} props.templateData - Template data containing customization options
 */
export default function PublishWaitlistModal({
  isOpen,
  onClose,
  templateData,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check subscription status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkSubscriptionStatus();
      setName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  const checkSubscriptionStatus = async () => {
    setIsCheckingSubscription(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasValidSubscription(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("has_access, access_expires_at")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.has_access) {
        setHasValidSubscription(false);
        return;
      }

      // Check if subscription hasn't expired
      if (
        !profile.access_expires_at ||
        new Date(profile.access_expires_at) > new Date()
      ) {
        setHasValidSubscription(true);
      } else {
        setHasValidSubscription(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasValidSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleUpgradeClick = () => {
    router.push("/pricing");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block submission if no valid subscription
    if (!hasValidSubscription) {
      return;
    }

    // Basic validation
    if (!name.trim()) {
      setError("Waitlist name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Extract templateId if available
      const templateId = templateData?.id;

      // Prepare request payload with proper structure
      const payload = {
        name,
        description: description.trim() || undefined,
      };

      // Only include templateId if available
      if (templateId) {
        payload.templateId = templateId;
      }

      // Include customizationData properly
      if (templateData) {
        // Exclude the id property from customizationData
        const { id: _id, ...customizationData } = templateData;
        payload.customizationData = customizationData;
      }

      const response = await fetch("/api/waitlists/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish waitlist");
      }

      const data = await response.json();

      // Success! Show toast and redirect to sharing page
      toast({
        title: "Waitlist published successfully!",
        description: "Your waitlist is now live and ready to be shared.",
        variant: "success",
      });

      // Close the modal
      onClose();

      // Redirect to the sharing page for this waitlist
      const sharePageUrl = getWaitlistDashboardUrl(data.id);
      router.push(sharePageUrl);
    } catch (err) {
      console.error("Error publishing waitlist:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] relative">
          <DialogHeader>
            <DialogTitle>Publish Your Waitlist</DialogTitle>
            <DialogDescription>
              Give your waitlist a name and description. This information will
              be visible to users who join.
            </DialogDescription>
          </DialogHeader>

          {/* Main content */}
          <div
            className={`space-y-6 pt-4 transition-all duration-300 ${!hasValidSubscription && !isCheckingSubscription ? "blur-sm pointer-events-none" : ""}`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="waitlist-name">Waitlist Name</Label>
                <Input
                  id="waitlist-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product Launch"
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="waitlist-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe your waitlist"
                  disabled={isSubmitting}
                  className="w-full min-h-[100px]"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasValidSubscription}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Waitlist
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Loading overlay */}
          {isCheckingSubscription && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2 text-muted-foreground">
                  Checking subscription...
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade overlay - rendered as portal outside Dialog */}
      {!hasValidSubscription &&
        !isCheckingSubscription &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="mb-6">
                <Crown className="h-16 w-16 sm:h-20 sm:w-20 text-primary mx-auto mb-4" />
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500 mx-auto -mt-3" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                Upgrade to Pro
              </h3>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                Publishing waitlists is a premium feature. Upgrade to Pro to
                publish your waitlist and start collecting signups!
              </p>
              <div className="space-y-3 sm:space-y-4">
                <Button
                  onClick={handleUpgradeClick}
                  className="w-full"
                  size="lg"
                >
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Buy Now
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Go Back
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

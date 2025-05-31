"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { createClient } from "@/libs/supabase/client";

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyPaymentAndRefreshStatus = async () => {
      if (!sessionId) {
        // If no session ID, show error instead of auto-redirecting
        setError(
          "No payment session found. Please check your payment confirmation email or contact support."
        );
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        // If user is already authenticated and we have a session_id,
        // check if this is a repeat visit (they might have already seen this page)
        if (currentUser && sessionId) {
          // Check if they already have access - if so, they can still see the success page
          const { data: profile } = await supabase
            .from("profiles")
            .select("has_access")
            .eq("id", currentUser.id)
            .single();

          // Don't auto-redirect anymore - let user choose where to go
        }

        // Verify payment with our API first
        const response = await fetch(`/api/payment/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to verify payment");
        }

        const data = await response.json();
        setPaymentData(data);

        // If user is not authenticated but payment is valid, try to sign them in
        if (!currentUser && data.customerEmail) {
          try {
            // Send magic link to the customer's email
            const { error: signInError } = await supabase.auth.signInWithOtp({
              email: data.customerEmail,
              options: {
                shouldCreateUser: false, // User should already exist from webhook
                emailRedirectTo: `${window.location.origin}/payment/success?session_id=${sessionId}`,
              },
            });

            if (signInError) {
              console.error("Auto sign-in failed:", signInError);
              // Don't throw error, just show manual sign-in option
            } else {
              // Show message that magic link was sent
              setError(
                "Check your email for a sign-in link to complete setup!"
              );
              setIsLoading(false);
              return;
            }
          } catch (autoSignInError) {
            console.error("Auto sign-in error:", autoSignInError);
            // Continue with manual flow
          }
        }

        setUser(currentUser);

        // Set flag to show payment success notification when user navigates
        if (sessionId && data.success) {
          const notificationData = {
            timestamp: Date.now(),
            sessionId: sessionId,
          };
          localStorage.setItem(
            "show_payment_success_notification",
            JSON.stringify(notificationData)
          );
        }

        // Refresh subscription status
        const statusResponse = await fetch("/api/subscription/refresh", {
          method: "POST",
        });

        if (!statusResponse.ok) {
          console.warn("Failed to refresh subscription status");
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPaymentAndRefreshStatus();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-base-content/70">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-error mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-base-content mb-4">
            {error.includes("Check your email")
              ? "Sign In Required"
              : "Payment Verification Issue"}
          </h1>
          <p className="text-base-content/70 mb-6">{error}</p>
          {error.includes("Check your email") ? (
            <div className="space-y-3">
              <p className="text-sm text-base-content/60">
                We&apos;ve sent a magic link to your email. Click it to complete
                your account setup.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signin" className="btn btn-primary">
                  Sign In Manually
                </Link>
                <Link href="/dashboard" className="btn btn-outline">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link href="/pricing" className="btn btn-outline">
                View Pricing
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <CheckCircleIcon className="w-24 h-24 text-success mx-auto animate-bounce" />
              <SparklesIcon className="w-8 h-8 text-warning absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-base-content mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-xl text-base-content/70">
              Welcome to VibeList Pro! Your premium features are now unlocked.
              Thank you for supporting a small creator, I truly appreciate you
              from the bottom of my heart.
            </p>
          </div>

          {/* Payment Details Card */}
          {paymentData && (
            <div className="card bg-base-200 shadow-xl mb-8">
              <div className="card-body">
                <h2 className="card-title text-primary mb-4">
                  Payment Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Plan:</span>
                    <span className="font-semibold">
                      {paymentData.planName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Amount:</span>
                    <span className="font-semibold">${paymentData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">
                      Transaction ID:
                    </span>
                    <span className="font-mono text-sm">
                      {paymentData.transactionId}
                    </span>
                  </div>
                  {paymentData.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-base-content/70">
                        Access Until:
                      </span>
                      <span className="font-semibold">
                        {new Date(paymentData.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Premium Features Unlocked */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-black mb-4">
                <SparklesIcon className="w-6 h-6" />
                Premium Features Unlocked
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">
                    Advanced Analytics Dashboard
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">
                    Waitlist Marketplace Access
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">
                    Unlimited Waitlist Publishing
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">Priority Customer Support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">Custom Branding Options</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-black">Export Data & Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps with Clear Navigation */}
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold text-base-content mb-4">
              What&apos;s Next?
            </h3>
            <p className="text-base-content/70 mb-6">
              Choose where you&apos;d like to go next. Your premium features are
              ready to use!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="btn btn-lg text-white border-0"
                style={{ backgroundColor: "#9334E8" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7"
                  />
                </svg>
                Go to Dashboard
              </Link>
              <Link href="/dashboard/create" className="btn btn-outline btn-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Waitlist
              </Link>
              <Link href="/dashboard/market" className="btn btn-ghost btn-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                  />
                </svg>
                Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content/70">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;

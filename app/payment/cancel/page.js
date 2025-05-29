"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  XCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";
import { createClient } from "@/libs/supabase/client";

const PaymentCancelContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Cancel Icon */}
          <div className="mb-8">
            <XCircleIcon className="w-24 h-24 text-warning mx-auto" />
          </div>

          {/* Cancel Message */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-base-content mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-base-content/70 mb-6">
              No worries! Your payment was cancelled and no charges were made.
            </p>
            <p className="text-base-content/60">
              You can try again anytime or explore our free features.
            </p>
          </div>

          {/* What Happened Card */}
          <div className="card bg-base-200 shadow-xl mb-8">
            <div className="card-body text-left">
              <h2 className="card-title text-warning mb-4">What happened?</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-base-content/40 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base-content/70">
                    You cancelled the payment process before completion
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-base-content/40 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base-content/70">
                    No charges were made to your payment method
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-base-content/40 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base-content/70">
                    Your account remains on the free plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Free Features Available */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body text-left">
              <h2 className="card-title text-primary mb-4">
                Free Features Still Available
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Create up to 3 waitlists</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Basic analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Email notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Community support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn btn-primary btn-lg">
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Try Payment Again
              </Link>
              <Link href="/dashboard" className="btn btn-outline btn-lg">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Continue with Free Plan
              </Link>
            </div>

            {/* Alternative Options */}
            <div className="pt-6 border-t border-base-300">
              <p className="text-sm text-base-content/60 mb-4">
                Need help or have questions?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/pricing" className="btn btn-ghost btn-sm">
                  View Pricing Plans
                </Link>
                <Link
                  href="mailto:support@vibelist.com"
                  className="btn btn-ghost btn-sm"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>

          {/* Session Info (for debugging) */}
          {sessionId && (
            <div className="mt-8 p-4 bg-base-200 rounded-lg">
              <p className="text-xs text-base-content/50">
                Session ID: {sessionId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentCancelPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
};

export default PaymentCancelPage;

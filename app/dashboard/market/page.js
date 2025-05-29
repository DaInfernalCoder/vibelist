"use client";

import { useState, useEffect } from "react";
import { useWaitlist } from "@/contexts/WaitlistContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PaywallAlert from "@/components/PaywallAlert";

export default function MarketPage() {
  const { user } = useWaitlist();
  const { hasValidAccess, isLoading: isCheckingSubscription } =
    useSubscription();

  // Show loading state while checking subscription
  if (isCheckingSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market</h1>
            <p className="text-muted-foreground mt-2">
              Discover and promote your waitlists
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show paywall alert if user doesn't have valid subscription
  if (!hasValidAccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market</h1>
            <p className="text-muted-foreground mt-2">
              Discover and promote your waitlists
            </p>
          </div>
        </div>

        <PaywallAlert
          feature="Marketing Tools"
          description="Access advanced marketing tools to promote your waitlists, discover trending waitlists, and connect with other creators."
          className="max-w-4xl"
        />
      </div>
    );
  }

  // Main market content for paid users
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market</h1>
          <p className="text-muted-foreground mt-2">
            Discover and promote your waitlists
          </p>
        </div>
      </div>

      {/* Market content will go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Trending Waitlists</h2>
            <p>Discover what&apos;s popular in the waitlist community</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Explore</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Promote Your Waitlist</h2>
            <p>Get your waitlist featured and increase signups</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Promote</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Community</h2>
            <p>Connect with other waitlist creators</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Join</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

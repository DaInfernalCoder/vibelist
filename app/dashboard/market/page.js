import { Suspense } from "react";
import Image from "next/image";

export const metadata = {
  title: "Market - Vibelist",
  description: "Market your waitlist and grow your audience",
};

export default function MarketPage() {
  return (
    <div className="container mx-auto p-6 relative">
      {/* Blur Overlay with Coming Soon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/30 backdrop-blur-md rounded-lg">
        <div className="text-center p-8 rounded-lg">
          <h2 className="text-4xl font-bold mb-4">Coming Soon</h2>
          <p className="text-lg mb-6 max-w-md">
            Marketing tools are coming soon to help you grow your audience and
            promote your waitlist.
          </p>

          <p>
            We&apos;ll be breaking down the different templates to grow fast!
          </p>
        </div>
      </div>

      {/* Blurred Content */}
      <div className="filter blur-sm">
        <h1 className="text-3xl font-bold mb-6">Market</h1>

        <div className="grid gap-6">
          <Suspense
            fallback={<div className="h-[200px] w-full skeleton"></div>}
          >
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Market Analytics</h2>
                <p className="text-base-content/80">
                  Track and optimize your marketing campaigns to grow your
                  audience.
                </p>
              </div>
            </div>
          </Suspense>

          <Suspense
            fallback={<div className="h-[200px] w-full skeleton"></div>}
          >
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Marketing Channels</h2>
                <p className="text-base-content/80">
                  Manage and optimize your marketing channels to reach more
                  potential users.
                </p>
              </div>
            </div>
          </Suspense>

          <Suspense
            fallback={<div className="h-[200px] w-full skeleton"></div>}
          >
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Promotion Tools</h2>
                <p className="text-base-content/80">
                  Create and manage promotional materials for your waitlist.
                </p>
              </div>
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

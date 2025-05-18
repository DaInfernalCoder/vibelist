import { Suspense } from "react";

export const metadata = {
  title: "Market - Vibelist",
  description: "Market your waitlist and grow your audience",
};

export default function MarketPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Market</h1>

      <div className="grid gap-6">
        <Suspense fallback={<div className="h-[200px] w-full skeleton"></div>}>
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

        <Suspense fallback={<div className="h-[200px] w-full skeleton"></div>}>
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

        <Suspense fallback={<div className="h-[200px] w-full skeleton"></div>}>
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
  );
}

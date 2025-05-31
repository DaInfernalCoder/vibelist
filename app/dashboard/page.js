import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import { getSubscriptionDetails, getRemainingDays } from "@/lib/access-control";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not authenticated, redirect to signin
  if (!user) {
    redirect("/signin");
  }

  // Get subscription details
  const subscriptionDetails = await getSubscriptionDetails(user.id);
  const remainingDays = await getRemainingDays(user.id);

  // Get user's waitlists
  const { data: waitlists, error } = await supabase
    .from("waitlists")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
            <p className="text-base-content/80 mt-2">
              Manage your waitlists and track performance
            </p>
          </div>

          {/* Subscription Status */}
          <div className="text-right">
            {subscriptionDetails.status === "active" && (
              <div className="badge badge-success gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {subscriptionDetails.type === "hacker"
                  ? "Lifetime Access"
                  : `Pro Plan`}
              </div>
            )}
            {subscriptionDetails.type === "pro" && remainingDays !== null && (
              <p className="text-sm text-base-content/60 mt-1">
                {remainingDays > 0
                  ? `${remainingDays} days remaining`
                  : "Expired"}
              </p>
            )}
          </div>
        </div>

        {/* Expiration Warning for Pro Users */}
        {subscriptionDetails.type === "pro" &&
          remainingDays !== null &&
          remainingDays <= 30 &&
          remainingDays > 0 && (
            <div className="alert alert-warning mb-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Your subscription expires soon!</h3>
                <div className="text-xs">
                  Your Pro plan expires in {remainingDays} days. Consider
                  upgrading to the Hacker plan for lifetime access.
                </div>
              </div>
              <div>
                <Link href="/pricing" className="btn btn-sm btn-outline">
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Total Waitlists</div>
            <div className="stat-value text-primary">
              {waitlists?.length || 0}
            </div>
            <div className="stat-desc">Active and draft waitlists</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Published</div>
            <div className="stat-value text-success">
              {waitlists?.filter((w) => w.published).length || 0}
            </div>
            <div className="stat-desc">Live waitlists</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Drafts</div>
            <div className="stat-value text-warning">
              {waitlists?.filter((w) => !w.published).length || 0}
            </div>
            <div className="stat-desc">Unpublished waitlists</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/dashboard/create"
            className="btn text-white border-0"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Waitlist
          </Link>

          <Link href="/dashboard/analytics" className="btn btn-outline">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            View Analytics
          </Link>
        </div>

        {/* Waitlists Grid */}
        {waitlists && waitlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waitlists.map((waitlist) => (
              <div
                key={waitlist.id}
                className="card bg-base-100 shadow-lg border border-base-300"
              >
                <div className="card-body">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="card-title text-lg">{waitlist.name}</h2>
                    <div
                      className={`badge ${waitlist.published ? "badge-success" : "badge-warning"}`}
                    >
                      {waitlist.published ? "Live" : "Draft"}
                    </div>
                  </div>

                  {waitlist.description && (
                    <p className="text-base-content/70 text-sm mb-4 line-clamp-2">
                      {waitlist.description}
                    </p>
                  )}

                  <div className="card-actions justify-end">
                    <Link
                      href={`/dashboard/waitlist/${waitlist.id}`}
                      className="btn btn-sm text-white border-0"
                      style={{ backgroundColor: "#9334E8" }}
                    >
                      Manage
                    </Link>

                    {waitlist.published && waitlist.url_slug && (
                      <Link
                        href={`/waitlist/${waitlist.url_slug}`}
                        target="_blank"
                        className="btn btn-sm btn-outline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4">No waitlists yet</h3>
              <p className="text-base-content/70 mb-6">
                Create your first waitlist to start building your audience and
                collecting signups.
              </p>
              <Link
                href="/dashboard/create"
                className="btn text-white border-0"
                style={{ backgroundColor: "#9334E8" }}
              >
                Create Your First Waitlist
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

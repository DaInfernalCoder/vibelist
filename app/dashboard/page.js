import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import { getSubscriptionDetails } from "@/lib/access-control";
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

  // Get user's waitlists
  const { data: waitlists, error } = await supabase
    .from("waitlists")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
            <p className="text-base-content/80 mt-2">
              Manage your waitlists and track performance
            </p>
          </div>

          {/* Subscription Status */}
          <div className="text-left md:text-right">
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
                Pro Plan - Lifetime Access
              </div>
            )}
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content mb-2">
                Welcome back
                {user?.user_metadata.name ? `, ${user.user_metadata.name}` : ""}
                ! 👋
              </h1>
              <p className="text-base-content/70">
                Ready to create amazing waitlists? Let&apos;s build something
                great together.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/create" className="btn btn-primary">
                Create Waitlist
              </Link>
            </div>
          </div>
        </div>

        {/* Subscription Status - Only show for Pro users */}
        {subscriptionDetails.type === "pro" && (
          <div className="alert alert-success mb-8">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Pro Plan Active</h3>
              <div className="text-xs">
                You have lifetime access to all VibeList features.
              </div>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/dashboard/create"
            className="btn text-white border-0 flex-1 sm:flex-none"
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

          <Link
            href="/dashboard/analytics"
            className="btn btn-outline flex-1 sm:flex-none"
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

                  <div className="card-actions justify-end flex-col sm:flex-row gap-2">
                    <Link
                      href={`/dashboard/waitlist/${waitlist.id}`}
                      className="btn btn-sm text-white border-0 w-full sm:w-auto"
                      style={{ backgroundColor: "#9334E8" }}
                    >
                      Manage
                    </Link>

                    {waitlist.published && waitlist.url_slug && (
                      <Link
                        href={`/waitlist/${waitlist.url_slug}`}
                        target="_blank"
                        className="btn btn-sm btn-outline w-full sm:w-auto"
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

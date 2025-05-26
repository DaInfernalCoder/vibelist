import ButtonAccount from "@/components/ButtonAccount";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const user = await getUser();
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome back {user?.name || ""}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Active Waitlists"
          value="2"
          description="You have 2 active waitlists"
          href="/dashboard/create"
          linkText="Create new waitlist"
        />
        <DashboardCard
          title="Total Submissions"
          value="124"
          description="Across all your waitlists"
          href="/dashboard/submissions"
          linkText="View all submissions"
        />
        <DashboardCard
          title="Conversion Rate"
          value="68%"
          description="Average signup completion rate"
          href="/dashboard/analytics"
          linkText="View analytics"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem
            message="New signup for Product Launch waitlist"
            time="2 hours ago"
          />
          <ActivityItem
            message="Waitlist settings updated for My First Waitlist"
            time="1 day ago"
          />
          <ActivityItem
            message="Product Launch waitlist created"
            time="3 days ago"
          />
        </div>
      </div>
    </div>
  );
}

// Function to get the current user profile
async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

function DashboardCard({ title, value, description, href, linkText }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {href && linkText && (
        <a
          href={href}
          className="inline-block text-sm text-primary hover:underline mt-4"
        >
          {linkText}
        </a>
      )}
    </div>
  );
}

function ActivityItem({ message, time }) {
  return (
    <div className="flex items-start border-b pb-4 last:border-0 last:pb-0">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-3"></div>
      <div>
        <p className="text-sm">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

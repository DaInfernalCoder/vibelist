import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { SessionNavBar } from "@/components/ui/sidebar";
import WaitlistProvider from "@/contexts/WaitlistContext";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export const metadata = {
  title: "Vibelist Dashboard",
  description: "Manage your waitlists with ease",
};

export default async function LayoutPrivate({ children }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <WaitlistProvider>
      <div className="flex min-h-screen">
        <SessionNavBar />
        <div className="flex-1 pl-[3.05rem] transition-all duration-200">
          <div className="container mx-auto p-6">{children}</div>
        </div>
      </div>
    </WaitlistProvider>
  );
}

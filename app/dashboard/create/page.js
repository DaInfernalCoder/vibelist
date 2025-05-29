import { createClient } from "@/libs/supabase/server";
import { hasValidSubscription } from "@/lib/access-control";
import Link from "next/link";
import { Crown, Info } from "lucide-react";
import { TemplateProvider } from "./context/TemplateProvider";
import WaitlistEditor from "./waitlist-editor";

export default async function CreateWaitlist() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has valid subscription
  const hasAccess = user ? await hasValidSubscription(user.id) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Waitlist</h1>
        <p className="text-muted-foreground mt-2">
          Create a new waitlist for your product or service.
        </p>
      </div>

      {/* Subscription banner for unpaid users */}
      {!hasAccess && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Free Preview Mode
              </h3>
              <p className="text-blue-800 mb-4">
                You can create and design waitlists for free! However, to
                publish your waitlist and start collecting real signups,
                you&apos;ll need to upgrade to Pro.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Link>
                <div className="text-sm text-blue-700 flex items-center">
                  <span className="font-medium">
                    ✓ Create unlimited waitlists
                  </span>
                  <span className="mx-2">•</span>
                  <span className="font-medium">✓ Design & customize</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-blue-600">
                    ⚡ Publish & collect signups (Pro)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WaitlistEditor />
    </div>
  );
}

import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Pricing from "@/components/Pricing";
import { getSubscriptionDetails } from "@/lib/access-control";

export default async function PricingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not authenticated, redirect to signin
  if (!user) {
    redirect("/signin");
  }

  // Check if user already has valid access
  const subscriptionDetails = await getSubscriptionDetails(user.id);

  // If user has active subscription, redirect to dashboard
  if (subscriptionDetails.status === "active") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-base-100 py-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-base-content/80 mb-8">
            Get access to VibeList and start building waitlists that convert
          </p>

          {subscriptionDetails.status === "expired" && (
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
              <span>
                Your subscription has expired. Please renew to continue using
                VibeList.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Component */}
      <Pricing />

      {/* Features Section */}
      <section className="bg-base-200 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything you need to build successful waitlists
            </h2>
            <p className="text-xl text-base-content/80">
              Join hundreds of founders who are already building their audience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Unlimited Waitlists",
                description:
                  "Create as many waitlists as you need for all your projects",
                icon: "🚀",
              },
              {
                title: "Unlimited Signups",
                description:
                  "No limits on how many users can join your waitlists",
                icon: "👥",
              },
              {
                title: "One-Click Database Setup",
                description:
                  "Get started instantly with our pre-configured Supabase setup",
                icon: "⚡",
              },
              {
                title: "Custom Branding",
                description:
                  "Customize colors, logos, and styling to match your brand",
                icon: "🎨",
              },
              {
                title: "Analytics Dashboard",
                description:
                  "Track signups, conversion rates, and referral sources",
                icon: "📊",
              },
              {
                title: "24/7 Support",
                description:
                  "Get help whenever you need it via our support chat",
                icon: "💬",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-base-100 p-6 rounded-lg shadow-lg">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-base-content/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-base-100 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: "What's the difference between Pro and Hacker plans?",
                answer:
                  "The Pro plan gives you one year of access for $25, perfect for testing the waters. The Hacker plan gives you lifetime access for $50, ideal if you're committed to building multiple projects.",
              },
              {
                question: "Can I upgrade from Pro to Hacker later?",
                answer:
                  "Yes! Contact our support team and we'll help you upgrade. You'll only pay the difference between the plans.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 30-day money-back guarantee. If you're not satisfied, just reach out to our support team.",
              },
              {
                question: "Is there a free trial?",
                answer:
                  "We don't offer a traditional free trial, but our Pro plan is very affordable at just $25 for a full year of access.",
              },
            ].map((faq, index) => (
              <div key={index} className="collapse collapse-plus bg-base-200">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title text-xl font-medium">
                  {faq.question}
                </div>
                <div className="collapse-content">
                  <p className="text-base-content/80">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

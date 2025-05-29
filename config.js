import themes from "daisyui/src/theming/themes";
import {
  getBaseUrl,
  getAuthCallbackUrl,
  getEnvironmentConfig,
} from "./lib/env-utils";

const config = {
  // REQUIRED
  appName: "VibeList",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The no-code platform to create beautiful waitlists to validate vibe coded products, without wasting another second. From idea to production in 2 minutes.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "vibe-list.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "47f957d6-16b9-4d63-b871-f426704a8cbb",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1RTt7BAGcHrscZ23J1TgJQyi"
            : "price_PRODUCTION_PRO_PLAN_ID",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Pro",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for those that want to try out solopreneurship",
        // The price you want to display, the one user will be charged on Stripe.
        price: 25,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 50,
        features: [
          {
            name: "Unlimited waitlists",
          },
          { name: "Unlimited user sign ups" },
          { name: "One click database setup" },
          { name: "24/7 support chat" },
          { name: "One year of access" },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1RTtDMAGcHrscZ238DmjdRGv"
            : "price_PRODUCTION_HACKER_PLAN_ID",
        name: "Hacker",
        description:
          "For solopreners that are ALL IN and want to hit $10k Monthly Recurring Revenue with their next product",
        price: 50,
        priceAnchor: 100,
        features: [
          {
            name: "Unlimited waitlists",
          },
          { name: "Unlimited user sign ups" },
          { name: "One click database setup" },
          { name: "24/7 support chat" },
          { name: "Lifetime access" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `VibeList <team@support.vibe-list.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Sumit at VibeList <team@support.vibe-list.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "dattasumit2019@gmail.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: themes["light"]["primary"],
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard/create",
    // Environment-aware auth configuration
    redirectUrl: getAuthCallbackUrl(),
    baseUrl: getBaseUrl(),
  },
  // Environment-specific configuration
  environment: getEnvironmentConfig(),
};

export default config;

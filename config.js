import themes from "daisyui/src/theming/themes.js";
import {
  getBaseUrl,
  getAuthCallbackUrl,
  getEnvironmentConfig,
} from "./lib/env-utils.js";

const config = {
  // REQUIRED
  appName: "VibeList",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "The ultimate waitlist solution for launching your product. Build, customize, and analyze beautiful waitlists that convert visitors into early users.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "vibe-list.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (mailgun.supportEmail) otherwise customer support won't work.
    id: "6d12c1b5-5e2b-4e0e-8c8b-4b7e8f2f1e0d",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on all pages, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1RTszKAGcHrscZ23vcIruj1U" // price id for pro plan
            : "price_1RTszKAGcHrscZ23vcIruj1U", // price id for pro plan
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Pro",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description:
          "One-time payment for lifetime access to all VibeList features",
        // The price you want to display, the one user will be charged on Stripe.
        price: 25,
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

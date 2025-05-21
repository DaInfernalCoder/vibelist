module.exports = {
  // Use NEXT_PUBLIC_URL for consistency across the application
  siteUrl: process.env.NEXT_PUBLIC_URL || "https://vibelist.com",
  generateRobotsTxt: true,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: [
    "/twitter-image.*",
    "/opengraph-image.*",
    "/icon.*",
    "/dashboard/**", // Exclude dashboard routes
    "/signin/**", // Exclude auth routes
    "/api/**", // Exclude API routes
  ],
};

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here reads live data (and traps can be switched on and off at any time),
  // so we render on each request instead of using Next.js's newer caching mode.
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Tell search engines not to index anything, including JSON and plain-text responses
        // where a <meta> tag can't be used. The prompt-injection content must stay out of search results.
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;

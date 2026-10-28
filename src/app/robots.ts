import type { MetadataRoute } from "next";

// Disallow all crawlers everywhere: this site deliberately contains prompt-injection test content.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}

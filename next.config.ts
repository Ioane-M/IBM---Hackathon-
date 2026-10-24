import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The pitch deck is a single static HTML file in /public.
  async rewrites() {
    return [{ source: "/pitch", destination: "/pitch.html" }];
  },
};

export default nextConfig;

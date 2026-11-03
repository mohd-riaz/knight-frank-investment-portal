import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 30 * 24 * 60 * 60,
    deviceSizes: [640, 960, 1280],
    imageSizes: [64, 128, 320],
    qualities: [75],
    formats: ["image/webp"],
    localPatterns: [
      { pathname: "/api/property-images/*", search: "" },
      { pathname: "/assets/**", search: "" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;

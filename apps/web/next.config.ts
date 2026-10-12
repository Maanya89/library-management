import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@shelfwise/contracts"],
  poweredByHeader: false,
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${apiOrigin}/api/:path*`,
    }];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: securityHeaders,
    }];
  },
};

export default nextConfig;

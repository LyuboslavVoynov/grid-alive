import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/area", destination: "/?tool=demand", permanent: false },
      { source: "/home", destination: "/?tool=energy", permanent: false },
      {
        source: "/methodology",
        destination: "/?tool=methodology",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
export default config;

// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Allow external images from any https source
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  reactStrictMode: true,

  // Fixed: moved out of experimental
  serverExternalPackages: ["@prisma/client", "prisma"],
};



export default nextConfig;

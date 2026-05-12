import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  // Inline contract env vars into the browser bundle without
  // requiring the NEXT_PUBLIC_ prefix.
  env: {
    CONTRACT_STUDIONET: process.env.CONTRACT_STUDIONET,
    CONTRACT_BRADBURY: process.env.CONTRACT_BRADBURY,
  },
};

export default nextConfig;

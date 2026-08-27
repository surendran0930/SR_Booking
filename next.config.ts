import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN / WSL-style hosts during `next dev` (avoids blocked chunk loads)
  allowedDevOrigins: ["172.23.192.1", "127.0.0.1", "localhost"],
};

export default nextConfig;

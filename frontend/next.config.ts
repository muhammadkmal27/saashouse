import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['100.105.77.107'],
};

export default nextConfig;

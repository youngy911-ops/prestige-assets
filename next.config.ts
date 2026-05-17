import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,   // don't advertise Next.js version in response headers
  compress: true,           // gzip/brotli responses (default true, explicit for clarity)

};

export default nextConfig;

import type { NextConfig } from "next";

// FastAPI origin. Requests to /api/* are proxied server-side so the browser
// stays same-origin (httpOnly session cookies, no CORS).
const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Curated discovery photos (seeded, deterministic); see src/lib/photos.ts
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;

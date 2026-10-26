import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    // Mantener imágenes optimizadas en caché
    // durante al menos 7 días.
    minimumCacheTTL: 604800,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
              ).hostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
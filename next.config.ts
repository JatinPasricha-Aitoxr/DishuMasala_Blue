import type { NextConfig } from "next";

/**
 * Derive the R2 public base URL's hostname for next/image remotePatterns.
 * Read from env, never hardcoded — R2_PUBLIC_BASE_URL is set per environment
 * (e.g. https://pub-xxxxxxxx.r2.dev or a custom CDN domain in front of the bucket).
 */
function r2RemotePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return [];

  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/**",
      },
    ];
  } catch {
    // Invalid/placeholder URL at build time (e.g. local dev before R2 is provisioned) — no remote
    // patterns rather than a hard crash. Real deploys must set a valid R2_PUBLIC_BASE_URL.
    return [];
  }
}

const nextConfig: NextConfig = {
  // Keep the app deployable on Vercel while staying runnable under PM2 + Nginx on a VPS —
  // no Vercel-only API is used anywhere in this codebase (CLAUDE.md §2, §10).
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2RemotePattern(),
  },
};

export default nextConfig;

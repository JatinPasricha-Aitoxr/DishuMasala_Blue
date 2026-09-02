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
  // `output: "standalone"` is for self-hosting (PM2 + Nginx on a VPS, CLAUDE.md §10) — it makes
  // `next build` emit its own bundled server + pruned node_modules under `.next/standalone`, so
  // that folder alone is enough to run without a full `pnpm install` on the target machine.
  // Vercel's own build pipeline has a separate post-build packaging step (its own Node File Trace
  // pass) that expects the *normal* `.next` layout instead; enabling standalone output at the same
  // time makes Vercel's own step fail with `ENOENT .../next-server.js.nft.json` even though
  // `next build` itself succeeds — a well-documented Next.js/Vercel conflict, not specific to this
  // app. Vercel already produces its own optimized serverless output regardless of this flag, so
  // only turn standalone on when NOT building on Vercel (which always sets `VERCEL=1`) — this
  // keeps both deploy targets working with the one config, per CLAUDE.md §2/§10's "must stay
  // runnable under PM2 + Nginx" requirement.
  output: process.env.VERCEL ? undefined : "standalone",
  // Next.js otherwise auto-appends a "read node_modules/next/dist/docs/" block to CLAUDE.md on
  // every `next dev`/build — CLAUDE.md is this project's own binding constitution, authored and
  // version-controlled deliberately, not a place for a tool to write into.
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2RemotePattern(),
    // Next.js 16's image optimizer refuses to fetch from any hostname that resolves to a
    // private/loopback IP (SSRF hardening), independent of and in addition to remotePatterns
    // matching — it blocks even an explicitly allow-listed `localhost` with the same generic
    // "url parameter is not allowed" error. This only needs to be true for the local MinIO
    // stand-in for R2 (see docs/LOCAL-R2.md / the README's "Local R2 (MinIO)" section) — a real
    // deploy sets R2_ACCOUNT_ID instead of R2_ENDPOINT and gets the real, non-loopback R2
    // hostname, so this stays false (the safe default) in every real environment.
    dangerouslyAllowLocalIP: Boolean(process.env.R2_ENDPOINT),
  },
};

export default nextConfig;

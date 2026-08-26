/**
 * The actual Cloudflare R2 (S3-compatible) client implementation. Deliberately has no
 * `import "server-only"` of its own — it's consumed two ways:
 *   - lib/storage/r2.ts re-exports it WITH the server-only guard, for use from the Next.js app
 *     (server actions, route handlers) where accidental client-bundle inclusion must hard-fail.
 *   - scripts/migrate-images.ts imports this file directly, since standalone tsx/Node scripts
 *     have no "react-server" bundler condition and the `server-only` package throws
 *     unconditionally outside of it (see lib/db/script-client.ts for the same pattern on the DB
 *     side).
 * Never import this file from app/ or components/ — use lib/storage/r2.ts there instead.
 */
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

function assertConfigured(): void {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, " +
        "R2_BUCKET and R2_PUBLIC_BASE_URL (see .env.example).",
    );
  }
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  assertConfigured();
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return cachedClient;
}

export type R2Prefix = "products" | "reviews" | "posts";

/**
 * Key convention (CLAUDE.md §6 / PROMPTS Phase 0 item 7):
 * `products/<slug>/<hash>.<ext>`, `reviews/<reviewId>/<hash>.<ext>`, `posts/<slug>/<hash>.<ext>`.
 * `variant` lets a caller disambiguate multiple derivatives of the same source image (e.g. a
 * width) without breaking the base convention — the hash still identifies the source content.
 */
export function buildKey(prefix: R2Prefix, id: string | number, hash: string, ext: string, variant?: string): string {
  const cleanExt = ext.replace(/^\./, "");
  const base = variant ? `${hash}-${variant}` : hash;
  return `${prefix}/${id}/${base}.${cleanExt}`;
}

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
/** 5MB ceiling — matches the review-photo upload limit (CLAUDE.md Phase 4). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function putObject(key: string, body: Uint8Array | Buffer, contentType: string): Promise<void> {
  assertConfigured();
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  assertConfigured();
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export interface PresignUploadOptions {
  key: string;
  contentType: string;
  /**
   * Exact byte size of the file being uploaded. A presigned PUT signs and enforces the
   * Content-Length header exactly — S3/R2 reject a request whose body length doesn't match — so
   * this must be the real size (e.g. `File.size` in the browser), not a maximum. Enforce a
   * maximum by rejecting `contentLength > MAX_UPLOAD_BYTES` before signing, as below.
   */
  contentLength: number;
  expiresInSeconds?: number;
}

/** A presigned PUT URL constrained to an allowed image content-type and an exact, size-capped Content-Length. */
export async function presignUpload(opts: PresignUploadOptions): Promise<{ url: string; key: string }> {
  assertConfigured();
  if (!ALLOWED_CONTENT_TYPES.has(opts.contentType)) {
    throw new Error(`presignUpload: content-type "${opts.contentType}" is not an allowed image type`);
  }
  if (!Number.isInteger(opts.contentLength) || opts.contentLength <= 0 || opts.contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`presignUpload: contentLength ${opts.contentLength} is invalid or exceeds the ${MAX_UPLOAD_BYTES}-byte ceiling`);
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  });

  const url = await getSignedUrl(getClient(), command, { expiresIn: opts.expiresInSeconds ?? 300 });
  return { url, key: opts.key };
}

export function publicUrl(key: string): string {
  assertConfigured();
  return `${publicBaseUrl!.replace(/\/$/, "")}/${key}`;
}

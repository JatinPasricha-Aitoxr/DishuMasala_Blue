import "server-only";

/**
 * Generic presigned-upload-to-R2 + server-side sharp-derivative flow for content images (post
 * cover images and inline body images) — same two-step pattern as
 * lib/db/mutations/admin-products.ts's product-image flow (browser PUTs straight to R2 via a
 * presigned URL, then the server fetches it back and runs the real derivative pipeline), factored
 * out here since posts/pages need the identical mechanics under a different R2 key prefix
 * ("posts/<slug>/...") with no separate image-tracking table to write a row into.
 */
import { createHash, randomUUID } from "node:crypto";
import { buildKey, deleteObject, getObject, presignUpload, putObject, publicUrl, type R2Prefix } from "@/lib/storage/r2";
import { processImage } from "@/lib/storage/images";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function presignContentImageUpload(
  prefix: R2Prefix,
  slug: string,
  contentType: string,
  contentLength: number,
): Promise<{ url: string; tmpKey: string }> {
  const ext = ALLOWED_MIME[contentType];
  if (!ext) throw new Error(`Unsupported content type "${contentType}" — only JPEG, PNG or WEBP are allowed.`);
  if (contentLength <= 0 || contentLength > MAX_UPLOAD_BYTES) throw new Error("File must be non-empty and at most 5MB.");

  const tmpKey = buildKey(prefix, slug, `tmp-${randomUUID()}`, ext);
  const { url } = await presignUpload({ key: tmpKey, contentType, contentLength });
  return { url, tmpKey };
}

export async function finalizeContentImageUpload(
  prefix: R2Prefix,
  slug: string,
  tmpKey: string,
): Promise<{ url: string; r2Key: string; width: number; height: number }> {
  const originalBuffer = await getObject(tmpKey);
  const processed = await processImage(originalBuffer);
  const hash = createHash("sha256").update(originalBuffer).digest("hex").slice(0, 16);

  let canonicalKey = "";
  let canonicalWidth = 0;
  let canonicalHeight = 0;
  for (const derivative of processed.derivatives) {
    const key = buildKey(prefix, slug, hash, derivative.format, `w${derivative.width}`);
    await putObject(key, derivative.buffer, `image/${derivative.format}`);
    if (derivative.format === "webp" && derivative.width >= canonicalWidth) {
      canonicalKey = key;
      canonicalWidth = derivative.width;
      canonicalHeight = derivative.height;
    }
  }

  await deleteObject(tmpKey).catch(() => {});
  return { url: publicUrl(canonicalKey), r2Key: canonicalKey, width: canonicalWidth, height: canonicalHeight };
}

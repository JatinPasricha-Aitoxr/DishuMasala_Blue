# Dishu Masala Storefront

Fully custom Next.js storefront + admin for Dishu Food and Beverages (dishumasala.com). See
`CLAUDE.md` for the binding project constitution, `PRD.md` for product requirements, and
`PROMPTS.md` for the phased build plan.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in real values — see "Environment" below
pnpm db:generate        # generate a migration from lib/db/schema/ (already committed for Phase 0)
pnpm db:migrate          # apply migrations to DATABASE_URL
pnpm db:seed              # seed collections/products/variants/coupon/settings from data/catalog.json
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js app |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, including the "no drizzle-orm outside lib/db/" rule |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Generate a Drizzle migration from `lib/db/schema/` |
| `pnpm db:migrate` | Apply migrations (`drizzle-kit migrate`) |
| `pnpm db:seed` | Idempotently seed from `data/catalog.json` |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm migrate-images` | Pull product images off the old site, generate AVIF/WebP derivatives, upload to R2 |

## Environment

Copy `.env.example` to `.env` and fill in every value listed there — it covers every variable
CLAUDE.md §10 requires (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, the `R2_*` set, `RESEND_API_KEY`,
`EMAIL_FROM`, the `RAZORPAY_*` set, the `SHIPROCKET_*` set, `NEXT_PUBLIC_SITE_URL`), each with a
comment explaining what it's for and where to get it.

**No secret may ever carry a `NEXT_PUBLIC_` prefix.** That prefix tells Next.js to inline the value
into the client-side JS bundle — anything with it ships to every visitor's browser. The only
`NEXT_PUBLIC_` variable in this project is `NEXT_PUBLIC_SITE_URL`, which is the site's own public
origin, not a secret. Every phase's acceptance check greps the built `.next/static` output for
secret values and variable names to confirm none leaked into the client bundle.

## Local R2 (MinIO)

No real Cloudflare R2 bucket exists in local dev by default. Rather than mock the upload path,
run a local S3-compatible substitute with [MinIO](https://min.io/) — the same pattern this project
already uses for Neon's local `wsproxy` sidecar. `lib/storage/r2-core.ts`'s S3 SDK client works
against any S3-compatible endpoint via the `R2_ENDPOINT` / `R2_FORCE_PATH_STYLE` overrides, so this
exercises the real presigned-upload + `sharp`-derivative + storage code path end to end, not a
mocked stand-in for it.

```bash
docker run -d --name dishu-v2-minio -p 9010:9000 -p 9011:9001 \
  -e MINIO_ROOT_USER=dishuadmin -e MINIO_ROOT_PASSWORD=dishusecret123 \
  -v dishu_v2_minio_data:/data \
  minio/minio server /data --console-address ":9001"

# Create the bucket and make it publicly downloadable (R2 buckets serve images publicly via
# R2_PUBLIC_BASE_URL, so the local substitute needs the same):
docker run --rm --network host --entrypoint sh minio/mc -c \
  "mc alias set local http://localhost:9010 dishuadmin dishusecret123 && \
   mc mb -p local/dishu-media && \
   mc anonymous set download local/dishu-media"
```

Then in `.env`:

```
R2_ACCESS_KEY_ID=dishuadmin
R2_SECRET_ACCESS_KEY=dishusecret123
R2_BUCKET=dishu-media
R2_PUBLIC_BASE_URL=http://localhost:9010/dishu-media
R2_ENDPOINT=http://localhost:9010
R2_FORCE_PATH_STYLE=1
```

Leave `R2_ACCOUNT_ID` empty — it's only used to derive the real
`https://<accountId>.r2.cloudflarestorage.com` endpoint, which `R2_ENDPOINT` overrides. The MinIO
console is at [http://localhost:9011](http://localhost:9011) (same credentials) if you want to
browse uploaded objects. Container name (`dishu-v2-minio`) and volume (`dishu_v2_minio_data`) are
distinct from every other container this project uses (`dishu-v2-postgres`, `dishu-v2-wsproxy`), so
nothing collides. A real deploy sets `R2_ACCOUNT_ID` and the real R2 credentials instead and leaves
`R2_ENDPOINT`/`R2_FORCE_PATH_STYLE` unset.

## Architecture notes

- **Postgres is the only source of truth.** `data/catalog.json` exists solely to seed the database.
- Nothing outside `lib/db/` imports `drizzle-orm` (enforced by ESLint) — everything else reads via
  `lib/db/queries/*`, writes via `lib/db/mutations/*`, and consumes the plain types in
  `types/catalog.ts` / `types/order.ts`.
- All money is stored and computed as integer paise via the branded `Paise` type in `lib/money.ts`
  — never a float, never rupee arithmetic in JS.
- Deployed on Vercel with `output: "standalone"`; no Vercel-only API is used, so the same build can
  run under PM2 + Nginx on a VPS.

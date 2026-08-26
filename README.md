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

## Architecture notes

- **Postgres is the only source of truth.** `data/catalog.json` exists solely to seed the database.
- Nothing outside `lib/db/` imports `drizzle-orm` (enforced by ESLint) — everything else reads via
  `lib/db/queries/*`, writes via `lib/db/mutations/*`, and consumes the plain types in
  `types/catalog.ts` / `types/order.ts`.
- All money is stored and computed as integer paise via the branded `Paise` type in `lib/money.ts`
  — never a float, never rupee arithmetic in JS.
- Deployed on Vercel with `output: "standalone"`; no Vercel-only API is used, so the same build can
  run under PM2 + Nginx on a VPS.

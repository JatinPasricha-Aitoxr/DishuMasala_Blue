-- Custom SQL migration file, put your code below! --

-- Enables Postgres's trigram-similarity extension for /search (Phase 3): ILIKE substring matching
-- plus similarity()-ranked fuzzy matching over product name, tags and short_description, without
-- standing up a separate search service for a 20-product catalogue. Neon Postgres explicitly
-- supports pg_trgm (it is in Neon's allow-listed extension set), so this migration applies
-- unchanged in production, not just against the local Docker Postgres used in dev.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- GIN trigram indexes so ILIKE '%term%' and similarity()/word_similarity() ranking stay fast as
-- the catalogue grows past today's 20 products.
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_short_description_trgm_idx
  ON products USING gin (short_description gin_trgm_ops);

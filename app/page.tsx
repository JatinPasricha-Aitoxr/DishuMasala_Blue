import { formatINR } from "@/lib/money";
import { getCollectionsWithStats } from "@/lib/db/queries/collections";

// Temporary proof-of-life page for Phase 0: server-renders plain text proving the DB layer works
// end to end (collections, in priority order, with a live product count and price range each).
// Replaced by the real homepage in Phase 2 — no design system, no components, on purpose.
export const dynamic = "force-dynamic";

export default async function Home() {
  const collections = await getCollectionsWithStats();

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", whiteSpace: "pre-wrap" }}>
      <h1>Dishu Masala — Phase 0 DB proof page</h1>
      <p>Collections in priority order (lower priority sorts first), each with its live product count and sale-price range, read straight from Postgres via lib/db/queries/collections.ts.</p>
      <ol>
        {collections.map((c) => (
          <li key={c.id}>
            {"priority "}{c.priority}{" — "}{c.title}{" ("}{c.slug}{") — "}
            {c.productCount}{" product"}{c.productCount === 1 ? "" : "s"}
            {c.minPricePaise !== null && c.maxPricePaise !== null ? (
              <>
                {" — "}
                {c.minPricePaise === c.maxPricePaise
                  ? formatINR(c.minPricePaise)
                  : `${formatINR(c.minPricePaise)}–${formatINR(c.maxPricePaise)}`}
              </>
            ) : (
              " — no priced products yet"
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}

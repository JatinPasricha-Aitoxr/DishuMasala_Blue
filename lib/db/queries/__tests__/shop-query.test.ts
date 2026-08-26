import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { collections, products } from "../../schema";
import {
  buildShopOrderBy,
  buildShopWhereConditions,
  parseShopSearchParams,
  SHOP_PAGE_SIZE,
  shopFiltersToSearchParams,
  type ShopFilters,
} from "../shop-query";

// `drizzle.mock()` binds a real Postgres dialect (so `.toSQL()` serialises exactly what a live
// query would send) without opening a socket or requiring DATABASE_URL — the query-building logic
// under test never needs a real Postgres to prove it builds the right SQL. This is what makes
// these "Vitest unit tests for the filter/sort query-building logic" (PROMPTS.md Phase 3 item 7)
// rather than an integration test.
const mockDb = drizzle.mock();

function sqlOf(filters: ShopFilters) {
  return mockDb
    .select({ id: products.id })
    .from(products)
    .innerJoin(collections, eq(products.collectionId, collections.id))
    .where(and(...buildShopWhereConditions(filters)))
    .orderBy(...buildShopOrderBy(filters.sort))
    .toSQL();
}

const BASE: ShopFilters = { inStockOnly: false, sort: "priority", page: 1 };

describe("parseShopSearchParams", () => {
  it("defaults to no filters, priority sort, page 1 on an empty URL", () => {
    expect(parseShopSearchParams({})).toEqual({
      collection: undefined,
      optionLabel: undefined,
      priceMinRupees: undefined,
      priceMaxRupees: undefined,
      inStockOnly: false,
      sort: "priority",
      page: 1,
    });
  });

  it("parses every filter and sort from real query-string shapes", () => {
    const parsed = parseShopSearchParams({
      collection: "blue-tea",
      size: "Teabags",
      min: "100",
      max: "400",
      stock: "1",
      sort: "price-asc",
      page: "2",
    });
    expect(parsed).toEqual({
      collection: "blue-tea",
      optionLabel: "Teabags",
      priceMinRupees: 100,
      priceMaxRupees: 400,
      inStockOnly: true,
      sort: "price-asc",
      page: 2,
    });
  });

  it("ignores an invalid enum value rather than throwing", () => {
    expect(parseShopSearchParams({ sort: "not-a-real-sort" }).sort).toBe("priority");
    expect(parseShopSearchParams({ size: "Weight" }).optionLabel).toBeUndefined();
  });

  it("swaps an inverted min/max range instead of producing an always-empty filter", () => {
    const parsed = parseShopSearchParams({ min: "500", max: "100" });
    expect(parsed.priceMinRupees).toBe(100);
    expect(parsed.priceMaxRupees).toBe(500);
  });

  it("takes the first value when Next.js hands back a duplicated searchParam", () => {
    expect(parseShopSearchParams({ collection: ["blue-tea", "red-tea"] }).collection).toBe("blue-tea");
  });

  it("treats an empty-string param as absent, and doesn't let it blank out sibling filters", () => {
    // A real GET submission from the filter form's "All collections"/"All types" radios and a
    // cleared price input sends exactly this shape — collection=blue-tea alongside size=&min=&max=
    // (regression: Number("") is NaN, which used to fail Zod for the whole object and silently
    // drop the collection filter too).
    const parsed = parseShopSearchParams({ collection: "blue-tea", size: "", min: "", max: "" });
    expect(parsed.collection).toBe("blue-tea");
    expect(parsed.optionLabel).toBeUndefined();
    expect(parsed.priceMinRupees).toBeUndefined();
    expect(parsed.priceMaxRupees).toBeUndefined();
  });
});

describe("shopFiltersToSearchParams", () => {
  it("round-trips through parseShopSearchParams", () => {
    const filters = parseShopSearchParams({
      collection: "spices",
      size: "Size",
      min: "50",
      max: "200",
      stock: "1",
      sort: "name",
      page: "3",
    });
    expect(parseShopSearchParams(shopFiltersToSearchParams(filters))).toEqual(filters);
  });

  it("omits default-valued fields so the default view's URL stays bare", () => {
    expect(shopFiltersToSearchParams(BASE)).toEqual({});
  });
});

describe("buildShopWhereConditions", () => {
  it("always requires published status even with no other filters", () => {
    const sql = sqlOf(BASE);
    expect(sql.sql).toContain('"products"."status" = $1');
    expect(sql.params).toEqual(["published"]);
  });

  it("adds a collection-slug equality condition when a collection filter is set", () => {
    const sql = sqlOf({ ...BASE, collection: "blue-tea" });
    expect(sql.sql).toContain('"collections"."slug" = $2');
    expect(sql.params).toEqual(["published", "blue-tea"]);
  });

  it("adds an option-label equality condition when a size filter is set", () => {
    const sql = sqlOf({ ...BASE, optionLabel: "Combo" });
    expect(sql.sql).toContain('"products"."option_label" = $2');
    expect(sql.params).toEqual(["published", "Combo"]);
  });

  it("adds an EXISTS-over-variants condition for in-stock-only, not a JS filter", () => {
    const sql = sqlOf({ ...BASE, inStockOnly: true });
    expect(sql.sql).toMatch(/exists\s*\(/i);
    expect(sql.sql).toContain('"variants"."in_stock" = true');
  });

  it("filters on the correlated primary-variant price subquery for a price range", () => {
    const sql = sqlOf({ ...BASE, priceMinRupees: 100, priceMaxRupees: 400 });
    // toPaise(100) = 10000, toPaise(400) = 40000 — proves rupees are converted to paise, not
    // compared raw against a paise column.
    expect(sql.params).toEqual(["published", 10000, 40000]);
    expect(sql.sql).toMatch(/select .*"variants"\."price_paise".*from "variants"/i);
  });

  it("excludeDimension omits exactly that filter's own condition (facet-count support)", () => {
    const withCollection: ShopFilters = { ...BASE, collection: "blue-tea", optionLabel: "Teabags" };
    const conditions = buildShopWhereConditions(withCollection, { excludeDimension: "collection" });
    // status + optionLabel only — the collection condition itself is the one omitted.
    expect(conditions).toHaveLength(2);
  });
});

describe("buildShopOrderBy", () => {
  it("default 'priority' sort is priority ASC then primary price DESC then id ASC", () => {
    const sql = sqlOf(BASE);
    const orderByClause = sql.sql.slice(sql.sql.toLowerCase().indexOf("order by"));
    const priorityIdx = orderByClause.indexOf('"products"."priority"');
    const priceIdx = orderByClause.indexOf("select");
    const idIdx = orderByClause.lastIndexOf('"products"."id"');

    expect(priorityIdx).toBeGreaterThan(-1);
    expect(priceIdx).toBeGreaterThan(priorityIdx);
    expect(idIdx).toBeGreaterThan(priceIdx);
    expect(orderByClause).toMatch(/"products"\."priority" asc/i);
    expect(orderByClause).toMatch(/\) desc/i); // the primary-price subquery, ordered descending
  });

  it("'price-asc' orders the primary-price subquery ascending", () => {
    const sql = sqlOf({ ...BASE, sort: "price-asc" });
    const orderByClause = sql.sql.slice(sql.sql.toLowerCase().indexOf("order by"));
    expect(orderByClause).toMatch(/\) asc/i);
  });

  it("'name' sorts alphabetically, not by priority or price at all", () => {
    const sql = sqlOf({ ...BASE, sort: "name" });
    const orderByClause = sql.sql.slice(sql.sql.toLowerCase().indexOf("order by"));
    expect(orderByClause).toMatch(/"products"\."name" asc/i);
    expect(orderByClause).not.toContain("price_paise");
  });
});

describe("SHOP_PAGE_SIZE", () => {
  it("paginates at 24 (PROMPTS.md Phase 3 / PRD §5.2)", () => {
    expect(SHOP_PAGE_SIZE).toBe(24);
  });
});

import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/db/queries/product-detail";
import { formatINR } from "@/lib/money";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * A generated, typographic OG image — real product name and price only, brand tokens for
 * background/rule (CLAUDE.md §5.2), no photography (none exists yet — CLAUDE.md §8) and nothing
 * fabricated (no award/certification/customer-count graphic).
 */
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const price = product?.variants[0]?.pricePaise;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FCFAF6",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 6, borderRadius: 3, backgroundImage: "linear-gradient(100deg, #123FA8, #2E5BE0, #6C3FD1, #A62D9B, #D62A6B, #F3C623)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 24, color: "#7C7885", letterSpacing: 2, textTransform: "uppercase" }}>
            Dishu Masala
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600, color: "#17161A", lineHeight: 1.15, maxWidth: 980 }}>
            {product?.name ?? "Dishu Masala"}
          </div>
          {price != null && (
            <div style={{ display: "flex", fontSize: 36, fontWeight: 600, color: "#17161A" }}>
              {formatINR(price)}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}

import { getFreeShippingThresholdPaise } from "@/lib/db/queries/settings";
import { formatINR } from "@/lib/money";
import { MarqueeStrip } from "./MarqueeStrip";

function PackagingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-brew-2" aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 12h17M8 8V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShippingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-brew-2" aria-hidden="true">
      <path d="M3 7h11v9H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PunjabIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-brew-2" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11.4A7 7 0 0 0 5 9.6C5 14.9 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="9.4" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CodIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-brew-2" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Exactly the four verifiable claims CLAUDE.md §8 allows — double-layer packaging, free shipping
 * over the DB threshold, sourced in Punjab, COD available. Nothing else: no customer count, no
 * certification, no number that isn't traceable to seeded data or CLAUDE.md itself.
 *
 * Renders as a continuously scrolling marquee (`MarqueeStrip`) — a real, verifiable-facts-only
 * version of the repeating promo strip pattern common on Indian D2C storefronts (e.g.
 * bluetea.co.in's "30 Lakh+ Happy Customers · Featured on Shark Tank" strip). Unlike that
 * reference, every claim here is real; nothing is invented to fill the same visual slot.
 */
export async function TrustStrip() {
  const freeShippingThresholdPaise = await getFreeShippingThresholdPaise();

  return (
    <MarqueeStrip
      ariaLabel="Why shop with us"
      items={[
        { icon: <PackagingIcon />, label: "Double-layer packaging" },
        { icon: <ShippingIcon />, label: `Free shipping over ${formatINR(freeShippingThresholdPaise)}` },
        { icon: <PunjabIcon />, label: "Sourced in Punjab" },
        { icon: <CodIcon />, label: "Cash on delivery available" },
      ]}
    />
  );
}

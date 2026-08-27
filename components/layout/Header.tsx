import { getCollectionsWithStats } from "@/lib/db/queries/collections";
import { getFreeShippingThresholdPaise, getSiteBranding } from "@/lib/db/queries/settings";
import { buildMegaMenuColumns } from "@/lib/nav";
import { HeaderClient } from "./HeaderClient";

/** Server wrapper — reads collections (priority order), the free-shipping threshold, and the real
 * site branding straight from Postgres (CLAUDE.md §3.2: no query inline in a component) and hands
 * plain, serializable props down to the interactive client header. */
export async function Header() {
  const [collections, freeShippingThresholdPaise, branding] = await Promise.all([
    getCollectionsWithStats(),
    getFreeShippingThresholdPaise(),
    getSiteBranding(),
  ]);

  const columns = buildMegaMenuColumns(collections);

  return (
    <HeaderClient
      columns={columns}
      freeShippingThresholdPaise={freeShippingThresholdPaise}
      logo={branding.logo}
    />
  );
}

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { parseProductDescription } from "@/lib/pdp/parse-description";
import { formatINR } from "@/lib/money";
import type { Paise } from "@/lib/money";

export interface DetailsProps {
  description: string | null;
  freeShippingThresholdPaise: Paise;
}

/** Renders multi-line block text as real paragraphs — a plain `\n`-joined string, never markup. */
function BlockText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-2">
      {text.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

/**
 * Four accordions built from the product's own stored `description` copy (Key Characteristics,
 * Ingredients, How to brew / How to use) plus one generic, identical-on-every-PDP Shipping &
 * Returns accordion (PROMPTS.md Phase 4 item 5). "Health Benefits" is parsed by
 * lib/pdp/parse-description.ts but never rendered anywhere — CLAUDE.md §8 bans health claims
 * regardless of what the source copy says.
 */
export function Details({ description, freeShippingThresholdPaise }: DetailsProps) {
  const parsed = parseProductDescription(description);
  const defaultOpen: string[] = [];
  if (parsed.keyCharacteristics) defaultOpen.push("characteristics");

  return (
    <Accordion type="multiple" defaultValue={defaultOpen}>
      {parsed.keyCharacteristics && (
        <AccordionItem value="characteristics">
          <AccordionTrigger>Key Characteristics</AccordionTrigger>
          <AccordionContent>
            <BlockText text={parsed.keyCharacteristics} />
          </AccordionContent>
        </AccordionItem>
      )}

      {parsed.ingredients && (
        <AccordionItem value="ingredients">
          <AccordionTrigger>Ingredients</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed text-ink-2">{parsed.ingredients}</p>
          </AccordionContent>
        </AccordionItem>
      )}

      {parsed.howToUse && (
        <AccordionItem value="how-to-use">
          <AccordionTrigger>How to brew / How to use</AccordionTrigger>
          <AccordionContent>
            <BlockText text={parsed.howToUse} />
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="shipping-returns">
        <AccordionTrigger>Shipping &amp; Returns</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-2">
            <p>Free shipping on orders over {formatINR(freeShippingThresholdPaise)}.</p>
            <p>Cash on Delivery is available.</p>
            {/* No return/refund window number exists anywhere in this project's docs today — the
             * client hasn't supplied one, and CLAUDE.md §8 bans inventing a figure. The real
             * policy page (returns window, refund process, grievance contact) ships in Phase 8. */}
            <p>
              Our full shipping and returns policy is being finalised and will appear here shortly. For
              questions about an order, contact us directly.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

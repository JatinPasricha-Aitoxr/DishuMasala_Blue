import { NewsletterFormLazy } from "@/components/layout/NewsletterFormLazy";
import { HOME_COPY } from "@/content/home";

/** Homepage newsletter band — reuses Phase 1's NewsletterForm (client-side validation only; no
 * submission endpoint exists yet). Distinct from the footer's own newsletter block: this one gets a
 * heading and full-width framing as its own homepage section, per PROMPTS.md Phase 2. */
export function NewsletterSection() {
  const copy = HOME_COPY.newsletter;

  return (
    <section aria-labelledby="newsletter-heading" className="border-y border-line bg-surface-2">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-14 text-center sm:px-6">
        <h2 id="newsletter-heading" className="font-display text-2xl font-semibold text-ink">
          {copy.heading}
        </h2>
        <p className="max-w-md text-base text-ink-2">{copy.body}</p>
        <div className="mt-3 w-full max-w-sm text-left">
          <NewsletterFormLazy />
        </div>
      </div>
    </section>
  );
}

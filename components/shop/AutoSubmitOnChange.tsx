"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement only: when JS is available, changing a radio/checkbox/number field
 * inside `<form id={formId}>` submits it immediately instead of waiting for the "Apply filters"
 * click — same GET navigation either way, just faster. Renders nothing; with JS disabled this
 * component never mounts, and the plain "Apply filters" submit button (already in the form) is
 * the only way to submit, which still works.
 */
export function AutoSubmitOnChange({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    // Debounced for the two free-text number inputs (min/max price) so every keystroke doesn't
    // navigate; radios/checkboxes submit on their own "change" event with no debounce needed.
    let priceTimer: ReturnType<typeof setTimeout> | undefined;
    const onChange = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type === "number") {
        clearTimeout(priceTimer);
        priceTimer = setTimeout(() => form.requestSubmit(), 500);
        return;
      }
      form.requestSubmit();
    };

    form.addEventListener("change", onChange);
    return () => {
      form.removeEventListener("change", onChange);
      clearTimeout(priceTimer);
    };
  }, [formId]);

  return null;
}

/**
 * A read-only mirror of the hex values in app/globals.css's `@theme` block, kept ONLY so
 * app/design-system/page.tsx can compute real WCAG contrast ratios at build/render time (CSS
 * custom properties aren't readable as numbers on the server). This is the one deliberate,
 * documented exception to "no hex literals" — it lives outside components/ (the acceptance-check
 * grep is scoped to components/), is never imported by anything that renders a color itself
 * (components always reference the CSS variable, never this file), and exists purely for contrast
 * arithmetic and the palette table on the dev-only design-system page.
 *
 * If a value here ever drifts from app/globals.css, the design-system page's contrast numbers are
 * wrong — keep the two in sync by hand until there's a build step that generates one from the
 * other.
 */
export const DESIGN_TOKEN_HEX = {
  "bg": "#FCFAF6",
  "surface": "#FFFFFF",
  "surface-2": "#F5F1EA",
  "line": "#E7E1D8",
  "ink": "#17161A",
  "ink-2": "#4A4750",
  "ink-3": "#7C7885",
  "brew-1": "#123FA8",
  "brew-2": "#2E5BE0",
  "brew-3": "#6C3FD1",
  "brew-4": "#A62D9B",
  "brew-5": "#D62A6B",
  "citrus": "#F3C623",
  "hibiscus": "#C0263C",
  "leaf": "#2F6B4F",
  "turmeric": "#E39A1F",
  "chilli": "#C43B23",
  "coriander": "#7C8F45",
  "pepper": "#37342F",
  "ok": "#2F6B4F",
  "warn": "#B7791F",
  "crit": "#B4232E",
  "gold": "#B08D3F",
} as const;

export type DesignTokenName = keyof typeof DESIGN_TOKEN_HEX;

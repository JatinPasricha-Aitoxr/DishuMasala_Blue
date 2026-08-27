import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TiptapRenderer } from "@/components/content/TiptapRenderer";
import { parseTiptapDoc } from "@/lib/content/tiptap-schema";

/**
 * The real proof required by PROMPTS.md Phase 8's acceptance criteria: "The Tiptap renderer is
 * XSS-safe on hostile input — show the test." A real hostile Tiptap payload — a text node whose
 * `text` is a literal `<script>` tag, and a `link` mark whose `href` is a `javascript:` URI — run
 * through the real production renderer (TiptapRenderer, the same component both the admin preview
 * and the storefront import), asserting the rendered HTML string never contains an executable
 * `<script>` element or a `javascript:` href, only escaped/dropped inert text.
 */
describe("TiptapRenderer XSS safety", () => {
  it("renders a <script>-in-text payload as inert, escaped text — never as a real element", () => {
    const hostileDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: '<script>window.__pwned__ = true;</script><img src=x onerror="window.__pwned__=true">',
            },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(createElement(TiptapRenderer, { doc: hostileDoc }));

    // The payload must never appear as a live element — no real <script> tag, no live onerror
    // handler on a real <img> element (the string "onerror=" is still present, but only as inert,
    // HTML-entity-escaped text content — never inside an actual tag).
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/<img[^&][^>]*onerror/);
    // React's default text-child escaping renders the literal characters as HTML entities.
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).toContain("onerror=&quot;");
  });

  it("drops a javascript: href on a link mark rather than rendering it live", () => {
    const hostileDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click me",
              marks: [{ type: "link", attrs: { href: "javascript:alert(document.cookie)" } }],
            },
          ],
        },
      ],
    };

    // The schema itself rejects the unsafe href — the entire malformed document fails validation
    // and falls back to empty content, so the bad mark can never reach the renderer as a live
    // anchor (a stricter outcome than merely stripping one mark).
    const parsed = parseTiptapDoc(hostileDoc);
    expect(parsed.content).toEqual([]);

    const html = renderToStaticMarkup(createElement(TiptapRenderer, { doc: hostileDoc }));
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("click me");
  });

  it("drops an unknown/hostile node type entirely rather than rendering it", () => {
    const hostileDoc = {
      type: "doc",
      content: [
        // Not in the allowlist (lib/content/tiptap-schema.ts) — e.g. a crafted "htmlBlock" node
        // some other editor/import path might smuggle in.
        { type: "htmlBlock", attrs: { html: "<script>alert(1)</script>" } },
        { type: "paragraph", content: [{ type: "text", text: "safe content" }] },
      ],
    };

    const parsed = parseTiptapDoc(hostileDoc);
    // The whole doc fails validation (an unrecognized node type) and safely falls back to empty —
    // never partially rendering the hostile node.
    expect(parsed.content).toEqual([]);

    const html = renderToStaticMarkup(createElement(TiptapRenderer, { doc: hostileDoc }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("safe content");
  });
});

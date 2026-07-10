/**
 * Scheme "glass" (Glass Focus) — normal contrast.
 * Genuine posts float as frosted-glass cards; ads recede, desaturated.
 * Values ported verbatim from design/preview-v2-inverted.html (scheme "a").
 *
 * The frosted card is TWO stacked overlay layers:
 * - ::before — sheen gradient + border ring + shadows. Always on while
 *   `.adsdim-in`; the scroll gate never touches it.
 * - ::after — blur-only layer beneath the sheen. The scroll gate toggles
 *   ONLY this layer's `opacity` (composited, repaint-safe). It must never
 *   toggle `backdrop-filter` itself: flipping the filter via a rule change
 *   can leave Chrome's compositor with a stale, unblurred backdrop even
 *   though computed style claims the filter is active (user-confirmed on
 *   x.com after trackpad micro-scrolls).
 */
export const glassCss = `
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"]::before {
  content: "";
  position: absolute;
  inset: 4px 8px;
  border-radius: 16px;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02) 45%, rgba(255, 255, 255, 0.05));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 4px 16px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform: scale(0.98);
  transition: opacity 400ms ease, transform 400ms ease, background 120ms ease, box-shadow 120ms ease;
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"]::after {
  content: "";
  position: absolute;
  inset: 4px 8px;
  border-radius: 16px;
  pointer-events: none;
  z-index: 0;
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
  opacity: 0;
  transition: opacity 400ms ease;
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.35));
  box-shadow:
    inset 0 0 0 1px rgba(15, 20, 25, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 4px 14px rgba(15, 20, 25, 0.08);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"]::after {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"].adsdim-in::before {
  opacity: 1;
  transform: scale(1);
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"].adsdim-in::after {
  opacity: 1;
}
/* Hovering a genuine post ENHANCES the glass, never removes it: sheen
   gradient alphas x1.3 and border ring alpha x1.5 over this contrast
   level's base values; the blur layer is untouched. 120ms ease both ways
   (see the base ::before transition). */
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"].adsdim-in:hover::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.091), rgba(255, 255, 255, 0.026) 45%, rgba(255, 255, 255, 0.065));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.21),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 4px 16px rgba(0, 0, 0, 0.45);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"].adsdim-in:hover::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.845), rgba(255, 255, 255, 0.455));
  box-shadow:
    inset 0 0 0 1px rgba(15, 20, 25, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 4px 14px rgba(15, 20, 25, 0.08);
}
/* Scroll-idle gate (P0: backdrop-filter is too expensive mid-scroll).
   While <html> carries adsdim-scrolling the blur layer hides instantly;
   on release it fades back over the base 400ms transition, forcing a clean
   compositor invalidation. The sheen layer stays on throughout, so the
   glass never visually "dies" during hover + trackpad micro-scrolls. */
html.adsdim-scrolling[data-adsdim-scheme="glass"] article[data-adsdim-tier="organic"]::after {
  opacity: 0 !important;
  transition: none !important;
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"],
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"] {
  transition: filter 400ms ease;
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"].adsdim-in {
  filter: saturate(0.35) brightness(0.72);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"].adsdim-in {
  filter: saturate(0.4) brightness(0.96) contrast(0.92);
}
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"].adsdim-in {
  filter: saturate(0.55) brightness(0.82);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"].adsdim-in {
  filter: saturate(0.6);
}
html[data-adsdim-scheme="glass"] .adsdim-pill--hard { color: #F4212E; background: rgba(244, 33, 46, 0.18); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] .adsdim-pill--hard { color: #C0121F; background: rgba(244, 33, 46, 0.10); }
html[data-adsdim-scheme="glass"] .adsdim-pill--soft { color: #FF9A45; background: rgba(255, 122, 0, 0.16); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] .adsdim-pill--soft { color: #B85C00; background: rgba(255, 122, 0, 0.10); }
html[data-adsdim-scheme="glass"] .adsdim-pill--potential { color: #8B98A5; background: rgba(139, 152, 165, 0.16); box-shadow: inset 0 0 0 1px rgba(139, 152, 165, 0.3); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"] .adsdim-pill--potential { color: #536471; background: rgba(83, 100, 113, 0.08); box-shadow: none; }
`;

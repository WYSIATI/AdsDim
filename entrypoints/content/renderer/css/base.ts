/**
 * Base plumbing shared by all schemes. Zero layout shift by construction:
 * only background/box-shadow/outline/filter/opacity/transform/overlays.
 * The `article > div` rule mirrors the mockup's `.post-inner`, lifting tweet
 * content above the absolutely-positioned ::before overlay cards.
 */
export const baseCss = `
article[data-adsdim-tier] {
  position: relative;
}
article[data-adsdim-tier] > div {
  position: relative;
  z-index: 1;
  transition: transform 120ms ease;
}
.adsdim-pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 9999px;
  font-weight: 600;
  margin-left: 6px;
  vertical-align: middle;
  white-space: nowrap;
}
/* Scroll-idle gating: backdrop-filter is too expensive mid-scroll (P0 for
   the default glass scheme). Re-enabled 150ms after scrolling stops. */
html.adsdim-scrolling article[data-adsdim-tier="organic"]::before {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;

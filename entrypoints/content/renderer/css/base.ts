/**
 * Base plumbing shared by all schemes. Zero layout shift by construction:
 * only background/box-shadow/outline/filter/opacity/transform/overlays.
 * The `article > div` rule mirrors the mockup's `.post-inner`, lifting tweet
 * content above the absolutely-positioned overlay-card pseudo layers.
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
  /* Zero layout shift: line-height 1 stops the pill from inheriting X's
     20px row line-height, and the negative vertical margins cancel the
     padding so the pill's line-box contribution is only its 11px text box.
     The padded background still paints full-size; it just can't grow the
     name row (regression caught by e2e/tests/layout-shift.spec.ts). */
  line-height: 1;
  padding: 2px 6px;
  margin: -2px 0 -2px 6px;
  border-radius: 9999px;
  font-weight: 600;
  vertical-align: middle;
  white-space: nowrap;
}
`;

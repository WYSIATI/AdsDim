/**
 * Scheme "theater" (Theater) — normal contrast.
 * Ads dim like house lights going down; genuine posts stay untouched.
 * Values ported verbatim from design/preview-v2-inverted.html (scheme "c").
 */
export const theaterCss = `
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="organic"]:hover > div {
  transform: scale(1.004);
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"],
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"],
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"] {
  transition: opacity 400ms ease, filter 400ms ease;
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"].adsdim-in {
  opacity: 0.5;
  filter: grayscale(0.9) brightness(0.75);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"].adsdim-in {
  opacity: 0.55;
  filter: grayscale(0.9) contrast(0.9);
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"].adsdim-in {
  opacity: 0.68;
  filter: grayscale(0.55) brightness(0.85);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"].adsdim-in {
  opacity: 0.72;
  filter: grayscale(0.55);
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.85;
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.88;
}
html[data-adsdim-scheme="theater"] .adsdim-pill--hard { color: #F4212E; background: rgba(244, 33, 46, 0.18); box-shadow: inset 0 0 0 1px rgba(244, 33, 46, 0.35); }
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] .adsdim-pill--hard { color: #C0121F; background: rgba(244, 33, 46, 0.09); box-shadow: none; }
html[data-adsdim-scheme="theater"] .adsdim-pill--soft { color: #FFAD1F; background: rgba(255, 173, 31, 0.16); box-shadow: inset 0 0 0 1px rgba(255, 173, 31, 0.35); }
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] .adsdim-pill--soft { color: #8a6100; background: rgba(255, 173, 31, 0.14); box-shadow: none; }
html[data-adsdim-scheme="theater"] .adsdim-pill--potential { color: #8B98A5; background: rgba(139, 152, 165, 0.15); box-shadow: inset 0 0 0 1px rgba(139, 152, 165, 0.3); }
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"] .adsdim-pill--potential { color: #536471; background: rgba(83, 100, 113, 0.08); box-shadow: none; }
`;

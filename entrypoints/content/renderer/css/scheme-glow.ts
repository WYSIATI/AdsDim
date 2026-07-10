/**
 * Scheme "glow" (Glow Lane) — normal contrast.
 * Genuine posts earn a gradient ring and left glow; ads fade toward gray.
 * Values ported verbatim from design/preview-v2-inverted.html (scheme "b").
 */
export const glowCss = `
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"]::before {
  content: "";
  position: absolute;
  inset: 2px 6px;
  border-radius: 14px;
  pointer-events: none;
  z-index: 0;
  padding: 1px;
  background: linear-gradient(135deg, rgba(29, 155, 240, 0.55), rgba(0, 186, 124, 0.45));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 400ms ease;
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(135deg, rgba(29, 155, 240, 0.45), rgba(0, 186, 124, 0.35));
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"] {
  transition: box-shadow 400ms ease;
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"][data-adsdim-in]::before {
  opacity: 1;
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"][data-adsdim-in] {
  box-shadow: -6px 0 14px -6px rgba(29, 155, 240, 0.35);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] article[data-adsdim-tier="organic"][data-adsdim-in] {
  box-shadow: -6px 0 12px -8px rgba(29, 155, 240, 0.28);
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"],
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"] {
  transition: filter 400ms ease, opacity 400ms ease;
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"][data-adsdim-in] {
  filter: grayscale(0.85) brightness(0.7);
  opacity: 0.85;
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"][data-adsdim-in] {
  filter: grayscale(0.85) contrast(0.9);
  opacity: 0.9;
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"][data-adsdim-in] {
  filter: grayscale(0.5) brightness(0.82);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"][data-adsdim-in] {
  filter: grayscale(0.5);
}
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="potential"][data-adsdim-in] {
  outline: 1px dashed rgba(139, 152, 165, 0.35);
  outline-offset: -4px;
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] article[data-adsdim-tier="potential"][data-adsdim-in] {
  outline-color: rgba(83, 100, 113, 0.3);
}
html[data-adsdim-scheme="glow"] .adsdim-pill--hard { color: #F4212E; background: rgba(244, 33, 46, 0.15); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] .adsdim-pill--hard { color: #C0121F; background: rgba(244, 33, 46, 0.08); }
html[data-adsdim-scheme="glow"] .adsdim-pill--soft { color: #FFB020; background: rgba(255, 176, 32, 0.14); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] .adsdim-pill--soft { color: #8a6100; background: rgba(255, 176, 32, 0.12); }
html[data-adsdim-scheme="glow"] .adsdim-pill--potential { color: #8B98A5; background: rgba(139, 152, 165, 0.14); }
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"] .adsdim-pill--potential { color: #536471; background: rgba(83, 100, 113, 0.07); }
`;

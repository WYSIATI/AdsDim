/**
 * Hovering a dimmed ad restores full visibility — CSS only, loaded last.
 * `!important` intentionally beats every theme × scheme × contrast combo.
 * Theater keeps the mockup's 0.95 resting-hover opacity; the other schemes
 * restore fully.
 */
export const hoverRevealCss = `
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"].adsdim-in:hover,
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"].adsdim-in:hover,
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="potential"].adsdim-in:hover,
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"].adsdim-in:hover,
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"].adsdim-in:hover,
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="potential"].adsdim-in:hover {
  filter: none !important;
  opacity: 1 !important;
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"].adsdim-in:hover,
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"].adsdim-in:hover,
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"].adsdim-in:hover {
  opacity: 0.95 !important;
  filter: none !important;
  transition-duration: 150ms;
}
html[data-adsdim-scheme] article[data-adsdim-tier="hard"].adsdim-in:hover > div,
html[data-adsdim-scheme] article[data-adsdim-tier="soft"].adsdim-in:hover > div,
html[data-adsdim-scheme] article[data-adsdim-tier="potential"].adsdim-in:hover > div {
  transform: scale(1) !important;
}
`;

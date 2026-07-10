/**
 * Hovering a dimmed ad — or reaching it with the keyboard — restores full
 * visibility. CSS only, loaded last.
 * `!important` intentionally beats every theme × scheme × contrast combo.
 * Theater keeps the mockup's 0.95 resting-hover opacity; the other schemes
 * restore fully.
 *
 * Keyboard reveal is keyed on `:focus-visible` (on the article itself or on
 * any descendant via `:has()`), deliberately never on `:focus-within` or
 * bare `:focus`: X's articles are focusable (tabindex="0"), so a mouse click
 * parks `:focus` inside the article and X's SPA back-navigation restores it.
 * A `:focus-within` reveal would therefore stay pinned open after a click or
 * a back-navigation, while `:focus-visible` only matches keyboard-driven
 * focus — pointer users keep pure hover semantics.
 */
const reveal = ':is(:hover, :focus-visible, :has(:focus-visible))';

export const hoverRevealCss = `
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"].adsdim-in${reveal},
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"].adsdim-in${reveal},
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="potential"].adsdim-in${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"].adsdim-in${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"].adsdim-in${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="potential"].adsdim-in${reveal} {
  filter: none !important;
  opacity: 1 !important;
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"].adsdim-in${reveal},
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"].adsdim-in${reveal},
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"].adsdim-in${reveal} {
  opacity: 0.95 !important;
  filter: none !important;
  transition-duration: 150ms;
}
html[data-adsdim-scheme] article[data-adsdim-tier="hard"].adsdim-in${reveal} > div,
html[data-adsdim-scheme] article[data-adsdim-tier="soft"].adsdim-in${reveal} > div,
html[data-adsdim-scheme] article[data-adsdim-tier="potential"].adsdim-in${reveal} > div {
  transform: scale(1) !important;
}
`;

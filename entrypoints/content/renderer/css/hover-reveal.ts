/**
 * Hovering a dimmed ad — or reaching it with the keyboard — restores full
 * visibility. Loaded last.
 * `!important` intentionally beats every theme × scheme × contrast combo.
 * Theater keeps the mockup's 0.95 resting-hover opacity; the other schemes
 * restore fully.
 *
 * Keyboard reveal is keyed on the JS-managed `data-adsdim-kb-reveal`
 * attribute (see renderer/keyboard-reveal.ts) — an attribute, not a class,
 * because X's React owns the article's className and rewrites it wholesale
 * on re-renders — and deliberately NEVER on any focus
 * pseudo-class — not `:focus`, `:focus-within`, `:focus-visible`, nor
 * `:has(:focus-visible)`. X programmatically re-focuses timeline tweets
 * after clicks and during scrolling (keyboard-nav anchoring), and Chromium
 * applies `:focus-visible` to programmatic `.focus()` whenever the session
 * has had no mousedown yet or the last input was a key. Mouse movement
 * never blurs the tweet, so any focus-pseudo-class reveal latches
 * indefinitely (user-confirmed on x.com). Pointer users get pure `:hover`.
 */
const reveal = ':is(:hover, [data-adsdim-kb-reveal])';

export const hoverRevealCss = `
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="hard"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="soft"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="glass"] article[data-adsdim-tier="potential"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="hard"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="soft"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="glow"] article[data-adsdim-tier="potential"][data-adsdim-in]${reveal} {
  filter: none !important;
  opacity: 1 !important;
}
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="hard"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="soft"][data-adsdim-in]${reveal},
html[data-adsdim-scheme="theater"] article[data-adsdim-tier="potential"][data-adsdim-in]${reveal} {
  opacity: 0.95 !important;
  filter: none !important;
  transition-duration: 150ms;
}
html[data-adsdim-scheme] article[data-adsdim-tier="hard"][data-adsdim-in]${reveal} > div,
html[data-adsdim-scheme] article[data-adsdim-tier="soft"][data-adsdim-in]${reveal} > div,
html[data-adsdim-scheme] article[data-adsdim-tier="potential"][data-adsdim-in]${reveal} > div {
  transform: scale(1) !important;
}
`;

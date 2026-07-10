/**
 * Strong contrast mode overrides (the default). Loaded after the scheme
 * blocks so its equal-or-higher-specificity rules win, exactly like the
 * source-order layering in design/preview-v2-inverted.html.
 */
export const contrastStrongCss = `
html[data-adsdim-contrast="strong"] article[data-adsdim-tier] {
  transition: opacity 200ms ease, filter 200ms ease, box-shadow 200ms ease;
}
html[data-adsdim-contrast="strong"] article[data-adsdim-tier]::before {
  transition-duration: 200ms;
}
html[data-adsdim-contrast="strong"] article[data-adsdim-tier] > div {
  transition: transform 200ms ease;
}
html[data-adsdim-contrast="strong"] .adsdim-pill {
  font-size: 12px;
  padding: 3px 8px;
}
html[data-adsdim-theme="dark"][data-adsdim-contrast="strong"] .adsdim-pill--hard { color: #FF6B75; }
html[data-adsdim-theme="dark"][data-adsdim-contrast="strong"] .adsdim-pill--soft { color: #FFC24D; }
html[data-adsdim-theme="dark"][data-adsdim-contrast="strong"] .adsdim-pill--potential { color: #A8B4C0; }

/* ----- Strong · glass (Glass Focus) ----- */
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.03) 45%, rgba(255, 255, 255, 0.08));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 28px rgba(0, 0, 0, 0.6);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.56));
  box-shadow:
    inset 0 0 0 1px rgba(15, 20, 25, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 8px 24px rgba(15, 20, 25, 0.14);
}
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in > div {
  transform: scale(1.01);
}
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in {
  filter: saturate(0.15) brightness(0.5);
  opacity: 0.55;
}
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in > div {
  transform: scale(0.97);
}
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="soft"].adsdim-in {
  filter: saturate(0.3) brightness(0.65);
  opacity: 0.7;
}
html[data-adsdim-scheme="glass"][data-adsdim-contrast="strong"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.8;
  filter: saturate(0.6);
}

/* ----- Strong · glow (Glow Lane) ----- */
html[data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(135deg, rgba(29, 155, 240, 0.8), rgba(0, 186, 124, 0.68));
}
html[data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in {
  box-shadow: -10px 0 22px -6px rgba(29, 155, 240, 0.5);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"]::before {
  background: linear-gradient(135deg, rgba(29, 155, 240, 0.68), rgba(0, 186, 124, 0.53));
}
html[data-adsdim-theme="light"][data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in {
  box-shadow: -10px 0 20px -8px rgba(29, 155, 240, 0.42);
}
html[data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in {
  filter: grayscale(1) brightness(0.55) blur(1px);
  opacity: 0.6;
}
html[data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="soft"].adsdim-in {
  filter: grayscale(0.8) brightness(0.7);
  opacity: 0.7;
}
html[data-adsdim-scheme="glow"][data-adsdim-contrast="strong"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.8;
  outline: 1px dashed rgba(139, 152, 165, 0.5);
  outline-offset: -4px;
}

/* ----- Strong · theater (Theater) ----- */
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in {
  filter: brightness(1.06) saturate(1.12);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in {
  filter: brightness(1) saturate(1.08);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="organic"].adsdim-in > div {
  transform: scale(1.01);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in {
  opacity: 0.3;
  filter: grayscale(1) brightness(0.55) blur(1.2px);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in > div {
  transform: scale(0.97);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="hard"].adsdim-in {
  opacity: 0.35;
  filter: grayscale(1) contrast(0.85) blur(1px);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="soft"].adsdim-in {
  opacity: 0.45;
  filter: grayscale(0.85) brightness(0.65) blur(0.6px);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="soft"].adsdim-in > div {
  transform: scale(0.98);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="soft"].adsdim-in {
  opacity: 0.5;
  filter: grayscale(0.8);
}
html[data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.68;
  filter: grayscale(0.45) brightness(0.85);
}
html[data-adsdim-theme="light"][data-adsdim-scheme="theater"][data-adsdim-contrast="strong"] article[data-adsdim-tier="potential"].adsdim-in {
  opacity: 0.72;
  filter: grayscale(0.4);
}
`;

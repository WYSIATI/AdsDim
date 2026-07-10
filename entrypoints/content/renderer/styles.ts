import { baseCss } from './css/base';
import { glassCss } from './css/scheme-glass';
import { glowCss } from './css/scheme-glow';
import { theaterCss } from './css/scheme-theater';
import { contrastStrongCss } from './css/contrast-strong';
import { hoverRevealCss } from './css/hover-reveal';

export const STYLE_ELEMENT_ID = 'adsdim-styles';

/**
 * Full stylesheet. Order matters and mirrors the design mockup:
 * base -> schemes (normal contrast) -> strong contrast -> hover reveal.
 */
export function buildStylesheet(): string {
  return [baseCss, glassCss, glowCss, theaterCss, contrastStrongCss, hoverRevealCss].join('\n');
}

/** Injects the stylesheet once; safe to call repeatedly. */
export function injectStyles(doc: Document): HTMLStyleElement {
  const existing = doc.getElementById(STYLE_ELEMENT_ID);
  if (existing instanceof HTMLStyleElement) return existing;

  const style = doc.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = buildStylesheet();
  (doc.head ?? doc.documentElement).appendChild(style);
  return style;
}

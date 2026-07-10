import type { Theme } from '../../../src/types';

const RGB_PATTERN = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/;

/**
 * Detects X's active theme from the page background color.
 * Covers default (#fff), dim (#15202b) and lights-out (#000) themes.
 */
export function detectTheme(doc: Document): Theme {
  const view = doc.defaultView;
  if (!view || !doc.body) return 'light';

  const background = view.getComputedStyle(doc.body).backgroundColor;
  const match = background.match(RGB_PATTERN);
  if (!match) return 'light';

  const [, r, g, b, alpha] = match;
  if (alpha !== undefined && Number(alpha) === 0) return 'light';

  const luminance = (0.2126 * Number(r) + 0.7152 * Number(g) + 0.0722 * Number(b)) / 255;
  return luminance < 0.5 ? 'dark' : 'light';
}

/** Re-detects the theme whenever the body's style/class changes. */
export function watchTheme(doc: Document, onChange: (theme: Theme) => void): () => void {
  if (!doc.body) return () => undefined;

  const observer = new MutationObserver(() => onChange(detectTheme(doc)));
  observer.observe(doc.body, { attributes: true, attributeFilter: ['style', 'class'] });
  return () => observer.disconnect();
}

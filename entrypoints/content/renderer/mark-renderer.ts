import { X_SELECTORS } from '../../../src/selectors/x-selectors';
import type { Settings } from '../../../src/storage/schema';
import type { MarkTier, Theme } from '../../../src/types';

export const TIER_ATTR = 'data-adsdim-tier';
export const SCHEME_ATTR = 'data-adsdim-scheme';
export const CONTRAST_ATTR = 'data-adsdim-contrast';
export const THEME_ATTR = 'data-adsdim-theme';
export const PILL_CLASS = 'adsdim-pill';

export interface PillLabels {
  readonly hard: string;
  readonly soft: string;
  readonly potential: string;
}

/**
 * Marks a tweet article with its tier. All visuals are driven by CSS keyed
 * off the data attribute — the DOM change is attribute + one pill span.
 * Idempotent: re-invoking with the same tier is a no-op; a changed tier
 * swaps the attribute and pill in place. Returns true when the DOM changed.
 */
export function renderMark(article: Element, tier: MarkTier, labels: PillLabels): boolean {
  if (article.getAttribute(TIER_ATTR) === tier) {
    return false;
  }

  article.querySelector(`.${PILL_CLASS}`)?.remove();
  article.setAttribute(TIER_ATTR, tier);
  if (tier !== 'organic') {
    injectPill(article, tier, labels[tier]);
  }
  return true;
}

function injectPill(article: Element, tier: Exclude<MarkTier, 'organic'>, label: string): void {
  const pill = article.ownerDocument.createElement('span');
  pill.className = `${PILL_CLASS} ${PILL_CLASS}--${tier}`;
  pill.textContent = label;

  const nameRow = article.querySelector(X_SELECTORS.userName);
  (nameRow ?? article).appendChild(pill);
}

/** Removes every AdsDim mark and pill under `root`. */
export function clearMarks(root: ParentNode): void {
  for (const pill of root.querySelectorAll(`.${PILL_CLASS}`)) {
    pill.remove();
  }
  for (const marked of root.querySelectorAll(`[${TIER_ATTR}]`)) {
    marked.removeAttribute(TIER_ATTR);
  }
}

/**
 * Reflects settings + detected theme on <html>. When disabled, the scheme
 * and contrast attributes are removed, which switches every rule off.
 */
export function applyRootState(doc: Document, settings: Settings, theme: Theme): void {
  const root = doc.documentElement;
  if (settings.enabled) {
    root.setAttribute(SCHEME_ATTR, settings.scheme);
    root.setAttribute(CONTRAST_ATTR, settings.contrast);
  } else {
    root.removeAttribute(SCHEME_ATTR);
    root.removeAttribute(CONTRAST_ATTR);
  }
  root.setAttribute(THEME_ATTR, theme);
}

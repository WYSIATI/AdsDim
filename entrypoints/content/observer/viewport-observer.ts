/**
 * In-view marker attribute. Deliberately a data-* attribute and NOT a class:
 * the tweet article's className is owned by X's React, which rewrites it
 * wholesale on any re-render (hover, like counts, ...), silently erasing
 * injected classes. React leaves unknown data-* attributes alone.
 */
export const IN_VIEW_ATTR = 'data-adsdim-in';

/** Pre-activate marks slightly before they scroll into view. */
const ROOT_MARGIN = '150px 0px';

export interface ViewportObserver {
  observe(element: Element): void;
  disconnect(): void;
}

/** Applies the in-view state idempotently: no-op writes, no observer echo. */
function applyInView(element: Element, inView: boolean): void {
  if (inView) {
    if (element.getAttribute(IN_VIEW_ATTR) !== '1') element.setAttribute(IN_VIEW_ATTR, '1');
  } else if (element.hasAttribute(IN_VIEW_ATTR)) {
    element.removeAttribute(IN_VIEW_ATTR);
  }
}

/**
 * Gates visual effects on viewport visibility: articles only carry the
 * `data-adsdim-in` attribute while (nearly) visible, so offscreen rows cost
 * nothing — important for the glass scheme's backdrop-filter.
 *
 * The last known in-view state is remembered per element, and `observe()`
 * re-asserts it on every call: if X's React wiped the attribute, the next
 * timeline scan heals it without waiting for a new intersection change.
 *
 * Falls back to always-in when IntersectionObserver is unavailable (jsdom).
 */
export function createViewportObserver(win: Window & typeof globalThis): ViewportObserver {
  if (typeof win.IntersectionObserver !== 'function') {
    return {
      observe(element: Element): void {
        applyInView(element, true);
      },
      disconnect(): void {},
    };
  }

  const inViewByElement = new WeakMap<Element, boolean>();
  const io = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inViewByElement.set(entry.target, entry.isIntersecting);
        applyInView(entry.target, entry.isIntersecting);
      }
    },
    { rootMargin: ROOT_MARGIN },
  );

  return {
    observe(element: Element): void {
      const known = inViewByElement.get(element);
      if (known !== undefined) {
        // Already tracked: self-heal the attribute from the known state.
        applyInView(element, known);
        return;
      }
      inViewByElement.set(element, false);
      io.observe(element);
    },
    disconnect(): void {
      io.disconnect();
    },
  };
}

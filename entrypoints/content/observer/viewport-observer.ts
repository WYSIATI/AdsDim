export const IN_VIEW_CLASS = 'adsdim-in';

/** Pre-activate marks slightly before they scroll into view. */
const ROOT_MARGIN = '150px 0px';

export interface ViewportObserver {
  observe(element: Element): void;
  disconnect(): void;
}

/**
 * Gates visual effects on viewport visibility: articles only carry the
 * `adsdim-in` class while (nearly) visible, so offscreen rows cost nothing —
 * important for the glass scheme's backdrop-filter.
 *
 * Falls back to always-in when IntersectionObserver is unavailable (jsdom).
 */
export function createViewportObserver(win: Window & typeof globalThis): ViewportObserver {
  if (typeof win.IntersectionObserver !== 'function') {
    return {
      observe(element: Element): void {
        element.classList.add(IN_VIEW_CLASS);
      },
      disconnect(): void {},
    };
  }

  const observed = new WeakSet<Element>();
  const io = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle(IN_VIEW_CLASS, entry.isIntersecting);
      }
    },
    { rootMargin: ROOT_MARGIN },
  );

  return {
    observe(element: Element): void {
      if (observed.has(element)) return;
      observed.add(element);
      io.observe(element);
    },
    disconnect(): void {
      io.disconnect();
    },
  };
}

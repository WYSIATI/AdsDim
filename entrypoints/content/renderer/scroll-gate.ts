export const SCROLLING_CLASS = 'adsdim-scrolling';
export const SCROLL_IDLE_MS = 150;

export interface ScrollGate {
  start(): void;
  stop(): void;
}

/**
 * Scroll-idle gate for the glass scheme's backdrop-filter (P0: glass is the
 * default scheme). While scrolling, <html> carries `adsdim-scrolling`, which
 * the stylesheet uses to disable backdrop-filter; the class is dropped after
 * 150ms of scroll idleness.
 */
export function createScrollGate(win: Window, idleMs: number = SCROLL_IDLE_MS): ScrollGate {
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const root = () => win.document.documentElement;

  const onScroll = (): void => {
    root().classList.add(SCROLLING_CLASS);
    if (idleTimer !== undefined) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      root().classList.remove(SCROLLING_CLASS);
      idleTimer = undefined;
    }, idleMs);
  };

  return {
    start(): void {
      win.addEventListener('scroll', onScroll, { passive: true });
    },
    stop(): void {
      win.removeEventListener('scroll', onScroll);
      if (idleTimer !== undefined) clearTimeout(idleTimer);
      idleTimer = undefined;
      root().classList.remove(SCROLLING_CLASS);
    },
  };
}

export const SCROLLING_CLASS = 'adsdim-scrolling';
export const SCROLL_IDLE_MS = 150;

export interface ScrollGate {
  start(): void;
  stop(): void;
}

/**
 * Scroll-idle gate for the glass scheme's backdrop-filter (P0: glass is the
 * default scheme). While scrolling, <html> carries `adsdim-scrolling`, which
 * the stylesheet uses to hide the blur-only overlay layer via its composited
 * opacity (never by toggling backdrop-filter — Chrome may fail to repaint
 * the blur on re-enable); the class is dropped after 150ms of scroll
 * idleness. (The <html> element is outside X's React root, so a class is
 * safe here — unlike on tweet articles.)
 *
 * `onIdle` fires once each time the gate releases — the hook the self-heal
 * sweep rides to re-assert marking state on the now-visible articles.
 */
export function createScrollGate(
  win: Window,
  idleMs: number = SCROLL_IDLE_MS,
  onIdle?: () => void,
): ScrollGate {
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const root = () => win.document.documentElement;

  const onScroll = (): void => {
    root().classList.add(SCROLLING_CLASS);
    if (idleTimer !== undefined) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      root().classList.remove(SCROLLING_CLASS);
      idleTimer = undefined;
      onIdle?.();
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

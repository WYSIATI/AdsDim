export const KB_REVEAL_CLASS = 'adsdim-kb-reveal';

/** Keys that signal genuine keyboard navigation. */
const NAV_KEYS: ReadonlySet<string> = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

const ARTICLE_SELECTOR = 'article[data-adsdim-tier]';

export interface KeyboardReveal {
  start(): void;
  stop(): void;
}

/**
 * JS-managed keyboard reveal for dimmed ads.
 *
 * The reveal stylesheet must never key on focus pseudo-classes: X
 * programmatically re-focuses timeline tweets after clicks and during
 * scrolling (keyboard-nav anchoring), and Chromium applies `:focus-visible`
 * to programmatic `.focus()` whenever the session has had no mousedown yet
 * or the last input was a key. Since mouse movement never blurs the tweet,
 * a CSS focus reveal latches indefinitely (user-confirmed on x.com).
 *
 * Instead, this module reveals via the `adsdim-kb-reveal` class, and only
 * for focus that follows a real navigation key:
 *
 * - keydown on Tab/arrows arms keyboard modality;
 * - any pointer activity (mousedown/mousemove/wheel) disarms it AND drops an
 *   active reveal — pointer users keep pure `:hover` semantics;
 * - focusin reveals the enclosing article only while armed, so programmatic
 *   `.focus()` with no preceding navigation key never reveals;
 * - focusout drops the reveal once focus leaves the article.
 */
export function createKeyboardReveal(win: Window): KeyboardReveal {
  const doc = win.document;
  let keyboardModality = false;
  let revealedArticle: Element | undefined;

  const removeReveal = (): void => {
    revealedArticle?.classList.remove(KB_REVEAL_CLASS);
    revealedArticle = undefined;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (NAV_KEYS.has(event.key)) keyboardModality = true;
  };

  const onPointer = (): void => {
    keyboardModality = false;
    removeReveal();
  };

  const onFocusIn = (event: FocusEvent): void => {
    if (!keyboardModality) return;
    const target = event.target;
    const article = target instanceof Element ? target.closest(ARTICLE_SELECTOR) : null;
    if (!article || article === revealedArticle) return;
    removeReveal();
    article.classList.add(KB_REVEAL_CLASS);
    revealedArticle = article;
  };

  const onFocusOut = (event: FocusEvent): void => {
    if (!revealedArticle) return;
    const next = event.relatedTarget;
    // Focus moving within the revealed article keeps the reveal.
    if (next instanceof Element && revealedArticle.contains(next)) return;
    removeReveal();
  };

  // Capture phase everywhere: X's own handlers may stop propagation.
  const passiveCapture: AddEventListenerOptions = { capture: true, passive: true };

  return {
    start(): void {
      doc.addEventListener('keydown', onKeyDown, true);
      doc.addEventListener('mousedown', onPointer, true);
      doc.addEventListener('mousemove', onPointer, passiveCapture);
      doc.addEventListener('wheel', onPointer, passiveCapture);
      doc.addEventListener('focusin', onFocusIn, true);
      doc.addEventListener('focusout', onFocusOut, true);
    },
    stop(): void {
      doc.removeEventListener('keydown', onKeyDown, true);
      doc.removeEventListener('mousedown', onPointer, true);
      doc.removeEventListener('mousemove', onPointer, passiveCapture);
      doc.removeEventListener('wheel', onPointer, passiveCapture);
      doc.removeEventListener('focusin', onFocusIn, true);
      doc.removeEventListener('focusout', onFocusOut, true);
      keyboardModality = false;
      removeReveal();
    },
  };
}

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { KeyboardReveal } from '../../entrypoints/content/renderer/keyboard-reveal';
import {
  createKeyboardReveal,
  KB_REVEAL_ATTR,
} from '../../entrypoints/content/renderer/keyboard-reveal';

const pressKey = (key: string): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

const pointerEvent = (type: 'mousedown' | 'mousemove' | 'wheel'): void => {
  document.dispatchEvent(new Event(type, { bubbles: true }));
};

const byId = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id}`);
  return element;
};

describe('createKeyboardReveal', () => {
  let reveal: KeyboardReveal;

  const ad = (): HTMLElement => byId('ad');
  const hasReveal = (): boolean => ad().hasAttribute(KB_REVEAL_ATTR);

  beforeEach(() => {
    document.body.innerHTML = `
      <article id="ad" data-adsdim-tier="hard" tabindex="0">
        <div>
          <a id="inside" href="https://example.com/a">inside</a>
          <a id="inside2" href="https://example.com/b">inside two</a>
        </div>
      </article>
      <article id="ad2" data-adsdim-tier="soft" tabindex="0">
        <div><a id="other" href="https://example.com/c">other</a></div>
      </article>
      <a id="outside" href="https://example.com/d">outside</a>
    `;
    reveal = createKeyboardReveal(window);
    reveal.start();
  });

  afterEach(() => {
    reveal.stop();
    document.body.innerHTML = '';
  });

  it('never reveals on programmatic focus without a preceding navigation key', () => {
    // X's timeline focus management calls .focus() after clicks and scrolls.
    byId('inside').focus();
    expect(hasReveal()).toBe(false);
  });

  it('reveals the enclosing article when focus follows a Tab press', () => {
    pressKey('Tab');
    byId('inside').focus();
    expect(hasReveal()).toBe(true);
  });

  it('treats arrow keys as keyboard navigation', () => {
    pressKey('ArrowDown');
    byId('inside').focus();
    expect(hasReveal()).toBe(true);
  });

  it('ignores non-navigation keys', () => {
    pressKey('j');
    byId('inside').focus();
    expect(hasReveal()).toBe(false);
  });

  it('keeps the reveal while focus moves within the same article', () => {
    pressKey('Tab');
    byId('inside').focus();
    byId('inside2').focus();
    expect(hasReveal()).toBe(true);
  });

  it('drops the reveal when focus leaves the article', () => {
    pressKey('Tab');
    byId('inside').focus();
    byId('outside').focus();
    expect(hasReveal()).toBe(false);
  });

  it('moves the reveal when focus jumps to another marked article', () => {
    pressKey('Tab');
    byId('inside').focus();
    pressKey('Tab');
    byId('other').focus();
    expect(hasReveal()).toBe(false);
    expect(byId('ad2').hasAttribute(KB_REVEAL_ATTR)).toBe(true);
  });

  it('mousedown disarms keyboard modality', () => {
    pressKey('Tab');
    pointerEvent('mousedown');
    byId('inside').focus();
    expect(hasReveal()).toBe(false);
  });

  it('wheel (trackpad scrolling) disarms keyboard modality', () => {
    pressKey('Tab');
    pointerEvent('wheel');
    byId('inside').focus();
    expect(hasReveal()).toBe(false);
  });

  it('mouse movement drops an active reveal — pointer users get pure hover', () => {
    pressKey('Tab');
    byId('inside').focus();
    expect(hasReveal()).toBe(true);
    pointerEvent('mousemove');
    expect(hasReveal()).toBe(false);
  });

  it('stop() removes the active reveal and detaches all listeners', () => {
    pressKey('Tab');
    byId('inside').focus();
    expect(hasReveal()).toBe(true);

    reveal.stop();
    expect(hasReveal()).toBe(false);

    pressKey('Tab');
    byId('inside2').focus();
    expect(hasReveal()).toBe(false);
  });
});

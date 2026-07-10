import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScrollGate } from '../../entrypoints/content/renderer/scroll-gate';
import {
  createScrollGate,
  SCROLL_IDLE_MS,
  SCROLLING_CLASS,
} from '../../entrypoints/content/renderer/scroll-gate';

const root = (): DOMTokenList => document.documentElement.classList;

describe('createScrollGate', () => {
  let gate: ScrollGate;

  beforeEach(() => {
    vi.useFakeTimers();
    gate = createScrollGate(window);
    gate.start();
  });

  afterEach(() => {
    gate.stop();
    vi.useRealTimers();
    document.documentElement.className = '';
  });

  it('adds the scrolling class on scroll and removes it after 150ms idle', () => {
    window.dispatchEvent(new Event('scroll'));
    expect(root().contains(SCROLLING_CLASS)).toBe(true);

    vi.advanceTimersByTime(SCROLL_IDLE_MS - 1);
    expect(root().contains(SCROLLING_CLASS)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(root().contains(SCROLLING_CLASS)).toBe(false);
  });

  it('keeps the class while scrolling continues (debounce)', () => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(100);
    expect(root().contains(SCROLLING_CLASS)).toBe(true);

    vi.advanceTimersByTime(SCROLL_IDLE_MS);
    expect(root().contains(SCROLLING_CLASS)).toBe(false);
  });

  it('stop() detaches the listener and clears the class immediately', () => {
    window.dispatchEvent(new Event('scroll'));
    gate.stop();
    expect(root().contains(SCROLLING_CLASS)).toBe(false);

    window.dispatchEvent(new Event('scroll'));
    expect(root().contains(SCROLLING_CLASS)).toBe(false);
  });
});

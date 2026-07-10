import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createViewportObserver,
  IN_VIEW_CLASS,
} from '../../entrypoints/content/observer/viewport-observer';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('createViewportObserver', () => {
  it('falls back to always-in-view when IntersectionObserver is missing (jsdom)', () => {
    const observer = createViewportObserver(window);
    const el = document.createElement('article');
    observer.observe(el);
    expect(el.classList.contains(IN_VIEW_CLASS)).toBe(true);
    observer.disconnect();
  });

  it('toggles the class from IntersectionObserver entries', () => {
    let capturedCallback: IntersectionObserverCallback = () => undefined;
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();

    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    const observer = createViewportObserver(window);
    const el = document.createElement('article');
    observer.observe(el);
    observer.observe(el); // duplicate observe is a no-op
    expect(observeSpy).toHaveBeenCalledTimes(1);

    const entry = (isIntersecting: boolean): IntersectionObserverEntry =>
      ({ target: el, isIntersecting }) as unknown as IntersectionObserverEntry;

    const fakeIo = {} as IntersectionObserver;
    capturedCallback([entry(true)], fakeIo);
    expect(el.classList.contains(IN_VIEW_CLASS)).toBe(true);

    capturedCallback([entry(false)], fakeIo);
    expect(el.classList.contains(IN_VIEW_CLASS)).toBe(false);

    observer.disconnect();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});

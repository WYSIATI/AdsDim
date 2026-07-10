import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createViewportObserver,
  IN_VIEW_ATTR,
} from '../../entrypoints/content/observer/viewport-observer';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const isInView = (el: Element): boolean => el.getAttribute(IN_VIEW_ATTR) === '1';

describe('createViewportObserver', () => {
  it('exposes the in-view state as a data attribute, never a class', () => {
    // The article's className is owned by X's React and rewritten wholesale
    // on re-renders; only data-* attributes survive reconciliation.
    expect(IN_VIEW_ATTR).toMatch(/^data-adsdim-/);
  });

  it('falls back to always-in-view when IntersectionObserver is missing (jsdom)', () => {
    const observer = createViewportObserver(window);
    const el = document.createElement('article');
    observer.observe(el);
    expect(isInView(el)).toBe(true);
    observer.disconnect();
  });

  it('toggles the attribute from IntersectionObserver entries', () => {
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
    expect(isInView(el)).toBe(true);

    capturedCallback([entry(false)], fakeIo);
    expect(isInView(el)).toBe(false);

    observer.disconnect();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('re-observing heals the attribute after an external wipe (React re-render)', () => {
    let capturedCallback: IntersectionObserverCallback = () => undefined;

    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    const observer = createViewportObserver(window);
    const el = document.createElement('article');
    observer.observe(el);

    const entry = { target: el, isIntersecting: true } as unknown as IntersectionObserverEntry;
    capturedCallback([entry], {} as IntersectionObserver);
    expect(isInView(el)).toBe(true);

    // X's React strips the attribute on a hover re-render; no IO entry fires
    // because visibility never changed. The next timeline scan re-observes
    // and must restore the last known state.
    el.removeAttribute(IN_VIEW_ATTR);
    observer.observe(el);
    expect(isInView(el)).toBe(true);

    // And an off-screen element stays unmarked when re-observed.
    const offscreen = document.createElement('article');
    observer.observe(offscreen);
    observer.observe(offscreen);
    expect(isInView(offscreen)).toBe(false);

    observer.disconnect();
  });
});

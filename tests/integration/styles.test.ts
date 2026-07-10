import { afterEach, describe, expect, it } from 'vitest';
import {
  buildStylesheet,
  injectStyles,
  STYLE_ELEMENT_ID,
} from '../../entrypoints/content/renderer/styles';

afterEach(() => {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
});

describe('buildStylesheet', () => {
  const css = buildStylesheet();

  it('keys all visuals off the adsdim data attributes', () => {
    expect(css).toContain('html[data-adsdim-scheme="glass"]');
    expect(css).toContain('html[data-adsdim-scheme="glow"]');
    expect(css).toContain('html[data-adsdim-scheme="theater"]');
    expect(css).toContain('html[data-adsdim-contrast="strong"]');
    expect(css).toContain('html[data-adsdim-theme="light"]');
    expect(css).toContain('article[data-adsdim-tier="organic"]');
    expect(css).toContain('article[data-adsdim-tier="potential"]');
  });

  it('keeps the exact glass frosted-card values from the design mockup', () => {
    expect(css).toContain('backdrop-filter: blur(8px) saturate(1.2)');
    expect(css).toContain('inset: 4px 8px');
    expect(css).toContain(
      'rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02) 45%, rgba(255, 255, 255, 0.05)',
    );
  });

  it('keeps the exact strong-contrast dimming values from the mockup', () => {
    expect(css).toContain('filter: saturate(0.15) brightness(0.5)'); // glass strong hard
    expect(css).toContain('filter: grayscale(1) brightness(0.55) blur(1.2px)'); // theater strong hard
    expect(css).toContain('box-shadow: -10px 0 22px -6px rgba(29, 155, 240, 0.5)'); // glow strong
  });

  it('caps the pill line box so injecting it never shifts layout', () => {
    // Regression: without line-height: 1 + padding-cancelling negative
    // vertical margins, the pill inflates X's 20px name row (~6px per tweet).
    const pillBlock = css.match(/\n\.adsdim-pill \{[^}]*\}/)?.[0];
    expect(pillBlock).toBeDefined();
    expect(pillBlock).toContain('line-height: 1;');
    expect(pillBlock).toContain('margin: -2px 0 -2px 6px;');

    const strongPillBlock = css.match(
      /html\[data-adsdim-contrast="strong"\] \.adsdim-pill \{[^}]*\}/,
    )?.[0];
    expect(strongPillBlock).toBeDefined();
    expect(strongPillBlock).toContain('margin: -3px 0 -3px 6px;');
  });

  it('splits the glass card into a sheen ::before and a blur-only ::after', () => {
    // The blur must live alone on ::after so the scroll gate can hide it
    // without touching the sheen (the visible "glass" during scrolling).
    expect(css).toMatch(
      /article\[data-adsdim-tier="organic"\]::after \{[^}]*backdrop-filter: blur\(8px\) saturate\(1\.2\)/,
    );
    const sheenBlock = css.match(
      /html\[data-adsdim-scheme="glass"\] article\[data-adsdim-tier="organic"\]::before \{[^}]*\}/,
    )?.[0];
    expect(sheenBlock).toBeDefined();
    expect(sheenBlock).not.toContain('backdrop-filter');
  });

  it('strengthens the organic glass on hover: sheen x1.3, ring x1.5, 120ms', () => {
    // Hovering a genuine post must ENHANCE the glass, never remove it.
    expect(css).toMatch(/article\[data-adsdim-tier="organic"\]\.adsdim-in:hover::before/);
    // Sheen gradients x1.3 — dark normal / dark strong / light normal /
    // light strong (clamped at alpha 1).
    expect(css).toContain(
      'rgba(255, 255, 255, 0.091), rgba(255, 255, 255, 0.026) 45%, rgba(255, 255, 255, 0.065)',
    );
    expect(css).toContain(
      'rgba(255, 255, 255, 0.143), rgba(255, 255, 255, 0.039) 45%, rgba(255, 255, 255, 0.104)',
    );
    expect(css).toContain('rgba(255, 255, 255, 0.845), rgba(255, 255, 255, 0.455)');
    expect(css).toContain('rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.728)');
    // Border ring x1.5 — dark 0.14 -> 0.21, light 0.10 -> 0.15.
    expect(css).toContain('inset 0 0 0 1px rgba(255, 255, 255, 0.21)');
    expect(css).toContain('inset 0 0 0 1px rgba(15, 20, 25, 0.15)');
    // 120ms ease both ways, surviving the strong-contrast duration override.
    const enhanceTransitions = css.match(/background 120ms ease, box-shadow 120ms ease/g);
    expect(enhanceTransitions?.length).toBeGreaterThanOrEqual(2);
  });

  it('gates the glass blur during scrolling via opacity, never backdrop-filter', () => {
    // Toggling backdrop-filter via a rule change can leave Chrome's
    // compositor with a stale, unblurred backdrop (computed style lies).
    // Only the blur layer's composited opacity may carry the gate.
    const gateBlock = css.match(/html\.adsdim-scrolling[^{]*\{[^}]*\}/)?.[0];
    expect(gateBlock).toBeDefined();
    expect(gateBlock).toContain('::after');
    expect(gateBlock).toContain('opacity: 0 !important');
    expect(gateBlock).not.toContain('backdrop-filter');
    expect(css).not.toContain('backdrop-filter: none !important');
  });

  it('includes CSS-only hover reveal for dimmed ads', () => {
    expect(css).toMatch(/article\[data-adsdim-tier="hard"\]\.adsdim-in:is\(:hover/);
    expect(css).toContain('filter: none !important');
  });

  it('reveals dimmed ads for keyboard focus via the JS-managed class', () => {
    expect(css).toContain('.adsdim-kb-reveal');
  });

  it('never keys the reveal on any focus pseudo-class', () => {
    // X programmatically re-focuses timeline tweets after clicks and during
    // scrolling, and Chromium applies :focus-visible to programmatic focus
    // whenever the session had no mousedown yet or the last input was a key.
    // Mouse movement never blurs the tweet, so ANY focus pseudo-class reveal
    // (:focus, :focus-within, :focus-visible, :has(:focus-visible)) latches
    // indefinitely. Keyboard reveal lives in renderer/keyboard-reveal.ts.
    expect(css).not.toContain(':focus');
  });

  it('orders strong-contrast overrides after the normal scheme rules', () => {
    const normalGlassHard = css.indexOf(
      'article[data-adsdim-tier="hard"].adsdim-in {\n  filter: saturate(0.35)',
    );
    const strongGlassHard = css.indexOf('filter: saturate(0.15) brightness(0.5)');
    expect(normalGlassHard).toBeGreaterThan(-1);
    expect(strongGlassHard).toBeGreaterThan(normalGlassHard);
  });
});

describe('injectStyles', () => {
  it('injects a single style element, idempotently', () => {
    const first = injectStyles(document);
    const second = injectStyles(document);
    expect(first).toBe(second);
    expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1);
    expect(first.textContent).toContain('adsdim-pill');
  });
});

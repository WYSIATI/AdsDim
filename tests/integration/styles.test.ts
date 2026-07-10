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

  it('includes scroll-idle backdrop-filter gating for the glass scheme', () => {
    expect(css).toContain('html.adsdim-scrolling');
    expect(css).toContain('backdrop-filter: none !important');
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

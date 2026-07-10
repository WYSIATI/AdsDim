import { expect, test } from '../fixtures';

/**
 * X's timeline is virtualized: scrolled-out tweets are unmounted and later
 * re-inserted as fresh nodes without AdsDim's attributes. The extension must
 * re-mark such nodes idempotently (exactly one pill, correct tier).
 */
test('remounted articles are re-marked with a single pill', async ({ page, timelineUrl }) => {
  await page.goto(timelineUrl());
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);

  const promoted = page.locator('article[data-fixture-id="promoted-en"]');
  await expect(promoted.locator('.adsdim-pill')).toHaveCount(1);

  await page.evaluate(() => {
    const original = document.querySelector('article[data-fixture-id="promoted-en"]');
    if (!original || !original.parentElement) throw new Error('fixture missing');
    const parent = original.parentElement;
    const anchor = original.nextElementSibling;

    // Clone stripped of every AdsDim trace, exactly like a virtualizer
    // re-render from React state.
    const clone = original.cloneNode(true) as Element;
    for (const attribute of [...clone.attributes]) {
      if (attribute.name.startsWith('data-adsdim-')) clone.removeAttribute(attribute.name);
    }
    for (const pill of clone.querySelectorAll('.adsdim-pill')) pill.remove();

    original.remove();
    // Re-insert on a later tick so unmount and remount are distinct mutations.
    setTimeout(() => parent.insertBefore(clone, anchor), 50);
  });

  await expect(promoted).toHaveAttribute('data-adsdim-tier', 'hard');
  await expect(promoted.locator('.adsdim-pill')).toHaveCount(1);
  await expect(promoted.locator('.adsdim-pill')).toHaveText('Ad');

  // The full timeline is intact and fully re-marked.
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
});

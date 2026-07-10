import type { Page } from '@playwright/test';

export interface ClipBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Screenshot of a viewport-coordinate clip, as base64 PNG. */
export async function shoot(page: Page, clip: ClipBox): Promise<string> {
  const buffer = await page.screenshot({ clip });
  return buffer.toString('base64');
}

/**
 * Fraction of pixels whose largest RGB channel delta exceeds `threshold`.
 * Decoded and compared inside the page via canvas, so no image library is
 * needed on the Node side. Computed style can claim a backdrop-filter is
 * active while the compositor never repainted it — pixels cannot lie.
 */
export function diffRatio(
  page: Page,
  base64A: string,
  base64B: string,
  threshold: number,
): Promise<number> {
  return page.evaluate(
    async ({ a, b, limit }) => {
      const load = (base64: string): Promise<HTMLImageElement> =>
        new Promise((resolveImage, rejectImage) => {
          const image = new Image();
          image.onload = () => resolveImage(image);
          image.onerror = () => rejectImage(new Error('failed to decode screenshot'));
          image.src = `data:image/png;base64,${base64}`;
        });

      const [imageA, imageB] = await Promise.all([load(a), load(b)]);
      const width = Math.min(imageA.width, imageB.width);
      const height = Math.min(imageA.height, imageB.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('2d canvas context unavailable');

      context.drawImage(imageA, 0, 0);
      const pixelsA = context.getImageData(0, 0, width, height).data;
      context.clearRect(0, 0, width, height);
      context.drawImage(imageB, 0, 0);
      const pixelsB = context.getImageData(0, 0, width, height).data;

      let differing = 0;
      const total = width * height;
      for (let index = 0; index < total; index += 1) {
        const offset = index * 4;
        const delta = Math.max(
          Math.abs((pixelsA[offset] ?? 0) - (pixelsB[offset] ?? 0)),
          Math.abs((pixelsA[offset + 1] ?? 0) - (pixelsB[offset + 1] ?? 0)),
          Math.abs((pixelsA[offset + 2] ?? 0) - (pixelsB[offset + 2] ?? 0)),
        );
        if (delta > limit) differing += 1;
      }
      return differing / total;
    },
    { a: base64A, b: base64B, limit: threshold },
  );
}

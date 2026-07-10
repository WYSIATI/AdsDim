import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectTheme, watchTheme } from '../../entrypoints/content/renderer/theme';

const setBodyBackground = (color: string): void => {
  document.body.style.backgroundColor = color;
};

afterEach(() => {
  document.body.style.backgroundColor = '';
});

describe('detectTheme', () => {
  it.each([
    ['rgb(0, 0, 0)', 'dark'], // lights-out
    ['rgb(21, 32, 43)', 'dark'], // dim
    ['rgb(255, 255, 255)', 'light'],
    ['rgb(247, 249, 250)', 'light'],
  ] as const)('background %s -> %s', (color, expected) => {
    setBodyBackground(color);
    expect(detectTheme(document)).toBe(expected);
  });

  it('defaults to light for transparent/unset backgrounds', () => {
    setBodyBackground('');
    expect(detectTheme(document)).toBe('light');
  });

  it('treats explicit zero-alpha as light', () => {
    setBodyBackground('rgba(0, 0, 0, 0)');
    expect(detectTheme(document)).toBe('light');
  });
});

describe('watchTheme', () => {
  it('reports theme changes when the body style mutates', async () => {
    const onChange = vi.fn();
    const stop = watchTheme(document, onChange);

    setBodyBackground('rgb(0, 0, 0)');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith('dark'));

    stop();
    onChange.mockClear();
    setBodyBackground('rgb(255, 255, 255)');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onChange).not.toHaveBeenCalled();
  });
});

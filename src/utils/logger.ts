/**
 * Dev-gated logger. `debug` is compiled out of release behaviour:
 * it only prints when the extension runs in dev mode (`wxt dev`) or tests.
 */
const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

const PREFIX = '[adsdim]';

export const logger = {
  debug(...args: readonly unknown[]): void {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.debug(PREFIX, ...args);
    }
  },
  warn(...args: readonly unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: readonly unknown[]): void {
    console.error(PREFIX, ...args);
  },
} as const;

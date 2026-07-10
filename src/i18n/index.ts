import type { Messages } from './en';
import { en } from './en';
import { zh } from './zh';

export type { Messages };

/** Locales with a message bundle. Add new locales here and in `src/i18n/`. */
export const SUPPORTED_LOCALES = ['en', 'zh'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const BUNDLES: Record<Locale, Messages> = { en, zh };

function isSupportedLocale(value: string | undefined): value is Locale {
  return value !== undefined && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the message bundle for an explicit locale setting (`settings.locale`).
 * Unknown or missing values fall back to English — never auto-detected.
 */
export function getMessages(locale: string | undefined): Messages {
  return isSupportedLocale(locale) ? BUNDLES[locale] : en;
}

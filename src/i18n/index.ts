import type { Messages } from './en';
import { en } from './en';
import { zh } from './zh';

export type { Messages };

/** Picks the message bundle for a BCP 47 locale; falls back to English. */
export function getMessages(locale: string | undefined): Messages {
  if (locale && locale.toLowerCase().startsWith('zh')) return zh;
  return en;
}

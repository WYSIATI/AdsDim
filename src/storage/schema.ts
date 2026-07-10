import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../i18n';

/**
 * Settings schema. Defaults define the out-of-the-box experience:
 * enabled, English UI, glass scheme, strong contrast, all tiers marked.
 */
export const settingsSchema = z.object({
  enabled: z.boolean().default(true),
  /** UI language. An explicit user choice — never auto-detected. */
  locale: z.enum(SUPPORTED_LOCALES).default('en'),
  scheme: z.enum(['glass', 'glow', 'theater']).default('glass'),
  contrast: z.enum(['normal', 'strong']).default('strong'),
  tiers: z
    .object({
      hard: z.boolean().default(true),
      soft: z.boolean().default(true),
      potential: z.boolean().default(true),
    })
    .default({}),
  /** 0 = lenient, 1 = aggressive. Shifts heuristic tier thresholds. */
  sensitivity: z.number().min(0).max(1).default(0.5),
  /** Extra user keywords treated as strong ad signals. */
  keywords: z.array(z.string()).default([]),
  /** Author handles never marked, with or without leading @. */
  whitelist: z.array(z.string()).default([]),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({});

export const SETTINGS_STORAGE_KEY = 'adsdim:settings';

/**
 * Parses unknown data into valid settings, falling back to defaults on
 * malformed input so a corrupt storage entry can never break the extension.
 */
export function parseSettings(input: unknown): Settings {
  const result = settingsSchema.safeParse(input ?? {});
  return result.success ? result.data : DEFAULT_SETTINGS;
}

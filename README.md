# AdsDim

**Dim the ads, let real posts shine — never hides a post.**

English | [简体中文](./README.zh-CN.md)

AdsDim is an open-source MV3 Chrome extension that **marks** ads on the x.com timeline — hard ads, soft ads, and possible ads — while **never hiding or deleting a single post**. Your feed stays complete; genuine posts just shine brighter while ads quiet down.

## Features

- 🏷️ **Mark, never hide** — every post stays; ads get an `Ad / Sponsored / Possible` pill and recede visually.
- 🔍 **Local detection** — X's promoted badge (localized across 12 languages) plus soft-ad heuristics: `#ad`-style hashtags, discount codes, affiliate links, contact-to-buy patterns.
- 🎨 **Three visual schemes × two contrast levels** — default **Glass + Strong**:
  - **Glass Focus** — genuine posts float as frosted-glass cards while ads recede, desaturated.
  - **Glow Lane** — genuine posts earn a gradient ring and left glow; ads fade toward gray.
  - **Theater** — ads dim like house lights going down; genuine posts stay at full brightness.
- 🖱️ **Hover to reveal** — hovering any dimmed ad restores full visibility (CSS only).
- 🌍 **Multilingual** — UI localized (English by default, switchable in settings; more welcome), and ad-label detection works regardless of your X display language.
- 🌗 **Auto dark/light theme**, zero layout shift, safe with X's virtualized timeline.

## Privacy

**Zero network calls by default.** All detection runs locally in your browser; nothing is collected, uploaded, or tracked. Settings live only in the browser's extension sync storage.

## Development

```bash
npm install
npm run dev        # launch with WXT (Chrome)
npm run build      # production build
npm test           # unit + integration tests (Vitest)
npm run lint       # ESLint
npm run compile    # TypeScript typecheck
```

Design mockups live in `design/` (`preview-v2-inverted.html` is the CSS source of truth for the renderer).

### Contributing a translation

UI strings live in `src/i18n/` (one file per locale, ~20 strings). Add a locale file, register it in `src/i18n/index.ts`, and open a PR. Code comments and commit messages are in English.

## License

[Apache-2.0](./LICENSE) © 2026 WYSIATI

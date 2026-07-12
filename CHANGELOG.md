# Changelog

All notable changes to AdsDim are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-07-12

First public release, submitted to the Chrome Web Store.

### Added

- Mark ads on the x.com / twitter.com timeline without ever hiding, deleting,
  or reordering a post.
- Hard-ad detection: recognizes X's own promoted/ad badge across 12 display
  languages, matched structurally (never from tweet body text).
- Heuristic soft-ad detection with a corroboration gate — a post is only
  marked on a disclosure-format token or two independent signal categories.
  Signals: promotional keywords, affiliate/storefront/referral URLs, discount
  and invite codes, contact-to-buy patterns, giveaway and crypto mechanics,
  spam-shape structure, and cross-post repetition (shill networks).
- Every "Possible" mark carries a why-tooltip naming the signal that fired.
- Three visual schemes (Glass Focus, Glow Lane, Theater) × two contrast
  levels (Normal, Strong), default Glass + Strong, following X's dark/light
  theme automatically. All treatments are zero-layout-shift and safe with X's
  virtualized timeline.
- Hover any dimmed ad to restore it; glass posts strengthen on hover.
- Popup settings: master toggle, per-tier toggles, scheme, contrast, and UI
  language (English default, switchable to 简体中文).
- Fully local: zero network calls, no data collection or telemetry.

[0.1.0]: https://github.com/WYSIATI/AdsDim/releases/tag/v0.1.0

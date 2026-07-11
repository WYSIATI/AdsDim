# AdsDim Privacy Policy

_Last updated: 2026-07-11_

AdsDim is a browser extension that visually marks advertising posts on the
x.com / twitter.com timeline. It is designed so that no data ever needs to
leave your browser.

## Data collection: none

- AdsDim does **not** collect, store, transmit, sell, or share any personal
  data, browsing history, or page content.
- AdsDim contains **no analytics, telemetry, crash reporting, or tracking**
  code of any kind.

## Network access: none

- AdsDim makes **zero network calls**. It has no backend, no remote
  configuration, and loads no remote code or resources.
- All ad detection (X's promoted badge plus local heuristics) runs entirely
  inside your browser, on the page you are already viewing.

## Local processing

- The content script reads the timeline DOM on x.com / twitter.com solely to
  decide which posts to mark and how to style them. Nothing it reads is
  persisted or transmitted anywhere.

## Settings storage

- Your appearance preferences (visual scheme, contrast level, language) are
  saved with the browser's extension sync storage (`chrome.storage.sync`),
  which may sync them between your own browsers via your Google account.
- These preferences are the only data AdsDim stores, and you can remove them
  at any time by uninstalling the extension.

## Permissions

- `storage` — save the settings described above.
- Host access to `x.com` / `twitter.com` — the only pages the extension runs
  on; required to mark ads in the timeline.

## Changes

Any change to this policy will be published in this repository alongside a
version bump of the extension.

## Contact

Questions or concerns: open an issue on this repository.

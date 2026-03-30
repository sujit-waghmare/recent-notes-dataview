# Changelog

All notable changes to **Recent Notes for Dataview** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] — 2025

### Added
- 🚫 **Folder Exclusion** — block entire folders from being tracked via Settings UI
- Autocomplete on folder input (pulls from actual vault folder list)
- "Clear all excluded folders" bulk action button
- Double-layer exclusion check: at track time AND at query time, so adding a folder retroactively hides already-tracked notes instantly
- Subfolders are excluded automatically (recursive path matching)

### Changed
- Settings page redesigned with cleaner section separation and hover states on Remove buttons

---

## [1.0.0] — 2025

### Added
- 🎉 Initial release
- Tracks recently opened `.md` files automatically on `file-open` event
- Configurable count via slider (5–10 notes)
- `getRecentFiles()` public API for DataviewJS integration
- Ready-to-use DataviewJS snippet with Copy button in Settings
- Persistent storage across Obsidian restarts
- Notice if Dataview plugin is not installed
- Mobile compatible (`isDesktopOnly: false`)

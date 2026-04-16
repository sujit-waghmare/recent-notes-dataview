# Changelog

All notable changes to **Recent Notes for Dataview** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.2.0] — 2026-04-15

### Added
- 🔤 **Title Exclusion** — hide notes by filename using text-based rules via Settings UI
- **Contains mode** — hides any note whose filename contains the typed text (case-insensitive)
- **Exact Match mode** — toggle to hide only notes whose full filename equals the typed text exactly
- Visual badge on each title filter entry showing its mode: `[contains]` or `[exact]`
- `fromFolder` option in `getRecentFiles()` — scope DataviewJS queries to a specific folder path
- Second DataviewJS snippet in Settings demonstrating `fromFolder` usage, with its own Copy button
- Shared internal UI helper functions to reduce settings tab code duplication

### Changed
- Settings page now has four clearly separated sections with consistent visual hierarchy
- Both DataviewJS snippets displayed together at the bottom of Settings for easy access

### Fixed
- Title and folder exclusions are now re-checked at query time in addition to track time — rules added after a note was already tracked are respected immediately without requiring the file to be reopened

---

## [1.1.0] — 2026-03-30

### Added
- 🚫 **Folder Exclusion** — block entire folders from being tracked via Settings UI
- Autocomplete on folder input (pulls from actual vault folder list)
- "Clear all excluded folders" bulk action button
- Double-layer exclusion check: at track time AND at query time, so adding a folder retroactively hides already-tracked notes instantly
- Subfolders are excluded automatically (recursive path matching)

### Changed
- Settings page redesigned with cleaner section separation and hover states on Remove buttons

---

## [1.0.0] — 2026-03-15

### Added
- 🎉 Initial release
- Tracks recently opened `.md` files automatically on `file-open` event
- Configurable count via slider (5–10 notes)
- `getRecentFiles()` public API for DataviewJS integration
- Ready-to-use DataviewJS snippet with Copy button in Settings
- Persistent storage across Obsidian restarts
- Notice if Dataview plugin is not installed
- Mobile compatible (`isDesktopOnly: false`)

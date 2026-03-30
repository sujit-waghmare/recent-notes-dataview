# 🕐 Recent Notes for Dataview

> An [Obsidian](https://obsidian.md) plugin that tracks your recently opened notes and lets you display them anywhere using [Dataview](https://github.com/blacksmithgu/obsidian-dataview) queries.

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=7c3aed&label=downloads&query=downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![Version](https://img.shields.io/github/v/release/bigelephant67/recent-notes-dataview)
![License](https://img.shields.io/github/license/bigelephant67/recent-notes-dataview)

---

## ✨ Features

- 📋 **Tracks recently opened notes** automatically in the background
- 🔢 **Configurable count** — choose to show 5, 6, 7, 8, 9, or 10 recent notes
- 🚫 **Folder exclusions** — block entire folders (and their subfolders) from being tracked
- ⚡ **DataviewJS integration** — expose your recent notes to any Dataview query
- 💾 **Persistent** — recent notes survive Obsidian restarts
- 📱 **Mobile compatible** — works on Obsidian mobile too

---

## 📋 Requirements

- [Obsidian](https://obsidian.md) v0.15.0 or higher
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) community plugin (for query display)

---

## 🚀 Installation

### From Community Plugins (Recommended)

1. Open Obsidian → **Settings → Community Plugins**
2. Disable Restricted Mode if prompted
3. Click **Browse** and search for **"Recent Notes for Dataview"**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/bigelephant67/recent-notes-dataview/releases/latest)
2. Create the folder `.obsidian/plugins/recent-notes-dataview/` in your vault
3. Place both files inside it
4. Go to **Settings → Community Plugins** → hit **Refresh** → enable the plugin

---

## 🧩 Usage

### Step 1 — Let the plugin track notes

Just open notes normally. Every `.md` file you open is silently added to your recent list (unless it's inside an excluded folder).

### Step 2 — Paste the DataviewJS snippet

In any note (e.g. your Dashboard), create a `dataviewjs` block:

~~~dataviewjs
// ── Recent Notes (powered by Recent Notes for Dataview) ──
const rn = app.plugins.plugins["recent-notes-dataview"];
if (!rn) { dv.paragraph('⚠ Plugin not enabled.'); }
else {
  const files = rn.getRecentFiles();
  if (files.length === 0) {
    dv.paragraph("No recent notes yet — open a few notes first!");
  } else {
    dv.table(["Note", "Modified", "Folder"],
      files.map(f => [
        dv.fileLink(f.path),
        new Date(f.stat.mtime).toLocaleString(),
        f.parent?.path || "/"
      ])
    );
  }
}
~~~

This renders a live table with clickable note links, last-modified timestamps, and folder paths.

> 💡 You can also copy this snippet directly from the plugin's Settings page.

---

## ⚙️ Settings

Navigate to **Settings → Recent Notes for Dataview**

| Setting | Description | Default |
|---|---|---|
| Number of recent notes | How many notes to show (slider 5–10) | 5 |
| Excluded Folders | Folders whose notes are never tracked | *(none)* |

### Excluded Folders

- Type a path like `Private` or `Work/Drafts` and click **＋ Add Folder**
- Folder input **autocompletes** from your vault
- Subfolders are excluded automatically — adding `Private` blocks `Private/Journal/`, `Private/Archive/`, etc.
- Notes already tracked inside a newly excluded folder **disappear immediately** from Dataview output — no restart required
- Paths are case-sensitive on Mac/Linux

---

## 🖼 Screenshots

### Dataview Table

![Dataview Table](https://github.com/bigelephant67/recent-notes-dataview/blob/d5f277fa23a07f994364dc1cf5bc4173f8bed6fe/assets/screenshots/recent-notes-preview.png.png)



### Settings Page

![Settings Page](https://github.com/bigelephant67/recent-notes-dataview/blob/d5f277fa23a07f994364dc1cf5bc4173f8bed6fe/assets/screenshots/recent-notes-settings.png.jpg)



---

## 🛠 Development

```bash
# Clone the repo
git clone https://github.com/bigelephant67/recent-notes-dataview
cd recent-notes-dataview

# Install dependencies
npm install

# Development mode (watches for changes)
npm run dev

# Production build
npm run build
```

Copy `main.js` and `manifest.json` into your vault's plugin folder to test.

---

## 🤝 Contributing

Pull requests and issues are welcome!

- 🐛 **Bug reports** → [Open an issue](https://github.com/bigelephant67/recent-notes-dataview/issues)
- 💡 **Feature requests** → [Start a discussion](https://github.com/bigelephant67/recent-notes-dataview/discussions)
- 💬 **Community chat** → [Discord](https://discord.gg/9b8rnKM9)

---

## 📄 License

MIT © [Fat Elephant aka Waghmare](https://github.com/bigelephant67)

---

## ☕ Support

If this plugin saves you time, consider starring ⭐ the repo — it helps others find it!

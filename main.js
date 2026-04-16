"use strict";

/* -------------------------------------------------------
   Recent Notes for Dataview  –  Obsidian Plugin  v1.2.0
   Drop this file + manifest.json into your vault's
   .obsidian/plugins/recent-notes-dataview/ folder.
------------------------------------------------------- */

var obsidian = require("obsidian");

// ── Default settings ──────────────────────────────────
const DEFAULT_SETTINGS = {
	maxRecentNotes: 5,
	recentFiles: [],
	excludedFolders: [],       // folder path strings
	excludedTitles: [],        // { text: string, exactMatch: boolean }[]
};

// ── Helpers ───────────────────────────────────────────

/** True if filePath is inside any excluded folder (recursive). */
function isFolderExcluded(filePath, excludedFolders) {
	if (!excludedFolders || excludedFolders.length === 0) return false;
	const norm = filePath.replace(/\\/g, "/");
	return excludedFolders.some((folder) => {
		if (!folder || folder.trim() === "") return false;
		const f = folder.replace(/\\/g, "/").replace(/\/+$/, "");
		return norm === f || norm.startsWith(f + "/");
	});
}

/**
 * True if the file's base name (without .md) matches any excluded title rule.
 * exactMatch=true  → full filename must equal the text (case-insensitive)
 * exactMatch=false → filename contains the text (case-insensitive)
 */
function isTitleExcluded(filePath, excludedTitles) {
	if (!excludedTitles || excludedTitles.length === 0) return false;
	const baseName = filePath
		.replace(/\\/g, "/")
		.split("/")
		.pop()
		.replace(/\.md$/i, "")
		.toLowerCase();

	return excludedTitles.some(({ text, exactMatch }) => {
		if (!text || text.trim() === "") return false;
		const t = text.trim().toLowerCase();
		return exactMatch ? baseName === t : baseName.includes(t);
	});
}

/** True if the file should be hidden based on all active exclusion rules. */
function isExcluded(filePath, excludedFolders, excludedTitles) {
	return (
		isFolderExcluded(filePath, excludedFolders) ||
		isTitleExcluded(filePath, excludedTitles)
	);
}

// ── Reusable UI: render a tag-style list row ──────────
function makeListRow(containerEl, iconText, labelText, onRemove) {
	const row = containerEl.createEl("div");
	row.style.cssText =
		"display:flex;align-items:center;justify-content:space-between;" +
		"padding:8px 12px;border-radius:6px;" +
		"background:var(--background-secondary);" +
		"border:1px solid var(--background-modifier-border);";

	const left = row.createEl("div");
	left.style.cssText = "display:flex;align-items:center;gap:8px;flex:1;min-width:0;";
	left.createEl("span", { text: iconText });
	const label = left.createEl("span", { text: labelText });
	label.style.cssText =
		"font-size:13px;font-family:var(--font-monospace);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

	const removeBtn = row.createEl("button", { text: "Remove" });
	removeBtn.style.cssText =
		"padding:3px 10px;border-radius:5px;cursor:pointer;font-size:12px;flex-shrink:0;" +
		"background:transparent;color:var(--text-error);" +
		"border:1px solid var(--background-modifier-error-hover);";
	removeBtn.addEventListener("mouseenter", () => {
		removeBtn.style.background = "var(--background-modifier-error)";
	});
	removeBtn.addEventListener("mouseleave", () => {
		removeBtn.style.background = "transparent";
	});
	removeBtn.addEventListener("click", onRemove);

	row.appendChild(left);
	row.appendChild(removeBtn);
	return row;
}

// ── Settings Tab ──────────────────────────────────────
class RecentNotesSettingTab extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		// ── Header ──────────────────────────────────────
		const header = containerEl.createEl("div");
		header.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:4px;";
		const icon = header.createEl("span", { text: "🕐" });
		icon.style.fontSize = "22px";
		header.createEl("h2", { text: "Recent Notes for Dataview" });

		containerEl.createEl("p", {
			text: "Tracks recently opened notes and exposes them to DataviewJS queries.",
			cls: "setting-item-description",
		});

		containerEl.createEl("hr");

		// ── Slider ──────────────────────────────────────
		new obsidian.Setting(containerEl)
			.setName("Number of recent notes to show")
			.setDesc("Choose between 5 and 10. Takes effect immediately.")
			.addSlider((slider) =>
				slider
					.setLimits(5, 10, 1)
					.setValue(this.plugin.settings.maxRecentNotes)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxRecentNotes = value;
						await this.plugin.saveSettings();
					})
			);

		// ════════════════════════════════════════════════
		// SECTION: Excluded Folders
		// ════════════════════════════════════════════════
		containerEl.createEl("hr");
		this._renderSectionHeader(containerEl, "🚫", "Excluded Folders");
		containerEl.createEl("p", {
			text: "Notes inside these folders will not be tracked or shown. Subfolders are excluded automatically.",
			cls: "setting-item-description",
		});

		// Add folder row
		const folderAddRow = this._makeAddRow(
			containerEl,
			"e.g.  Private  or  Work/Drafts",
			"rn-folder-list",
			"＋ Add Folder",
			async (val) => {
				val = val.replace(/\/+$/, "");
				if (this.plugin.settings.excludedFolders.includes(val)) {
					new obsidian.Notice(`"${val}" is already excluded.`);
					return false;
				}
				this.plugin.settings.excludedFolders.push(val);
				await this.plugin.saveSettings();
				return true;
			}
		);

		// Folder datalist autocomplete
		const folderDatalist = containerEl.createEl("datalist");
		folderDatalist.id = "rn-folder-list";
		this.plugin.app.vault
			.getAllLoadedFiles()
			.filter((f) => f.children !== undefined && f.path !== "/")
			.forEach((f) => {
				const opt = folderDatalist.createEl("option");
				opt.value = f.path;
			});

		// Folder list
		const folderList = containerEl.createEl("div");
		folderList.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-bottom:14px;";

		const excludedFolders = this.plugin.settings.excludedFolders;
		if (excludedFolders.length === 0) {
			this._renderEmptyState(folderList, "No folders excluded yet.");
		} else {
			excludedFolders.forEach((folder, idx) => {
				const row = makeListRow(folderList, "📁", folder, async () => {
					this.plugin.settings.excludedFolders.splice(idx, 1);
					await this.plugin.saveSettings();
					this.display();
				});
				folderList.appendChild(row);
			});
		}

		if (excludedFolders.length > 1) {
			this._renderClearAllBtn(containerEl, async () => {
				this.plugin.settings.excludedFolders = [];
				await this.plugin.saveSettings();
				this.display();
			}, "Clear all excluded folders");
		}

		// ════════════════════════════════════════════════
		// SECTION: Excluded Titles
		// ════════════════════════════════════════════════
		containerEl.createEl("hr");
		this._renderSectionHeader(containerEl, "🔤", "Excluded Titles");
		containerEl.createEl("p", {
			text: "Hide notes whose filename contains (or exactly matches) the text you specify.",
			cls: "setting-item-description",
		});

		// ── Add title row ────────────────────────────────
		const titleAddWrapper = containerEl.createEl("div");
		titleAddWrapper.style.cssText = "margin:10px 0 14px;";

		const titleInputRow = titleAddWrapper.createEl("div");
		titleInputRow.style.cssText = "display:flex;gap:8px;align-items:center;margin-bottom:8px;";

		const titleInput = titleInputRow.createEl("input", { type: "text" });
		titleInput.placeholder = "e.g. Untitled or Meeting Notes";
		titleInput.style.cssText =
			"flex:1;padding:6px 10px;border-radius:6px;" +
			"border:1px solid var(--background-modifier-border);" +
			"background:var(--background-primary);color:var(--text-normal);font-size:13px;";

		// Exact match toggle
		const exactRow = titleAddWrapper.createEl("div");
		exactRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;";

		let exactMatchEnabled = false;

		const exactToggle = exactRow.createEl("div");
		exactToggle.style.cssText =
			"width:36px;height:20px;border-radius:10px;background:var(--background-modifier-border);" +
			"position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0;";

		const exactKnob = exactToggle.createEl("div");
		exactKnob.style.cssText =
			"width:16px;height:16px;border-radius:50%;background:#fff;" +
			"position:absolute;top:2px;left:2px;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);";

		const exactLabel = exactRow.createEl("span");
		exactLabel.style.cssText = "font-size:13px;color:var(--text-muted);";
		exactLabel.textContent = "Exact match: OFF — hides notes whose title contains this text";

		const updateToggleUI = () => {
			if (exactMatchEnabled) {
				exactToggle.style.background = "var(--interactive-accent)";
				exactKnob.style.left = "18px";
				exactLabel.textContent = "Exact match: ON — only hides notes whose full title equals this text";
				exactLabel.style.color = "var(--text-normal)";
			} else {
				exactToggle.style.background = "var(--background-modifier-border)";
				exactKnob.style.left = "2px";
				exactLabel.textContent = "Exact match: OFF — hides notes whose title contains this text";
				exactLabel.style.color = "var(--text-muted)";
			}
		};

		exactToggle.addEventListener("click", () => {
			exactMatchEnabled = !exactMatchEnabled;
			updateToggleUI();
		});
		exactRow.appendChild(exactToggle);
		exactRow.appendChild(exactLabel);

		const titleAddBtn = titleInputRow.createEl("button", { text: "＋ Add Filter" });
		titleAddBtn.style.cssText =
			"padding:6px 14px;border-radius:6px;cursor:pointer;" +
			"background:var(--interactive-accent);color:var(--text-on-accent);" +
			"border:none;font-size:13px;white-space:nowrap;";

		const doAddTitle = async () => {
			const val = titleInput.value.trim();
			if (!val) return;
			const duplicate = this.plugin.settings.excludedTitles.some(
				(t) => t.text.toLowerCase() === val.toLowerCase() && t.exactMatch === exactMatchEnabled
			);
			if (duplicate) {
				new obsidian.Notice(`"${val}" (${exactMatchEnabled ? "exact" : "contains"}) is already in the list.`);
				return;
			}
			this.plugin.settings.excludedTitles.push({ text: val, exactMatch: exactMatchEnabled });
			await this.plugin.saveSettings();
			titleInput.value = "";
			exactMatchEnabled = false;
			updateToggleUI();
			this.display();
		};

		titleAddBtn.addEventListener("click", doAddTitle);
		titleInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doAddTitle(); });

		titleInputRow.appendChild(titleInput);
		titleInputRow.appendChild(titleAddBtn);
		titleAddWrapper.appendChild(titleInputRow);
		titleAddWrapper.appendChild(exactRow);
		containerEl.appendChild(titleAddWrapper);

		// Title exclusion list
		const titleList = containerEl.createEl("div");
		titleList.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-bottom:14px;";

		const excludedTitles = this.plugin.settings.excludedTitles;
		if (excludedTitles.length === 0) {
			this._renderEmptyState(titleList, "No title filters added yet.");
		} else {
			excludedTitles.forEach((entry, idx) => {
				const badge = entry.exactMatch ? " [exact]" : " [contains]";
				const row = makeListRow(titleList, "🔤", entry.text + badge, async () => {
					this.plugin.settings.excludedTitles.splice(idx, 1);
					await this.plugin.saveSettings();
					this.display();
				});
				titleList.appendChild(row);
			});
		}

		if (excludedTitles.length > 1) {
			this._renderClearAllBtn(containerEl, async () => {
				this.plugin.settings.excludedTitles = [];
				await this.plugin.saveSettings();
				this.display();
			}, "Clear all title filters");
		}

		// ════════════════════════════════════════════════
		// SECTION: DataviewJS snippets
		// ════════════════════════════════════════════════
		containerEl.createEl("hr");
		containerEl.createEl("h3", { text: "DataviewJS snippets" });

		// Basic snippet
		containerEl.createEl("p", {
			text: "Basic — show recent notes (respects all exclusion settings):",
			cls: "setting-item-description",
		});
		this._renderSnippet(containerEl, [
			'const rn = app.plugins.plugins["recent-notes-dataview"];',
			"if (!rn) { dv.paragraph('⚠ Plugin not enabled.'); }",
			"else {",
			"  const files = rn.getRecentFiles();",
			"  if (files.length === 0) {",
			'    dv.paragraph("No recent notes yet.");',
			"  } else {",
			'    dv.table(["Note", "Modified", "Folder"],',
			"      files.map(f => [",
			"        dv.fileLink(f.path),",
			"        new Date(f.stat.mtime).toLocaleString(),",
			'        f.parent?.path || "/"',
			"      ])",
			"    );",
			"  }",
			"}",
		]);

		// Path-filtered snippet
		containerEl.createEl("p", {
			text: 'With folder filter — show recent notes only from a specific folder (e.g. "Templates"):',
			cls: "setting-item-description",
		});
		this._renderSnippet(containerEl, [
			'const rn = app.plugins.plugins["recent-notes-dataview"];',
			"if (!rn) { dv.paragraph('⚠ Plugin not enabled.'); }",
			"else {",
			'  // Change "Templates" to any folder path you want',
			'  const files = rn.getRecentFiles({ fromFolder: "Templates" });',
			"  if (files.length === 0) {",
			'    dv.paragraph("No recent notes in this folder.");',
			"  } else {",
			'    dv.table(["Note", "Modified"],',
			"      files.map(f => [",
			"        dv.fileLink(f.path),",
			"        new Date(f.stat.mtime).toLocaleString()",
			"      ])",
			"    );",
			"  }",
			"}",
		]);

		// ── Warning ──────────────────────────────────────
		const warn = containerEl.createEl("div");
		warn.style.cssText =
			"background:var(--background-modifier-error-rgb,255 80 80 / 0.08);" +
			"border-left:3px solid var(--color-orange,#f59e0b);" +
			"border-radius:4px;padding:8px 12px;font-size:13px;margin-top:12px;";
		warn.createEl("strong", { text: "Requires: " });
		warn.appendText("The Dataview community plugin must be installed and enabled.");
	}

	// ── Private UI helpers ────────────────────────────

	_renderSectionHeader(containerEl, iconText, titleText) {
		const h = containerEl.createEl("div");
		h.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:4px;";
		const ic = h.createEl("span", { text: iconText });
		ic.style.fontSize = "18px";
		const t = h.createEl("h3", { text: titleText });
		t.style.margin = "0";
	}

	_renderEmptyState(containerEl, text) {
		const el = containerEl.createEl("div");
		el.style.cssText =
			"padding:10px 14px;border-radius:6px;font-size:13px;" +
			"color:var(--text-muted);background:var(--background-secondary);" +
			"border:1px dashed var(--background-modifier-border);";
		el.textContent = text;
	}

	_renderClearAllBtn(containerEl, onClick, label) {
		const btn = containerEl.createEl("button", { text: label });
		btn.style.cssText =
			"padding:4px 12px;border-radius:5px;cursor:pointer;font-size:12px;" +
			"margin-bottom:16px;background:transparent;" +
			"border:1px solid var(--background-modifier-border);color:var(--text-muted);";
		btn.addEventListener("click", onClick);
	}

	_makeAddRow(containerEl, placeholder, datalistId, btnLabel, onAdd) {
		const row = containerEl.createEl("div");
		row.style.cssText = "display:flex;gap:8px;align-items:center;margin:10px 0 14px;";

		const input = row.createEl("input", { type: "text" });
		input.placeholder = placeholder;
		input.setAttribute("list", datalistId);
		input.style.cssText =
			"flex:1;padding:6px 10px;border-radius:6px;" +
			"border:1px solid var(--background-modifier-border);" +
			"background:var(--background-primary);color:var(--text-normal);font-size:13px;";

		const btn = row.createEl("button", { text: btnLabel });
		btn.style.cssText =
			"padding:6px 14px;border-radius:6px;cursor:pointer;" +
			"background:var(--interactive-accent);color:var(--text-on-accent);" +
			"border:none;font-size:13px;white-space:nowrap;";

		const doAdd = async () => {
			const val = input.value.trim();
			if (!val) return;
			const success = await onAdd(val);
			if (success !== false) { input.value = ""; this.display(); }
		};

		btn.addEventListener("click", doAdd);
		input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

		row.appendChild(input);
		row.appendChild(btn);
		containerEl.appendChild(row);
		return { input, btn };
	}

	_renderSnippet(containerEl, lines) {
		const box = containerEl.createEl("div");
		box.style.cssText =
			"background:var(--background-secondary);border:1px solid var(--background-modifier-border);" +
			"border-radius:8px;padding:14px 16px;margin:6px 0 16px;position:relative;";

		const code = lines.join("\n");
		const pre = box.createEl("pre");
		pre.style.cssText = "margin:0;font-size:12.5px;overflow-x:auto;white-space:pre;";
		pre.createEl("code", { text: code });

		const copyBtn = box.createEl("button", { text: "Copy" });
		copyBtn.style.cssText =
			"position:absolute;top:10px;right:10px;padding:3px 10px;" +
			"border-radius:5px;font-size:12px;cursor:pointer;";
		copyBtn.addEventListener("click", async () => {
			await navigator.clipboard.writeText("```dataviewjs\n" + code + "\n```");
			copyBtn.textContent = "Copied ✓";
			setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
		});
	}
}

// ── Main Plugin Class ─────────────────────────────────
class RecentNotesPlugin extends obsidian.Plugin {
	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (file && file.extension === "md") {
					this.trackRecentFile(file.path);
				}
			})
		);

		this.addSettingTab(new RecentNotesSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			const dv = this.app.plugins?.plugins?.["dataview"];
			if (!dv) {
				new obsidian.Notice(
					"Recent Notes for Dataview: Dataview plugin not found. Install it from Community Plugins.",
					8000
				);
			}
		});

		console.log("[RecentNotes] Plugin loaded ✓");
	}

	onunload() {
		console.log("[RecentNotes] Plugin unloaded");
	}

	/**
	 * Track file open — skip if excluded by folder OR title rule.
	 */
	trackRecentFile(path) {
		if (isExcluded(path, this.settings.excludedFolders, this.settings.excludedTitles)) return;

		let files = this.settings.recentFiles.filter((f) => f !== path);
		files.unshift(path);
		files = files.slice(0, 10);
		this.settings.recentFiles = files;
		this.saveSettings();
	}

	/**
	 * Public API for DataviewJS.
	 *
	 * @param {object} [opts]
	 * @param {string} [opts.fromFolder]  — if set, only return files inside this folder path
	 *
	 * Returns TFile[] respecting:
	 *   - maxRecentNotes count
	 *   - folder exclusions
	 *   - title exclusions (contains / exact match)
	 *   - optional fromFolder path filter
	 */
	getRecentFiles(opts) {
		const max = this.settings.maxRecentNotes;
		const fromFolder = opts && opts.fromFolder
			? opts.fromFolder.replace(/\\/g, "/").replace(/\/+$/, "")
			: null;

		const result = [];

		for (const path of this.settings.recentFiles) {
			if (result.length >= max) break;

			// Apply all exclusions
			if (isExcluded(path, this.settings.excludedFolders, this.settings.excludedTitles)) continue;

			// Apply fromFolder filter if specified
			if (fromFolder) {
				const norm = path.replace(/\\/g, "/");
				if (!(norm === fromFolder || norm.startsWith(fromFolder + "/"))) continue;
			}

			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof obsidian.TFile) {
				result.push(file);
			}
		}

		return result;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

module.exports = RecentNotesPlugin;

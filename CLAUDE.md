# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebScreen Admin is a pure web-based GUI for configuring WebScreen devices (ESP32-S3 with AMOLED display). It runs entirely in the browser with no backend server, using the Web Serial API for USB communication.

## Development

**No build system required.** This is vanilla HTML/CSS/JavaScript.

To run locally:
- Open `public/index.html` in Chrome, Edge, or Opera (89+)
- Web Serial API requires a secure context (HTTPS or localhost)

For local development with a server:
```bash
npx serve public
# or
python -m http.server -d public
```

## Architecture

```
public/
├── index.html    # Single-page app structure (4 sections: Dashboard, Marketplace, Files, Settings)
├── app.js        # WebScreenAdmin class - UI logic, state management, event handling
├── serial.js     # WebScreenSerial class - USB serial communication layer
├── styles.css    # Design system with gradient theme and EVA theme support
└── apps.json     # Marketplace app catalog
```

### Core Classes

**WebScreenSerial** (`serial.js`): Handles all device communication
- Serial protocol: 115200 baud, text-based commands
- Key methods: `connect()`, `sendCommand()`, `uploadFile()`, `connectWiFi()`, `getDeviceInfo()`, `setBrightness()`
- Uses callback pattern for parsing multi-line serial responses

**WebScreenAdmin** (`app.js`): Manages the entire UI
- State: `availableApps`, `installedApps`, `currentPath`, device info
- Event-driven architecture with `setupEventListeners()`
- Toast notification system for user feedback

### Communication Flow

1. User action triggers method in WebScreenAdmin
2. WebScreenAdmin calls appropriate method in WebScreenSerial
3. WebScreenSerial sends text command over USB
4. Device responds with text; parsed via registered callbacks
5. UI updates based on response

### Serial Command Vocabulary

All commands are slash-prefixed text sent over the serial line. Multi-line response commands rely on registered callbacks; streaming uploads terminate with a literal `END`.

- Device: `/info`, `/stats`, `/help`, `/reboot`, `/backup`, `/factory_reset confirm` (newer firmware; `WebScreenSerial.factoryReset()` falls back to `/rm /webscreen.json` + `/reboot` on `Unknown command`)
- Filesystem: `/ls <path> [json]` (json = one-line machine-readable listing, used as fast path with legacy text-parse fallback; plain listing ends with a `Total: N files, M directories` marker), `/cat <file>`, `/rm <file|empty-dir>`, `/mkdir <path>`, `/download <file>` (base64 stream between `=== DOWNLOAD ... SIZE n ===` / `=== DOWNLOAD END ===`, binary-safe), `/load <file> [save]` (`save` persists the script to webscreen.json)
- Write text file (legacy): `/write <name>` then stream lines, then `END`
- Upload (firmware 2.0.0+): `/upload <name>` (text) or `/upload <name> base64` (binary), stream chunks, then `END`; the firmware answers `[OK] File saved: ...` or `[ERROR] Upload failed: ...` — `uploadFile()` awaits that ACK (timeout = older firmware, treated as success)
- Config: `/config get <key>`, `/config set <key> <value>`
- Hardware: `/brightness <0-255>`, `/settime <epoch> [posix_tz]`
- JS runtime: `/eval <js>` (live REPL into the running app, max 255 chars, replies as `[EVAL] ...` lines), `/errors` (JS error report ending with a `Script:` line), `/gc`, `/screenshot` (base64 RGB565_SWAP stream between `=== SCREENSHOT WxH RGB565_SWAP ===` / `=== SCREENSHOT END ===`; decoded to canvas in `captureScreenshot()`)

**Firmware version branching:** `WebScreenSerial.uploadFile()` checks the device firmware version (parsed from `/info`). 2.0.0+ uses `/upload`; older firmware falls back to `/write` line-by-line streaming for `.js` files only. Binary files always use base64 chunked transfer.

## Key Implementation Details

- Apps are installed from GitHub URLs defined in `apps.json`; the catalog is fetched at startup (`loadAppsFromConfig`), with an embedded copy in `app.js` (`loadFallbackApps`) as the file:// fallback — **keep both in sync**
- File manager uses device filesystem (not browser storage); `.js` files get a Run button (in-place `/load`, no reboot), text files can be downloaded via `/cat` (binary download unsupported over serial)
- Dashboard has an App Health card fed by `/errors` (last JS error + line number, safe-mode state, restart counters) plus Run GC; it auto-refreshes on connect via `checkErrors(true)`
- The serial console has a JS REPL toggle (`replToggleBtn`): when active, non-slash input is wrapped as `/eval ...`
- All device- or catalog-sourced strings must go through `escapeHtml()` before `innerHTML` interpolation (it escapes quotes too, safe for attribute contexts)
- All settings are stored on the device, not browser-side; only the chosen theme persists in `localStorage` under `webscreen-admin-theme`
- Controls are disabled when device is disconnected
- Settings page renders sections dynamically from config JSON (General, Device, Time & Location, Advanced)
- WiFi fields are injected into the General section; brightness slider into the Device section
- Brightness changes are sent to the device in real-time via `/brightness` serial command
- Timezone selector is a `<select>` dropdown with 400+ IANA timezones grouped by region (Africa, America, Asia, etc.)
- `TIMEZONE_DATA` constant (top of `app.js`) maps IANA names to POSIX TZ strings (source: posix_tz_db)
- Dropdown displays IANA names (e.g. "America/Buenos_Aires"), stores POSIX TZ strings (e.g. "<-03>3") in config
- "Detect" button auto-selects the user's browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- "Sync Time to Device" sends `/settime epoch posix_tz_string` to the device via serial
- Three themes supported: Light (default), Dark, and EVA (green accent)

### Marketplace App Metadata

Catalog entries in `apps.json` (and the inline fallback list in `app.js`) carry optional fields beyond name/url:
- `requires_mqtt: true` — install dialog shows a config note pointing the user at Settings
- `install_config: { ... }` — flat key/value map of device config keys to seed on install (supports dotted keys like `settings.mqtt.enabled`); applied via `/config set` after the script is uploaded
- Settings UI normalises both top-level (`mqtt.*`) and nested (`settings.mqtt.*`) shapes, so when adding new config sections support both lookup paths.

## External Dependencies

CDN-loaded only:
- Google Fonts (Inter)
- Font Awesome 6.5.1

## Code Search

Use ken as the first attempt for codebase questions. Prefer ken MCP tools before
broad text search or reading many files:

- Start with `ken_rank` for the current task, or pass a query when the question
  needs a focused search.
- Use `ken_search_files` to find files by intent, feature, behavior, or concept.
- Use `ken_search_symbols` to find functions, classes, methods, APIs, and other
  named code objects.
- Use `ken_file_outline`, `ken_file_symbols`, and `ken_file_snippets` to inspect
  surfaced files precisely before opening larger chunks of code.
- Use `ken_file_neighbors`, `ken_module_graph`, and `ken_find_tests` to follow
  imports, related modules, and source/test pairs.
- Use `ken_changed_context` when working from an existing diff or local edits.
- Use `ken_project_overview` for a compact map of an unfamiliar project area.
- Use `ken_recall` and `ken_findings` for saved project knowledge, and
  `ken_remember` when a durable finding should help future sessions.
- Use `ken_explain_rank` when rankings look surprising or an expected file is
  missing.
- Use `ken_dismiss` when ken surfaces a file that is clearly not relevant, so
  future similar tasks get better results.

After ken narrows the search space, read the relevant files directly. Fall back
to `rg` when ken is insufficient, when an exact literal search is required, or
when verifying a specific string occurrence.

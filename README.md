# WebScreen Admin

A browser workspace for managing WebScreen devices: install apps, browse SD-card files, edit settings, and use the serial console.

## Run locally

This is a static site with no build step:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open <http://127.0.0.1:8765>. Chrome and Edge on desktop support USB connections through Web Serial. The deployed site must use HTTPS. You can browse the marketplace and preview settings without connecting a device.

Connect your WebScreen by USB, close Arduino Serial Monitor/Plotter and other programs using its port, then select **Connect Device**. Settings and file operations require an SD card. Configuration uploads require firmware with `/upload` support (2.0 or newer).

## LVGL demo apps

Search **Apps** for `LVGL` or `firmware 4.0` to find Arc Text, Chart Gallery, Gauge Dashboard, Typography, and Motion Lines. Each card and its details show **Requires firmware 4.0 (LVGL 9.5 compatible)**. Upgrade to the compatible firmware before running these demos. They run offline with no additional assets; a short button press changes modes or pauses animation.

The catalog lives in `public/apps.json`, with an embedded fallback in `public/app.js`. Keep both copies in sync. Optional `min_firmware` and `lvgl_version` fields add the compatibility label; apps without these fields keep their existing display.

## Custom configuration

Open **Settings → Advanced → Add property**. Enter a property name, choose a type, and enter its value:

| Property | Type | Example value |
| --- | --- | --- |
| `api_key` | Text | `your-key` |
| `settings.weather.city` | Text | `Tokyo` |
| `refresh_seconds` | Number | `30` |
| `notifications_enabled` | Boolean | `false` |
| `schedule` | JSON | `{"days":[1,2,3],"end":null}` |

Dots create nested objects. Escape a literal dot with a backslash, such as `sensor\.name`. Existing custom properties appear in Advanced, including arrays, null values, and empty objects. You can edit, rename, or remove them. Changes take effect only after **Save settings**.

The editor preserves other configuration properties and keeps values such as `0`, `false`, and empty text intact. Duplicate or overlapping paths and invalid values prevent saving. **View webscreen.json** previews the complete document, including any passwords it contains.

Settings load directly from `/webscreen.json` after connecting, independently of dashboard statistics. Navigating between sections preserves edits; **Reload from device** discards edits only after confirmation. The saved Wi-Fi password fills the password field and is masked by default; use the eye button to show or hide it. Edit it to replace it, leave it blank to retain the saved value, or select **Clear saved password** to remove it. The timezone field also reads saved `system.timezone` and legacy `device.timezone` values when the top-level `timezone` is absent. Saves require a successful device read, an upload acknowledgement, and matching read-back data. Restart the device to apply saved configuration. Brightness updates while dragging, with paced commands and firmware confirmation. Live brightness works even if configuration loading fails; Save settings persists the selected value.

Very large or deeply nested configurations remain subject to firmware limits. ArduinoJson 6 builds of the firmware use a 1 KB startup document; ArduinoJson 7 grows it dynamically. A successful file save verifies storage, not whether every custom setting is understood by the running app.

## Reliability and troubleshooting

- Serial operations run sequentially so console commands cannot interrupt an upload. Disconnects cancel pending responses and reset connection capabilities.
- Modern uploads use bounded base64 chunks for both text and binary files. Long source lines, Unicode, whitespace, and a literal `END` line are preserved.
- Incomplete file responses and unconfirmed uploads report errors. Settings edits remain available after a failed save.
- The interface still starts if browser storage or the terminal CDN is unavailable; a basic serial console is provided as a fallback.
- If a port cannot open, close other applications using it and retry. On Linux, `fuser -v /dev/ttyACM0` identifies a program holding the port.

## Development and tests

`public/app.js` manages navigation, apps, files, and the dashboard. `public/settings.js` handles the settings UI; `public/config.js` provides configuration validation and merging. `public/serial.js` implements the device protocol. Styles and markup are in `public/styles.css` and `public/index.html`.

Run the Node.js regression suite:

```sh
node --test tests/*.test.cjs
```

For browser checks, install Playwright outside the repository, start the local server above, and run with Chrome installed:

```sh
npm install --prefix /tmp/webscreen-admin-browser playwright
PLAYWRIGHT_PATH=/tmp/webscreen-admin-browser/node_modules/playwright node tests/browser.test.mjs
```

To check catalog labels and demo installs using a simulated device, run `node tests/catalog.browser.test.mjs` with the same `PLAYWRIGHT_PATH`. This also needs the sibling WebScreen-Awesome checkout; set `AWESOME_ROOT` if it is elsewhere.

Set `ADMIN_URL` to use another local server URL. Browser tests simulate the serial device and cover configuration round trips, validation, failure recovery, navigation, responsive layouts, and unavailable CDNs. They do not connect to physical USB hardware. Test affected workflows on a board before a release.

## WebScreen

[Website](https://webscreen.cc) · [Firmware and documentation](https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Software) · [App collection](https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome)

See [LICENSE](LICENSE) for licensing information.

// Optional catalog/install checks against the local static server; no USB access.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const awesome = process.env.AWESOME_ROOT || path.resolve(root, '../WebScreen-Awesome');
const catalog = JSON.parse(await readFile(path.join(root, 'public/apps.json'), 'utf8'));
const demos = catalog.filter(app => app.id.startsWith('lvgl95_'));
const label = 'Requires firmware 4.0 (LVGL 9.5 compatible)';
const url = process.env.ADMIN_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({channel: 'chrome', headless: true});
const errors = [];
try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.setDefaultTimeout(7000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', route => route.abort());
    await page.route('https://raw.githubusercontent.com/**', async route => {
        const parts = new URL(route.request().url()).pathname.split('/');
        const file = parts.pop(), id = parts.pop();
        assert.ok(demos.some(app => app.id === id));
        assert.ok(['app.json', 'script.js'].includes(file));
        await route.fulfill({body: await readFile(path.join(awesome, 'examples', id, file)),
            contentType: file === 'app.json' ? 'application/json' : 'text/javascript'});
    });
    await page.goto(url, {waitUntil: 'networkidle'});
    await page.locator('[data-section=apps]').click();
    await page.locator('#appSearch').fill('firmware 4.0');
    await page.waitForFunction(() => document.querySelectorAll('.app-card').length === 5);
    for (const app of demos) {
        assert.equal(await page.locator(`[data-app-id="${app.id}"] .app-requirement`).textContent(), label);
    }
    await page.locator('#appSearch').fill('LVGL 9.5');
    assert.equal(await page.locator('.app-card').count(), 5);
    for (const theme of ['light', 'eva']) {
        await page.locator('html').evaluate((html, value) => html.dataset.theme = value, theme);
        for (const width of [320, 768, 1440]) {
            await page.setViewportSize({width, height: 1000});
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            assert.ok(await page.locator('.app-requirement').evaluateAll(elements =>
                elements.every(el => el.scrollWidth <= el.clientWidth)));
        }
    }
    await page.locator('html').evaluate(html => html.dataset.theme = 'light');
    if (process.env.SCREENSHOT_PATH) await page.screenshot({path: process.env.SCREENSHOT_PATH});
    // Install each actual package through the Admin installer with a simulated device.
    await page.evaluate(() => {
        const admin = webScreenAdmin;
        window.catalogDevice = {uploads: [], config: [], reboots: 0};
        admin.serial.connected = true;
        admin.sdCardAvailable = true;
        admin.serial.uploadFile = async (filename, content) => catalogDevice.uploads.push({filename, content});
        admin.serial.setConfig = async (key, value) => catalogDevice.config.push({key, value});
        admin.serial.reboot = async () => {catalogDevice.reboots++;};
    });
    for (const [index, app] of demos.entries()) {
        const manifest = JSON.parse(await readFile(path.join(awesome, 'examples', app.id, 'app.json'), 'utf8'));
        assert.equal(manifest.min_firmware, app.min_firmware);
        assert.equal(manifest.lvgl_version, app.lvgl_version);
        await page.locator(`[data-app-id="${app.id}"]`).click();
        assert.equal(await page.locator('#modalAppRequirement').textContent(), label);
        assert.equal(await page.locator('#modalAppRequirement').isVisible(), true);
        await page.locator('#installAppBtn').click();
        await page.waitForFunction(count => catalogDevice.reboots === count, index + 1);
        const result = await page.evaluate(() => catalogDevice);
        assert.equal(result.uploads.length, index + 1, 'offline demo should only upload its script');
        assert.equal(result.uploads[index].filename, `${app.id}.js`);
        assert.equal(result.uploads[index].content,
            await readFile(path.join(awesome, 'examples', app.id, 'script.js'), 'utf8'));
        assert.deepEqual(result.config[index], {key: 'script', value: `${app.id}.js`});
        await page.evaluate(() => webScreenAdmin.hideLoadingModal());
    }
    await page.locator('#appSearch').fill('Blink LED');
    await page.locator('[data-app-id="blink"]').click();
    assert.equal(await page.locator('#modalAppRequirement').isVisible(), false);
    await page.locator('#closeModal').click();
    // Remote metadata must remain text in both views.
    await page.evaluate(() => {
        const admin = webScreenAdmin;
        admin.availableApps = [{...admin.availableApps[0], id: 'unsafe',
            min_firmware: '<img src=x onerror=alert(1)>', lvgl_version: '<svg onload=alert(1)>'}];
        admin.renderApps();
    });
    assert.equal(await page.locator('.app-requirement img, .app-requirement svg').count(), 0);
    await page.locator('[data-app-id="unsafe"]').click();
    assert.equal(await page.locator('#modalAppRequirement img, #modalAppRequirement svg').count(), 0);
    const offline = await browser.newPage();
    offline.on('pageerror', error => errors.push(error.message));
    await offline.route('https://**/*', route => route.abort());
    await offline.route('**/apps.json', route => route.abort());
    await offline.goto(url, {waitUntil: 'networkidle'});
    await offline.locator('[data-section=apps]').click();
    await offline.locator('#appSearch').fill('LVGL');
    await offline.waitForFunction(() => document.querySelectorAll('.app-card').length === 5);
    assert.equal(await offline.locator('.app-card').count(), 5);
    assert.deepEqual(await offline.locator('.app-card .app-requirement').allTextContents(), demos.map(() => label));
    assert.deepEqual(errors, []);
    console.log('PASS: catalog search, compatibility labels, both themes, mobile layouts, five installs, legacy apps, escaping, offline fallback');
} finally { await browser.close(); }

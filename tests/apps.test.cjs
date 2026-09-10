const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = require('../public/apps.json');
const context = vm.createContext({document: {addEventListener() {}}});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8') +
    '\nthis.admin = Object.create(WebScreenAdmin.prototype);', context);
const admin = context.admin;
admin.renderApps = () => {};

test('offline catalog matches the fetched catalog, including firmware requirements', () => {
    admin.loadFallbackApps();
    assert.deepEqual(JSON.parse(JSON.stringify(admin.availableApps)), catalog);
    assert.equal(new Set(catalog.map(app => app.id)).size, catalog.length);
});

test('five LVGL demos have distinct install files and explicit compatibility labels', () => {
    const demos = catalog.filter(app => app.id.startsWith('lvgl95_'));
    assert.equal(demos.length, 5);
    for (const app of demos) {
        assert.equal(app.min_firmware, '4.0.0');
        assert.equal(app.lvgl_version, '9.5');
        assert.equal(admin.appRequirement(app), 'Requires firmware 4.0 (LVGL 9.5 compatible)');
        assert.equal(app.main_file,
            `https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/${app.id}/script.js`);
        assert.equal(app.featured, true);
    }
});

test('legacy apps have no compatibility label; firmware-only requirements work', () => {
    assert.equal(admin.appRequirement(catalog.find(app => app.id === 'blink')), '');
    assert.equal(admin.appRequirement({min_firmware: '4.1.2'}), 'Requires firmware 4.1.2');
});

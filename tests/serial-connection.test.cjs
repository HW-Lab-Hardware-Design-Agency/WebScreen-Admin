const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(serial) {
    const button = { disabled: false };
    const toasts = [];
    const context = vm.createContext({
        window: {},
        navigator: { serial: {} },
        console: { error() {} },
        document: {
            addEventListener() {},
            getElementById: () => button,
        },
        setTimeout: (callback) => { callback(); return 0; },
    });
    for (const name of ['serial.js', 'app.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', name), 'utf8'), context);
    }
    const admin = vm.runInContext('Object.create(WebScreenAdmin.prototype)', context);
    admin.serial = serial;
    admin.showToast = (message, type) => toasts.push({ message, type });
    admin.loadDeviceInfo = async () => {};
    return { admin, button, toasts };
}

test('a busy port shows actionable guidance and permits a successful retry', async () => {
    const serial = { connected: false, connect: async () => {
        throw Object.assign(new Error('Failed to open serial port.'), { name: 'NetworkError' });
    } };
    const { admin, button, toasts } = fixture(serial);
    await admin.toggleConnection();
    assert.equal(toasts[0].type, 'error');
    assert.match(toasts[0].message, /Arduino Serial Monitor\/Plotter/);
    assert.equal(button.disabled, false);
    let loaded = false;
    serial.connect = async () => { serial.connected = true; };
    admin.loadDeviceInfo = async () => { loaded = true; };
    await admin.toggleConnection();
    assert.equal(loaded, true);
    assert.equal(button.disabled, false);
});

test('repeated clicks do not open overlapping port choosers', async () => {
    let resolveConnect;
    let attempts = 0;
    const serial = { connected: false, connect: () => {
        attempts++;
        return new Promise(resolve => { resolveConnect = resolve; });
    } };
    const { admin, button } = fixture(serial);
    const first = admin.toggleConnection();
    assert.equal(button.disabled, true);
    await admin.toggleConnection();
    assert.equal(attempts, 1);
    resolveConnect();
    await first;
    assert.equal(button.disabled, false);
});

test('cancelling the chooser reports selection guidance instead of a device failure', async () => {
    const { admin, button, toasts } = fixture({ connected: false, connect: async () => {
        throw Object.assign(new Error('No port selected'), { name: 'NotFoundError' });
    } });
    await admin.toggleConnection();
    assert.equal(toasts[0].type, 'info');
    assert.match(toasts[0].message, /No serial port selected/);
    assert.equal(button.disabled, false);
});

test('disconnect failures restore the button and display the actual error', async () => {
    const { admin, button, toasts } = fixture({ connected: true, disconnect: async () => {
        throw new Error('Device was unplugged');
    } });
    await admin.toggleConnection();
    assert.match(toasts[0].message, /Device was unplugged/);
    assert.equal(button.disabled, false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(response) {
    const context = vm.createContext({
        window:{}, navigator:{}, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, console,
        atob, btoa, setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,150)), clearTimeout, queueMicrotask,
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/serial.js'),'utf8'),context);
    const serial = vm.runInContext('new WebScreenSerial()',context);
    const commands = [];
    let controller;
    const readable = new ReadableStream({start(value){controller=value;}});
    serial.connected = true;
    serial.port = {readable};
    serial.writer = {write:async bytes=>{
        const command = new TextDecoder().decode(bytes).trim();
        commands.push(command);
        if (command === '/button' && response) controller.enqueue(new TextEncoder().encode(response));
    }};
    serial.readTask = serial.readLoop(serial.port,serial.session);
    return {serial,commands};
}

test('pressButton sends /button and resolves on the firmware acknowledgement', async () => {
    const {serial,commands} = fixture('[OK] Button press sent to the JS app\r\nWebScreen> ');
    assert.equal(await serial.pressButton(), true);
    assert.deepEqual(commands, ['/button']);
});

test('pressButton asks for a firmware update when /button is unknown', async () => {
    const {serial} = fixture('[ERROR] Unknown command: button. Type /help for available commands.\r\n');
    await assert.rejects(serial.pressButton(), /Please update/);
});

test('pressButton reports the firmware error in fallback mode', async () => {
    const {serial} = fixture('WebScreen> [ERROR] JS runtime is not running (fallback mode); no app to receive the press.\r\n');
    await assert.rejects(serial.pressButton(), /no app to receive the press/);
});

test('pressButton rejects when the device stays silent', async () => {
    const {serial} = fixture('');
    await assert.rejects(serial.pressButton(), /did not finish/);
});

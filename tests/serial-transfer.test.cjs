const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
    const context = vm.createContext({
        window:{}, navigator:{}, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, console,
        btoa: value => Buffer.from(value,'binary').toString('base64'),
        atob: value => Buffer.from(value,'base64').toString('binary'),
        setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 100)), clearTimeout, queueMicrotask,
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/serial.js'),'utf8'),context);
    const serial = vm.runInContext('new WebScreenSerial()',context);
    serial.connected = true;
    serial.supportsUploadCommand = true;
    const commands = [], writes = [], files = new Map();
    let wire = '', upload = null;
    let acknowledge = true;
    const line = text => serial.processLine(text);
    serial.writer = { write: async bytes => {
        writes.push(Buffer.from(bytes));
        wire += Buffer.from(bytes).toString('utf8');
        while (wire.includes('\n')) {
            const end = wire.indexOf('\n');
            const command = wire.slice(0, end).replace(/\r$/,'');
            wire = wire.slice(end + 1);
            commands.push(command);
            if (upload) {
                if (command === 'END') {
                    files.set(upload.name, Buffer.concat(upload.parts));
                    if (acknowledge) line(`[OK] File saved: ${upload.name} (${files.get(upload.name).length} B)`);
                    upload = null;
                } else upload.parts.push(Buffer.from(command,'base64'));
            } else if (command.startsWith('/upload ')) {
                const [, name, mode] = command.split(' ');
                assert.equal(mode,'base64');
                upload = {name,parts:[]};
                line('---');
            } else if (command.startsWith('/cat ')) {
                const name = command.slice(5);
                if (!files.has(name)) line('[ERROR] Cannot open file');
                else {
                    line(`--- ${name} ---`);
                    for (const part of files.get(name).toString().split('\n')) line(part);
                    line('--- End of file ---');
                }
            }
        }
    } };
    return {serial,files,commands,writes,line,noAck:()=>{acknowledge=false;}};
}

test('long UTF-8 text and an END line survive byte-exact upload', async () => {
    const f = fixture();
    const content = '  '+ 'Tokyo 東京 🌸 '.repeat(40)+'\nEND\n\n  indented\n';
    await f.serial.uploadFile('/long.js',content);
    assert.deepEqual(f.files.get('/long.js'),Buffer.from(content));
    assert.ok(f.writes.every(bytes=>bytes.length<=128));
    assert.equal(f.commands.filter(command=>command==='END').length,1);
    assert.equal(f.serial.activeCollectors.size,0);
    assert.equal(f.serial.requestRejectors.size,0);
});

test('terminal commands wait until an upload has completed', async () => {
    const f = fixture();
    const uploading = f.serial.uploadFile('/test.json','x'.repeat(450));
    const command = f.serial.sendCommand('/stats');
    await Promise.all([uploading,command]);
    assert.ok(f.commands.indexOf('/stats') > f.commands.indexOf('END'));
    assert.equal(f.files.get('/test.json').toString(),'x'.repeat(450));
});

test('missing upload acknowledgement rejects the save', async () => {
    const f = fixture();
    f.noAck();
    await assert.rejects(f.serial.uploadFile('/test.json','{}'),/did not finish/);
    assert.equal(f.serial.isUploading,false);
    assert.equal(f.serial.activeCollectors.size,0);
});

test('configuration is read back before reporting a successful save', async () => {
    const f = fixture();
    const config = {custom:{city:'Tokyo',empty:null},wifi:{pass:'keep'},enabled:false};
    await f.serial.writeConfiguration(config);
    assert.deepEqual(JSON.parse(f.files.get('/webscreen.json')),config);
    assert.ok(f.commands.includes('/cat /webscreen.json'));
});

test('read failures are errors, not partial files or silent defaults', async () => {
    const f = fixture();
    await assert.rejects(f.serial.readFile('/missing.json'),/Cannot open/);
    f.serial.writer.write = async () => { f.line('--- /partial.json ---'); f.line('{"seems":"valid"}'); };
    await assert.rejects(f.serial.readFile('/partial.json'),/did not finish/);
});

test('literal error text, indentation, and blank lines are preserved within files', async () => {
    const f = fixture();
    const content = '  {\n\n    "message": "not found [ERROR]"\n  }';
    f.files.set('/test.json',Buffer.from(content));
    assert.equal(await f.serial.readFile('/test.json'),content);
});

test('queued operations cannot run against a different connection', async () => {
    const f = fixture();
    const command = f.serial.sendCommand('/reboot');
    f.serial.session++;
    await assert.rejects(command,/disconnected/);
    assert.equal(f.commands.length,0);
});

test('disconnect rejects pending legacy collectors and permits a fresh connection', async () => {
    const f = fixture();
    const stats = f.serial.getStats();
    const failed = assert.rejects(stats, /disconnected/);
    await new Promise(resolve=>setImmediate(resolve));
    await f.serial.disconnect();
    await failed;
    assert.equal(f.serial.activeCollectors.size,0);
    assert.equal(f.serial.requestRejectors.size,0);
    f.serial.connected=true;
    f.serial.writer={write:async()=>{}};
    await f.serial.sendCommand('/info');
});

test('file reads accept supported legacy headers but still require a complete response', async () => {
    for (const [header,end] of [
        ['WebScreen> Contents of /webscreen.json:', '--- End of file ---'],
        ['Reading /webscreen.json...', '--- EOF ---'],
        ['File: /webscreen.json', '15 bytes read'],
        ['=== FILE START ===', '=== FILE END ==='],
    ]) {
        const f=fixture();
        f.serial.writer.write=async()=>{f.line(header);f.line(' {"saved":true} ');f.line(end);};
        assert.equal(await f.serial.readFile('/webscreen.json'),' {"saved":true} ');
    }
    const f=fixture();
    f.serial.writer.write=async()=>{f.line('File: /wrong.json');f.line('{}');f.line('--- EOF ---');};
    await assert.rejects(f.serial.readFile('/webscreen.json'),/did not finish/);
});

test('brightness waits for firmware confirmation and reports rejected or missing commands', async () => {
    const f=fixture();
    f.serial.writer.write=async bytes=>{f.line('WebScreen> [OK] Brightness set to '+Buffer.from(bytes).toString().trim().split(' ')[1]);};
    assert.equal(await f.serial.setBrightness(120),true);
    for (const value of [-1,256,1.5,'120']) await assert.rejects(f.serial.setBrightness(value),/integer/);
    f.serial.writer.write=async()=>{f.line('[ERROR] Display not initialized');};
    await assert.rejects(f.serial.setBrightness(100),/Display not initialized/);
    f.serial.writer.write=async()=>{};
    await assert.rejects(f.serial.setBrightness(100),/did not finish/);
});

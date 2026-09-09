const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(response, chunkSize = 7) {
    const context = vm.createContext({
        window:{}, navigator:{}, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, console,
        atob, btoa, setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,150)), clearTimeout, queueMicrotask,
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/serial.js'),'utf8'),context);
    const serial = vm.runInContext('new WebScreenSerial()',context);
    const commands = [];
    let controller;
    const readable = new ReadableStream({start(value){controller=value;}});
    const feed = text => {
        const bytes = new TextEncoder().encode(text);
        for (let offset=0;offset<bytes.length;offset+=chunkSize) controller.enqueue(bytes.slice(offset,offset+chunkSize));
    };
    serial.connected = true;
    serial.port = {readable};
    serial.writer = {write:async bytes=>{
        const command = new TextDecoder().decode(bytes).trim();
        commands.push(command);
        if (command === '/screenshot' && response) feed(response);
    }};
    serial.readTask = serial.readLoop(serial.port,serial.session);
    return {serial,feed,commands};
}

function frame(bytes, width, height, format='RGB565_SWAP', prefix='WebScreen> ') {
    const lines = [];
    for (let offset=0;offset<bytes.length;offset+=57) lines.push(bytes.subarray(offset,offset+57).toString('base64'));
    return `Queued. Data follows as an '=== SCREENSHOT ... ===' block\r\n\r\n${prefix}=== SCREENSHOT ${width}x${height} ${format} ===\r\n${lines.join('\r\n')}\r\n=== SCREENSHOT END ===\r\n`;
}

test('screenshot accepts a prompt attached to its header across USB packet boundaries', async () => {
    for (const format of ['RGB565','RGB565_SWAP']) {
        for (const prefix of ['', 'WebScreen> ', 'WebScreen> WebScreen> ']) {
            const pixels = Buffer.from([0xf8,0,7,0xe0]);
            const f = fixture(frame(pixels,2,1,format,prefix));
            try {
                const result = await f.serial.takeScreenshot();
                assert.equal(result.width,2);
                assert.equal(result.height,1);
                assert.equal(result.swap,format.endsWith('_SWAP'));
                assert.deepEqual(Buffer.from(result.bytes),pixels);
                assert.equal(f.serial.activeCollectors.size,0);
                assert.equal(f.serial.requestRejectors.size,0);
            } finally { await f.serial.disconnect(); }
        }
    }
});

test('a full panel capture preserves all bytes in the firmware 57-byte base64 chunks', async () => {
    const pixels = Buffer.alloc(536*240*2);
    for (let i=0;i<pixels.length;i++) pixels[i]=i%251;
    const f = fixture(frame(pixels,536,240),4096);
    try { assert.deepEqual(Buffer.from((await f.serial.takeScreenshot()).bytes),pixels); }
    finally { await f.serial.disconnect(); }
});

test('truncated, oversized, invalid and unsupported screenshots fail explicitly', async () => {
    for (const [response,error] of [
        [frame(Buffer.from([0,0]),2,1), /incomplete/i],
        [frame(Buffer.alloc(6),2,1), /size/i],
        [frame(Buffer.alloc(0),0,1), /dimensions/i],
        [frame(Buffer.alloc(0),999999999,999999999), /limit/i],
        [frame(Buffer.alloc(4),2,1,'RGB888'), /format/i],
        ['WebScreen> === SCREENSHOT 2x1 RGB565 ===\nA===\n=== SCREENSHOT END ===\n', /base64/i],
        ['=== SCREENSHOT END ===\n', /header/i],
    ]) {
        const f=fixture(response);
        try { await assert.rejects(f.serial.takeScreenshot(),error); }
        finally { await f.serial.disconnect(); }
    }
});

test('a corrupt screenshot retains the serial stream until its end marker', async () => {
    const f = fixture('WebScreen> === SCREENSHOT 2x1 RGB565 ===\nA===\n');
    try {
        const capture = assert.rejects(f.serial.takeScreenshot(),/base64/i);
        const next = f.serial.sendCommand('/stats');
        await new Promise(resolve=>setTimeout(resolve,10));
        assert.deepEqual(f.commands,['/screenshot']);
        f.feed('=== SCREENSHOT END ===\n');
        await Promise.all([capture,next]);
        assert.deepEqual(f.commands,['/screenshot','/stats']);
    } finally { await f.serial.disconnect(); }
});

test('firmware errors, incomplete streams and disconnects clear pending screenshot state', async () => {
    for (const [response,error] of [
        ['WebScreen> [ERROR] Screenshot unavailable (JS runtime not running)\n', /runtime not running/i],
        ['[ERROR] Unknown command: screenshot\n', /does not support/i],
        ['=== SCREENSHOT 2x1 RGB565 ===\nAAAAAA==\n', /did not finish/i],
    ]) {
        const f=fixture(response);
        try { await assert.rejects(f.serial.takeScreenshot(),error); }
        finally { await f.serial.disconnect(); }
        assert.equal(f.serial.activeCollectors.size,0);
        assert.equal(f.serial.requestRejectors.size,0);
    }
    const f=fixture(null);
    const capture=assert.rejects(f.serial.takeScreenshot(),/disconnected/i);
    await new Promise(resolve=>setImmediate(resolve));
    await f.serial.disconnect();
    await capture;
});

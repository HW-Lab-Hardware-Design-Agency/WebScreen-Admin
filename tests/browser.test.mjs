// Optional browser regression: run against the local static server, without hardware.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({channel:'chrome', headless:true});
const errors = [];
try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    page.setDefaultTimeout(7000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.ADMIN_URL || 'http://127.0.0.1:8765', {waitUntil:'networkidle'});
    await page.locator('[data-section=config]').click();
    assert.equal(await page.locator('#saveSystemBtn').isDisabled(),true);
    // Emulate the firmware line protocol at the real serial manager's writer.
    await page.evaluate(async () => {
        const admin = window.webScreenAdmin;
        const serial = admin.serial;
        window.testDevice = {
            content: JSON.stringify({settings:{wifi:{ssid:'Home',pass:'keep "<& me'},mqtt:{enabled:true},weather:{refresh:60}},
                script:'/social_feed.js', system:{timezone:'CUSTOM0'}, screen:{background:'#aBc',foreground:'#123456'}, display:{brightness:0}, device:{name:'preserve'}, values:[1,2,null], empty:null,
                'literal.dot':'preserved', 'unsafe\"><img src=x onerror=alert(1)>':'not markup'}),
            uploads:0, reads:0, fail:false, corrupt:false, commands:[],
        };
        const device = window.testDevice;
        serial.connected = true;
        serial.session++;
        serial.supportsUploadCommand = true;
        serial.writer = {write:async bytes => {
            if (device.fail) throw new Error('Simulated USB write failure');
            device.wire = (device.wire || '') + new TextDecoder().decode(bytes);
            while (device.wire.includes('\n')) {
                const end = device.wire.indexOf('\n');
                const command = device.wire.slice(0,end).replace(/\r$/,'');
                device.wire = device.wire.slice(end+1);
                device.commands.push(command);
                if (device.chunks) {
                    if (command === 'END') {
                        device.content = new TextDecoder().decode(Uint8Array.from(atob(device.chunks.join('')), char => char.charCodeAt(0)));
                        if (device.corrupt) device.content = '{}';
                        device.chunks = null;
                        device.uploads++;
                        serial.processLine('[OK] File saved: /webscreen.json (1 KB)');
                    } else device.chunks.push(command);
                } else if (command === '/screenshot') {
                    const swap = device.screenshotSwap !== false;
                    const pixels = swap ? [248,0,7,224,0,31] : [0,248,224,7,31,0];
                    serial.processLine("Queued. Data follows as an '=== SCREENSHOT ... ===' block");
                    serial.processLine(`WebScreen> === SCREENSHOT 3x1 RGB565${swap ? '_SWAP' : ''} ===`);
                    serial.processLine(btoa(String.fromCharCode(...pixels)));
                    serial.processLine('=== SCREENSHOT END ===');
                } else if (command.startsWith('/brightness ')) {
                    device.brightness = Number(command.split(' ')[1]);
                    serial.processLine(`WebScreen> [OK] Brightness set to ${device.brightness}`);
                } else if (command === '/cat /webscreen.json') {
                    device.reads++;
                    serial.processLine('--- /webscreen.json ---');
                    for (const line of device.content.split('\n')) serial.processLine(line);
                    serial.processLine('--- End of file ---');
                } else if (command === '/upload /webscreen.json base64') {
                    device.chunks = [];
                    serial.processLine('---');
                }
            }
        }};
        admin.sdCardAvailable = false;
        admin.rootFiles = [{type:'file',name:'social_feed.js'}];
        // A firmware without working dashboard commands must still populate settings.
        serial.connected = false;
        serial.connect = async () => {serial.connected = true;serial.session++;serial.onStatusChange(true);};
        serial.getDeviceInfo = async () => {throw new Error('Optional device info unavailable');};
        await admin.toggleConnection();
    });
    assert.equal(await page.evaluate(()=>testDevice.reads),1, 'settings should load before optional dashboard commands');
    assert.equal(await page.evaluate(()=>webScreenAdmin.sdCardAvailable),true);
    // Exercise the actual capture button, stream parser, canvas conversion, and PNG output.
    await page.locator('[data-section=dashboard]').click();
    for (const swap of [true,false]) {
        await page.evaluate(value=>{testDevice.screenshotSwap=value;},swap);
        await page.locator('#screenshotBtn').click();
        await page.waitForFunction(()=>document.getElementById('screenshotModal').classList.contains('active'));
        const shot = await page.locator('#screenshotCanvas').evaluate(canvas=>({
            width:canvas.width, height:canvas.height,
            rgba:[...canvas.getContext('2d').getImageData(0,0,3,1).data], png:canvas.toDataURL('image/png'),
        }));
        assert.equal(shot.width,3);
        assert.equal(shot.height,1);
        assert.deepEqual(shot.rgba,[255,0,0,255,0,255,0,255,0,0,255,255]);
        assert.ok(shot.png.startsWith('data:image/png;base64,'));
        assert.equal(await page.locator('#screenshotBtn').isDisabled(),false);
        await page.locator('#closeScreenshotModal').click();
    }
    await page.locator('[data-section=config]').click();

    assert.equal(await page.locator('#config-timezone').inputValue(),'CUSTOM0');
    assert.equal(await page.locator('#autoStart').inputValue(),'/social_feed.js');
    assert.equal(await page.locator('#customProperties img').count(),0);
    assert.equal(await page.locator('#wifiSSID').inputValue(),'Home');
    assert.equal(await page.locator('#wifiPassword').inputValue(),'keep "<& me');
    assert.equal(await page.locator('#wifiPassword').getAttribute('type'),'password');
    await page.getByRole('button',{name:'Show WiFi password',exact:true}).click();
    assert.equal(await page.locator('#wifiPassword').getAttribute('type'),'text');
    assert.equal(await page.evaluate(()=>webScreenAdmin.configDirty),false, 'revealing a password must not edit settings');
    await page.getByRole('button',{name:'Hide WiFi password',exact:true}).click();
    assert.equal(await page.locator('#wifiPassword').getAttribute('type'),'password');
    assert.equal(await page.locator('#mqttEnabled').isChecked(),true);
    assert.equal(await page.locator('#brightnessSlider').inputValue(),'0');
    assert.equal(await page.locator('#brightnessValue').textContent(),'0');
    assert.equal(await page.locator('#color-background').inputValue(),'#aBc');
    assert.equal(await page.getByLabel('Pick background color',{exact:true}).inputValue(),'#aabbcc');
    assert.equal(await page.locator('#color-foreground').inputValue(),'#123456');
    const customValue = path => page.locator('.custom-property').filter({has:page.locator(`[data-property-name][value="${path}"]`)}).locator('[data-property-value]');
    assert.equal(await customValue('settings.weather.refresh').inputValue(),'60');
    assert.equal(await customValue('device.name').inputValue(),'preserve');
    assert.deepEqual(JSON.parse(await customValue('values').inputValue()),[1,2,null]);
    assert.equal(await customValue('empty').inputValue(),'null');
    await page.locator('#clearWifiPassword').check();
    assert.equal(await page.locator('#wifiPassword').isDisabled(),true);
    await page.locator('#clearWifiPassword').uncheck();
    assert.equal(await page.locator('#wifiPassword').isDisabled(),false);
    assert.equal(await page.locator('#wifiPassword').inputValue(),'keep "<& me');
    // Leaving a password blank still preserves the saved value unless explicitly cleared.
    await page.locator('#wifiPassword').fill('');

    const add = async (name,type,value) => {
        await page.getByRole('button',{name:'Add property',exact:true}).click();
        const row = page.locator('.custom-property').last();
        await row.locator('[data-property-name]').fill(name);
        await row.locator('[data-property-type]').selectOption(type);
        if (type === 'boolean') await row.locator('[data-property-value]').selectOption(value);
        else await row.locator('[data-property-value]').fill(value);
    };
    await add('api_key','string','001');
    await add('settings.weather.city','string','Tokyo');
    await add('settings.weather.enabled','boolean','false');
    await add('threshold','number','0');
    await add('options','json','{"days":[1,2],"unused":null}');
    await page.locator('#saveSystemBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    let saved = await page.evaluate(()=>JSON.parse(testDevice.content));
    assert.equal(saved.settings.weather.city,'Tokyo');
    assert.equal(saved.settings.weather.enabled,false);
    assert.equal(saved.threshold,0);
    assert.equal(saved.api_key,'001');
    assert.equal(saved.device.name,'preserve');
    assert.deepEqual(saved.values,[1,2,null]);
    assert.equal(saved.empty,null);
    assert.equal(saved['literal.dot'],'preserved');
    assert.equal(saved.settings.wifi.pass,'keep "<& me');
    assert.deepEqual(saved.options,{days:[1,2],unused:null});
    assert.equal(saved.timezone,'CUSTOM0');
    assert.equal(saved.display.brightness,0);
    assert.equal(saved.screen.background,'#aBc');
    assert.equal(saved.settings.mqtt.enabled,true);
    assert.equal(await page.locator('#wifiPassword').inputValue(),'keep "<& me');
    assert.equal(await page.evaluate(()=>testDevice.reads),2, 'save should verify the stored file');
    assert.equal(await page.locator('#settingsError').isVisible(),false);
    assert.equal(await page.evaluate(()=>webScreenAdmin.configDirty),false);
    await page.locator('#reloadConfigBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    const city = page.locator('.custom-property').filter({has:page.locator('[data-property-name][value="settings.weather.city"]')});
    assert.equal(await city.locator('[data-property-value]').inputValue(),'Tokyo');
    await city.locator('[data-property-value]').fill('Kyoto');
    await page.locator('#wifiPassword').fill('new "<& password');
    await page.locator('[data-section=apps]').click();
    await page.locator('[data-section=config]').click();
    assert.equal(await city.locator('[data-property-value]').inputValue(),'Kyoto', 'navigation must preserve edits');
    assert.equal(await page.evaluate(()=>testDevice.reads),3, 'navigation must not repeatedly read settings');
    assert.equal(await page.locator('#wifiPassword').inputValue(),'new "<& password');
    await add('broken','json','{oops');
    await page.locator('#saveSystemBtn').click();
    assert.equal(await page.evaluate(()=>testDevice.uploads),1);
    assert.match(await page.locator('#settingsError').textContent(),/valid JSON/);
    await page.locator('.custom-property').last().locator('[data-remove-property]').click();
    await add('__proto__.polluted','string','bad');
    await page.locator('#saveSystemBtn').click();
    assert.match(await page.locator('#settingsError').textContent(),/reserved/);
    assert.equal(await page.evaluate(()=>({}).polluted),undefined);
    await page.locator('.custom-property').last().locator('[data-remove-property]').click();
    await page.evaluate(()=>{testDevice.fail=true;});
    await page.locator('#saveSystemBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    assert.equal(await page.evaluate(()=>webScreenAdmin.configDirty),true);
    assert.equal(await city.locator('[data-property-value]').inputValue(),'Kyoto');
    assert.match(await page.locator('#settingsError').textContent(),/Simulated USB/);
    await page.evaluate(()=>{testDevice.fail=false;});
    await page.locator('#saveSystemBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    assert.equal(await page.evaluate(()=>JSON.parse(testDevice.content).settings.weather.city),'Kyoto');
    assert.equal(await page.evaluate(()=>JSON.parse(testDevice.content).settings.wifi.pass),'new "<& password');
    assert.equal(await page.locator('#wifiPassword').inputValue(),'new "<& password');
    assert.equal(await page.locator('#wifiPassword').getAttribute('type'),'password');
    // Explicit deletion persists; blank Wi-Fi values can be saved deliberately.
    await city.locator('[data-remove-property]').click();
    await page.locator('#wifiSSID').fill('');
    await page.locator('#clearWifiPassword').check();
    await page.locator('#saveSystemBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    saved = await page.evaluate(()=>JSON.parse(testDevice.content));
    assert.equal(saved.settings.weather.city,undefined);
    assert.equal(saved.settings.wifi.ssid,'');
    assert.equal(saved.settings.wifi.pass,'');
    assert.equal(await page.locator('#wifiPassword').inputValue(),'');
    await add('bad_save','string','preserve this draft');
    await page.evaluate(()=>{testDevice.corrupt=true;});
    await page.locator('#saveSystemBtn').click();
    await page.waitForFunction(()=>!webScreenAdmin.configBusy);
    assert.match(await page.locator('#settingsError').textContent(),/differs/);
    assert.equal(await page.evaluate(()=>webScreenAdmin.configDirty),true);
    assert.equal(await page.locator('.custom-property').last().locator('[data-property-value]').inputValue(),'preserve this draft');
    await page.evaluate(()=>{webScreenAdmin.serial.connected=false;webScreenAdmin.handleConnectionChange(false);});
    assert.equal(await page.locator('.custom-property').last().locator('[data-property-value]').inputValue(),'preserve this draft');
    assert.equal(await page.locator('#saveSystemBtn').isDisabled(),true);
    // Live brightness also works before configuration loads and without SD-card metadata.
    await page.evaluate(()=>{webScreenAdmin.serial.connected=true;webScreenAdmin.sdCardAvailable=false;webScreenAdmin.configDirty=false;webScreenAdmin.handleConnectionChange(true);});
    await page.locator('#brightnessSlider').evaluate(input=>{input.value='123';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForFunction(()=>testDevice.brightness===123);
    assert.equal(await page.locator('#brightnessValue').textContent(),'123');
    assert.equal(await page.evaluate(()=>webScreenAdmin.configDirty),false, 'a live brightness preview must not prevent the initial settings read');
    const previews = await page.evaluate(()=>testDevice.commands.filter(command=>command.startsWith('/brightness ')).length);
    await page.locator('#brightnessSlider').evaluate(input=>{
        for (let value=124;value<=180;value++) {input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
        input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.waitForFunction(()=>testDevice.brightness===180);
    assert.ok(await page.evaluate(()=>testDevice.commands.filter(command=>command.startsWith('/brightness ')).length)-previews<=2, 'dragging must coalesce pending brightness commands');
    assert.equal(await page.locator('#reloadConfigBtn').isDisabled(),false, 'Reload must not depend on dashboard SD-card detection');
    // Invalid reads must not replace a configuration with defaults.
    await page.evaluate(async()=>{
        const admin=webScreenAdmin;
        admin.serial.connected=true; admin.sdCardAvailable=true; admin.configDirty=false;
        testDevice.content='{bad'; testDevice.corrupt=false;
        try { await admin.loadCurrentConfig(); } catch {}
    });
    assert.match(await page.locator('#settingsError').textContent(),/invalid JSON/);
    assert.equal(await page.locator('#saveSystemBtn').isDisabled(),true);
    for (const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${width}px settings overflow`);
    }
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'eva');
    console.log('PASS: settings CRUD, types, preservation, validation, failures, navigation, responsive layouts, theme');
    const offline = await browser.newPage();
    offline.on('pageerror',error=>errors.push(error.message));
    await offline.route('https://**/*',route=>route.abort());
    await offline.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable');}});});
    await offline.goto(process.env.ADMIN_URL || 'http://127.0.0.1:8765', {waitUntil:'networkidle'});
    await offline.locator('[data-section=config]').click();
    await offline.getByRole('button',{name:'Add property',exact:true}).click();
    assert.equal(await offline.locator('.custom-property').count(),1);
    assert.equal(await offline.locator('.terminal-fallback-input').count(),1);
    console.log('PASS: blocked CDNs and unavailable localStorage do not prevent initialization');
    assert.deepEqual(errors,[]);
    console.log('PASS: no uncaught browser errors');
} finally { await browser.close(); }

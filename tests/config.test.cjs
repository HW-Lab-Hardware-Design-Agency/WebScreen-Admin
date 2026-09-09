const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../public/config.js');

test('every custom JSON type survives a read/edit/save round trip', () => {
    const source = config.normalize({
        device: { name: 'Keep me', metadata: {} },
        settings: { weather: { city: 'Tokyo', refresh: 0, enabled: false }, wifi: { ssid: '', pass: 'secret' } },
        'literal.dot': 'value', 'quote"<tag>': 'safe',
        list: [1, 'two', { ok: true }], empty: null, blank: '',
    });
    const rows = config.customFields(source);
    assert.deepEqual(config.merge(source, [], rows, rows), source);
    assert.equal(rows.find(row => row.path === 'literal\\.dot').value, 'value');
});

test('new properties keep their explicit types and nested location', () => {
    const source = config.normalize({ script: 'social_feed.js' });
    const rows = [
        {path:'api_key',type:'string',value:'001'},
        {path:'settings.weather.city',type:'string',value:'Tokyo'},
        {path:'settings.weather.refresh',type:'number',value:'0'},
        {path:'settings.weather.enabled',type:'boolean',value:'false'},
        {path:'threshold',type:'number',value:'-0.5'},
        {path:'options',type:'json',value:'[1,2,null]'},
        {path:'empty',type:'string',value:''},
    ];
    const saved = config.merge(source, [], rows, []);
    assert.equal(saved.api_key, '001');
    assert.deepEqual(saved.settings.weather, { city:'Tokyo', refresh:0, enabled:false });
    assert.equal(saved.threshold, -0.5);
    assert.deepEqual(saved.options, [1,2,null]);
    assert.equal(saved.empty, '');
    assert.equal(saved.script, 'social_feed.js');
    assert.deepEqual(source, config.normalize({script:'social_feed.js'}));
});

test('renaming and deleting properties does not discard unrelated data', () => {
    const source = config.normalize({ old: 'rename', remove: 10, device: { name: 'keep' } });
    const original = config.customFields(source);
    const rows = original.filter(row => row.path !== 'remove').map(row => row.path === 'old' ? {...row, path:'new'} : row);
    const saved = config.merge(source, [], rows, original);
    assert.equal(saved.old, undefined);
    assert.equal(saved.remove, undefined);
    assert.equal(saved.new, 'rename');
    assert.equal(saved.device.name, 'keep');
});

test('invalid or overlapping paths cannot overwrite standard settings', () => {
    const source = config.normalize({});
    for (const path of ['', 'settings..city', '__proto__.polluted', 'constructor.prototype.x', 'settings', 'script.path', 'settings.wifi.pass']) {
        assert.throws(() => config.merge(source, [], [{path,type:'string',value:'x'}], []));
    }
    assert.throws(() => config.merge(source, [], [{path:'a',type:'string',value:'x'},{path:'a.b',type:'string',value:'x'}], []));
    assert.throws(() => config.merge(source, [], [{path:'a',type:'string',value:'x'},{path:'a',type:'string',value:'y'}], []));
    assert.equal({}.polluted, undefined);
});

test('invalid numbers and JSON fail validation instead of becoming zero or null', () => {
    for (const value of ['', 'abc', 'NaN', 'Infinity', '1e999', '0x10', '01']) assert.throws(() => config.parseValue(value, 'number'));
    for (const value of ['{bad}', '[1,]', '{"value":1e999}']) assert.throws(() => config.parseValue(value, 'json'));
    assert.throws(() => config.parseValue('yes', 'boolean'));
    assert.equal(config.parseValue('0.05', 'number'), 0.05);
});

test('legacy Wi-Fi migration retains custom fields and intentional empty values', () => {
    const value = config.normalize({wifi:{ssid:'old', password:'pw', channel:6}, settings:{wifi:{ssid:''}}, device:{timezone:'custom'}});
    assert.equal(value.settings.wifi.ssid, '');
    assert.equal(value.settings.wifi.pass, 'pw');
    assert.equal(value.wifi.channel, 6);
    assert.equal(value.device.timezone, 'custom');
    for (const input of [null, [], 'x', {settings:[]}, {display:'x'}]) assert.throws(() => config.normalize(input));
});

test('saved timezone aliases populate the standard field without replacing explicit values', () => {
    const source = {system:{timezone:'JST-9',ntp_server:'pool.ntp.org'}, device:{timezone:'UTC0'}};
    const normalized = config.normalize(source);
    assert.equal(normalized.timezone, 'JST-9');
    assert.deepEqual(normalized.system, source.system);
    assert.equal(source.timezone, undefined);
    assert.equal(config.normalize({device:{timezone:'CUSTOM0'}}).timezone, 'CUSTOM0');
    assert.equal(config.normalize({...source,timezone:''}).timezone, '');
    assert.equal(config.normalize({...source,timezone:'UTC0'}).timezone, 'UTC0');
    assert.throws(() => config.normalize({system:{timezone:123}}), /timezone must be a string/);
});

test('legacy text brightness and MQTT values load without blanking unrelated fields', () => {
    const source = {settings:{wifi:{ssid:'Home',pass:'saved'},mqtt:{enabled:'false'}},display:{brightness:'128'},custom:'keep'};
    const normalized = config.normalize(source);
    assert.equal(normalized.display.brightness,128);
    assert.equal(normalized.settings.mqtt.enabled,false);
    assert.equal(normalized.settings.wifi.pass,'saved');
    assert.equal(normalized.custom,'keep');
    assert.equal(source.display.brightness,'128');
    assert.equal(config.normalize({settings:{mqtt:{enabled:'true'}},display:{brightness:'0'}}).display.brightness,0);
    for (const value of ['oops','1.5','256','-1']) assert.throws(()=>config.normalize({display:{brightness:value}}));
});

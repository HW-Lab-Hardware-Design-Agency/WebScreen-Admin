/* Configuration editing without losing properties the firmware or an app owns. */
(function (root) {
    'use strict';
    const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const clone = value => JSON.parse(JSON.stringify(value));
    const corePaths = [
        ['settings', 'wifi', 'ssid'], ['settings', 'wifi', 'pass'],
        ['settings', 'mqtt', 'enabled'], ['screen', 'background'],
        ['screen', 'foreground'], ['display', 'brightness'], ['script'], ['timezone']
    ];
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const prefix = (a, b) => a.length <= b.length && a.every((key, i) => key === b[i]);
    const get = (config, path) => path.reduce((value, key) => object(value) && own(value, key) ? value[key] : undefined, config);
    const put = (target, key, value) => Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });

    function set(config, path, value) {
        let node = config;
        for (const key of path.slice(0, -1)) {
            if (!own(node, key)) put(node, key, {});
            if (!object(node[key])) throw new Error(`Cannot add a property inside ${formatPath(path)}: its parent is not an object.`);
            node = node[key];
        }
        put(node, path[path.length - 1], value);
    }

    function remove(config, path) {
        let node = config;
        for (const key of path.slice(0, -1)) {
            if (!object(node) || !own(node, key)) return;
            node = node[key];
        }
        if (object(node)) delete node[path[path.length - 1]];
    }

    function normalize(config) {
        if (!object(config)) throw new Error('webscreen.json must contain a JSON object.');
        const result = clone(config);
        for (const path of [['settings'], ['settings', 'wifi'], ['settings', 'mqtt'], ['screen'], ['display']]) {
            const value = get(result, path);
            if (value === undefined) set(result, path, {});
            else if (!object(value)) throw new Error(`${formatPath(path)} must be an object.`);
        }
        // Migrate known legacy Wi-Fi keys; retain unrelated properties.
        const oldWifi = object(result.wifi) ? result.wifi : {};
        const wifi = result.settings.wifi;
        for (const [key, oldKey] of [['ssid', 'ssid'], ['pass', 'pass'], ['pass', 'password']]) {
            if (!own(wifi, key) && own(oldWifi, oldKey)) put(wifi, key, oldWifi[oldKey]);
            delete oldWifi[oldKey];
        }
        if (object(result.wifi) && !Object.keys(result.wifi).length) delete result.wifi;
        for (const [legacy, key] of [['wifi.ssid', 'ssid'], ['wifi.password', 'pass']]) {
            if (!own(wifi, key) && own(result, legacy)) put(wifi, key, result[legacy]);
            delete result[legacy];
        }
        // Firmware accepts system.timezone; older admin configurations also used device.timezone.
        const savedTimezone = get(result, ['system', 'timezone']) ?? get(result, ['device', 'timezone']) ?? '';
        const defaults = ['', '', false, '#000000', '#FFFFFF', 200, '', savedTimezone];
        corePaths.forEach((path, i) => { if (get(result, path) === undefined) set(result, path, defaults[i]); });
        // Older /config set implementations wrote primitive settings as JSON strings.
        const mqtt = result.settings.mqtt;
        if (mqtt.enabled === 'true' || mqtt.enabled === 'false') mqtt.enabled = mqtt.enabled === 'true';
        if (typeof result.display.brightness === 'string') result.display.brightness = parseValue(result.display.brightness, 'number');
        corePaths.forEach((path, i) => {
            const value = get(result, path);
            const expectedType = i === corePaths.length - 1 ? 'string' : typeof defaults[i];
            if (typeof value !== expectedType) throw new Error(`${formatPath(path)} must be a ${expectedType}.`);
        });
        const brightness = result.display.brightness;
        if (!Number.isInteger(brightness) || brightness < 0 || brightness > 255) throw new Error('display.brightness must be an integer from 0 to 255.');
        return result;
    }

    // A backslash escapes a literal dot in a property name: sensor\.name.
    function formatPath(path) {
        return path.map(key => key.replace(/\\/g, '\\\\').replace(/\./g, '\\.')).join('.');
    }

    function parsePath(text) {
        if (!text.trim()) throw new Error('Enter a property name.');
        const keys = [];
        let key = '', escaped = false;
        for (const char of text.trim()) {
            if (escaped) { key += char; escaped = false; }
            else if (char === '\\') escaped = true;
            else if (char === '.') { keys.push(key); key = ''; }
            else key += char;
        }
        if (escaped) throw new Error('Finish the escaped property name.');
        keys.push(key);
        if (keys.some(key => !key.trim() || /[\u0000-\u001f]/.test(key))) throw new Error('Property names cannot be empty or contain control characters.');
        if (keys.some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) throw new Error('This property name is reserved.');
        return keys;
    }

    function typeOf(value) {
        return value === null || typeof value === 'object' ? 'json' : typeof value;
    }

    function parseValue(text, type) {
        if (type === 'string') return text;
        if (type === 'boolean') {
            if (text !== 'true' && text !== 'false') throw new Error('Choose true or false.');
            return text === 'true';
        }
        if (type === 'number') {
            if (!text.trim() || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text.trim()) || !Number.isFinite(Number(text))) {
                throw new Error('Enter a finite number, such as 30 or 0.5.');
            }
            return Number(text);
        }
        if (type === 'json') {
            try {
                const parsed = JSON.parse(text);
                const check = value => {
                    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error();
                    if (value && typeof value === 'object') Object.values(value).forEach(check);
                };
                check(parsed);
                return parsed;
            } catch { throw new Error('Enter valid JSON, such as [1, 2], {"city":"Tokyo"}, or null.'); }
        }
        throw new Error('Choose a value type.');
    }

    function customFields(config) {
        const fields = [];
        const visit = (value, path) => {
            if (corePaths.some(core => same(core, path))) return;
            if (object(value) && Object.keys(value).length) {
                Object.entries(value).forEach(([key, child]) => visit(child, [...path, key]));
            } else if (path.length && !corePaths.some(core => prefix(path, core))) {
                const type = typeOf(value);
                fields.push({ path: formatPath(path), originalPath: path, type,
                    value: type === 'json' ? JSON.stringify(value, null, 2) : String(value) });
            }
        };
        visit(config, []);
        return fields;
    }

    function merge(config, coreValues, fields, originalFields) {
        const result = clone(config);
        const paths = fields.map(field => parsePath(field.path));
        paths.forEach((path, i) => {
            if (corePaths.some(core => prefix(path, core) || prefix(core, path))) throw new Error(`${fields[i].path} is managed by the standard settings form.`);
            if (paths.some((other, j) => j !== i && (prefix(path, other) || prefix(other, path)))) throw new Error(`${fields[i].path} overlaps another property. Use unique names.`);
        });
        originalFields.forEach(field => remove(result, field.originalPath));
        coreValues.forEach(({path, value}) => set(result, path, value));
        fields.forEach((field, i) => set(result, paths[i], parseValue(field.value, field.type)));
        return result;
    }

    const api = { normalize, customFields, merge, parsePath, formatPath, parseValue, get, corePaths };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.WebScreenConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

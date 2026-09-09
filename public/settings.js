/* Device settings: preserve the loaded document and apply only explicit edits. */
Object.assign(WebScreenAdmin.prototype, {
    normalizeConfig(config) { return WebScreenConfig.normalize(config); },

    async readWebScreenConfig() {
        const content = await this.serial.readFile('/webscreen.json');
        if (content === null || !content.trim()) throw new Error('Could not read webscreen.json. Check the SD card and reload.');
        let config;
        try { config = JSON.parse(content); }
        catch { throw new Error('webscreen.json contains invalid JSON. Download the file to repair it before saving settings.'); }
        return this.normalizeConfig(config);
    },

    async saveWebScreenConfig(config) {
        await this.serial.writeConfiguration(config);
    },

    async loadCurrentConfig() {
        if (!this.serial.connected || this.configDirty || this.configBusy) return;
        this.configBusy = true;
        const session = this.serial.session;
        this.setSettingsError('');
        this.updateSettingsState('Reading webscreen.json…');
        try {
            const config = await this.readWebScreenConfig();
            if (!this.serial.connected || session !== this.serial.session) return;
            this.currentConfig = config;
            this.sdCardAvailable = true;
            this.updateSDCardDependentSections();
            this.configLoaded = true;
            this.configDirty = false;
            this.renderDynamicConfig(config);
            this.updateSettingsState('Loaded from your device');
        } catch (error) {
            this.configLoaded = false;
            this.setSettingsError(error.message);
            throw error;
        } finally {
            this.configBusy = false;
            this.updateSettingsState();
        }
    },

    async reloadConfig() {
        if (this.configBusy) return;
        if (!this.serial.connected) {
            this.showToast('Connect a device to load settings.', 'warning');
            return;
        }
        if (this.configDirty && !confirm('Discard your unsaved settings and reload from the device?')) return;
        this.configDirty = false;
        try { await this.loadCurrentConfig(); }
        catch (error) { this.showToast(error.message, 'error'); }
    },

    collectSettings() {
        const container = document.getElementById('dynamicConfigContainer');
        const coreValues = [];
        for (const input of container.querySelectorAll('[data-config-path]')) {
            if (!input.checkValidity()) { input.reportValidity(); throw new Error('Check the highlighted setting.'); }
            let value = input.type === 'checkbox' ? input.checked : input.value;
            if (input.dataset.valueType === 'number') value = WebScreenConfig.parseValue(value, 'number');
            coreValues.push({ path: input.dataset.configPath.split('.'), value });
        }
        const password = document.getElementById('wifiPassword').value;
        const clearPassword = document.getElementById('clearWifiPassword').checked;
        if (password || clearPassword) {
            coreValues.push({ path: ['settings', 'wifi', 'pass'], value: clearPassword ? '' : password });
        }
        const fields = [...container.querySelectorAll('.custom-property')].map(row => ({
            path: row.querySelector('[data-property-name]').value,
            type: row.querySelector('[data-property-type]').value,
            value: row.querySelector('[data-property-value]').value,
        }));
        return WebScreenConfig.merge(this.currentConfig, coreValues, fields, this.originalCustomFields);
    },

    async saveSystemSettings() {
        if (this.configBusy) return;
        if (!this.serial.connected || !this.sdCardAvailable || !this.configLoaded) {
            this.showToast('Load settings from a connected device before saving.', 'warning');
            return;
        }
        let updated;
        try { updated = this.collectSettings(); }
        catch (error) { this.setSettingsError(error.message); return; }
        this.configBusy = true;
        this.setSettingsError('');
        this.updateSettingsState('Saving and verifying…');
        try {
            await this.saveWebScreenConfig(updated);
            this.currentConfig = updated;
            this.configDirty = false;
            this.renderDynamicConfig(updated);
            this.updateSettingsState('Saved and verified on your device');
            this.showToast('Settings saved and verified. Restart the device to apply them.', 'success');
        } catch (error) {
            this.setSettingsError(`Settings could not be verified: ${error.message}`);
            this.showToast('Save failed. Your edits are still in the form.', 'error');
        } finally {
            this.configBusy = false;
            this.updateSettingsState();
        }
    },

    setSettingsError(message) {
        const error = document.getElementById('settingsError');
        if (error) { error.textContent = message; error.hidden = !message; }
    },

    updateSettingsState(message) {
        const writable = this.serial.connected && this.sdCardAvailable && this.configLoaded;
        const status = document.getElementById('settingsStatus');
        if (status) {
            if (message) this.settingsMessage = message;
            status.textContent = this.configBusy ? (message || this.settingsMessage || 'Working…') :
                !writable ? (this.serial.connected ? 'Settings not loaded · click Reload to read webscreen.json' : 'Preview · connect and load your device to save') :
                this.configDirty ? 'Unsaved changes' : this.settingsMessage || 'All changes saved';
            status.classList.toggle('is-dirty', Boolean(this.configDirty));
        }
        const save = document.getElementById('saveSystemBtn');
        if (save) {
            save.disabled = !writable || this.configBusy || !this.configDirty;
            save.innerHTML = this.configBusy ? '<i aria-hidden="true" class="fas fa-spinner fa-spin"></i> Working…' : '<i aria-hidden="true" class="fas fa-check"></i> Save settings';
        }
        const reload = document.getElementById('reloadConfigBtn');
        if (reload) reload.disabled = !this.serial.connected || this.configBusy;
        const fields = document.getElementById('settingsFields');
        if (fields) fields.disabled = Boolean(this.configBusy);
        const sync = document.getElementById('syncTimeBtn');
        if (sync) sync.disabled = !writable || this.configBusy;
    },

    markSettingsDirty() {
        this.configDirty = true;
        this.setSettingsError('');
        this.updateSettingsState();
        clearTimeout(this.configPreviewTimer);
        this.configPreviewTimer = setTimeout(() => this.updateConfigPreview(), 200);
    },

    updateConfigPreview() {
        const preview = document.getElementById('configPreview');
        if (!preview || !preview.parentElement.open) return;
        try { preview.textContent = JSON.stringify(this.collectSettings(), null, 2); }
        catch (error) { preview.textContent = error.message; }
    },

    customFieldHtml(field = { path: '', type: 'string', value: '' }) {
        const esc = value => this.escapeHtml(value);
        const id = `property-${++this.customFieldId}`;
        const types = { string: 'Text', number: 'Number', boolean: 'Boolean', json: 'JSON' };
        return `<div class="custom-property">
            <div><label for="${id}-name">Property name</label><input id="${id}-name" class="form-control property-name" data-property-name value="${esc(field.path)}" placeholder="settings.weather.city" spellcheck="false" autocomplete="off"></div>
            <div><label for="${id}-type">Type</label><select id="${id}-type" class="form-control" data-property-type>${Object.entries(types).map(([type, label]) => `<option value="${type}" ${field.type === type ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
            <div class="property-value-cell"><label for="${id}-value">Value</label>${this.customValueHtml(field.type, field.value, `${id}-value`)}</div>
            <button type="button" class="btn-icon remove-property" data-remove-property aria-label="Remove property ${esc(field.path || 'row')}" title="Remove property"><i class="fas fa-trash-can" aria-hidden="true"></i></button>
        </div>`;
    },

    customValueHtml(type, value, id) {
        const common = `id="${id}" class="form-control" data-property-value`;
        if (type === 'boolean') return `<select ${common}><option value="true" ${value === 'true' ? 'selected' : ''}>true</option><option value="false" ${value !== 'true' ? 'selected' : ''}>false</option></select>`;
        if (type === 'json') return `<textarea ${common} rows="2" spellcheck="false">${this.escapeHtml(value)}</textarea>`;
        return `<input ${common} type="text" ${type === 'number' ? 'inputmode="decimal"' : ''} value="${this.escapeHtml(value)}" autocomplete="off">`;
    },

    renderDynamicConfig(config) {
        const container = document.getElementById('dynamicConfigContainer');
        if (!container) return;
        const esc = value => this.escapeHtml(value);
        this.customFieldId = 0;
        this.originalCustomFields = WebScreenConfig.customFields(config);
        const wifi = config.settings.wifi;
        const pickerColor = value => /^#[0-9a-f]{3}$/i.test(value) ? '#' + [...value.slice(1)].map(char => char + char).join('') : value;
        const color = (key, label) => `<div class="config-field"><label for="color-${key}">${label}</label><div class="color-picker-wrapper"><input type="color" class="color-picker-input" aria-label="Pick ${label.toLowerCase()}" value="${/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(config.screen[key]) ? pickerColor(config.screen[key]) : '#000000'}"><input id="color-${key}" class="form-control color-hex-input" data-config-path="screen.${key}" value="${esc(config.screen[key])}" pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" required spellcheck="false"></div></div>`;
        container.innerHTML = `
            <fieldset id="settingsFields" class="settings-fields"><legend class="sr-only">Device configuration</legend>
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-cog" aria-hidden="true"></i> General</h3>
                <div class="config-section-fields">
                    <div class="config-field"><label for="wifiSSID">WiFi Network (SSID)</label><input id="wifiSSID" class="form-control" data-config-path="settings.wifi.ssid" value="${esc(wifi.ssid)}" placeholder="Enter WiFi network name" autocomplete="off"></div>
                    <div class="config-field"><label for="wifiPassword">WiFi Password</label><div class="config-field-control"><div class="password-input"><input id="wifiPassword" class="form-control" type="password" placeholder="Enter WiFi password" autocomplete="new-password"><button type="button" id="toggleWifiPassword" class="btn-icon" aria-label="Show WiFi password" aria-controls="wifiPassword" title="Show WiFi password"><i class="fas fa-eye" aria-hidden="true"></i></button></div><label class="inline-check"><input type="checkbox" id="clearWifiPassword"> Clear saved password</label></div></div>
                    <div class="config-field"><label for="autoStart">Auto-start Script</label><select id="autoStart" class="form-control" data-config-path="script"><option value="">None</option></select></div>
                </div>
            </div>
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-microchip" aria-hidden="true"></i> Device</h3>
                <div class="config-section-fields">${color('background', 'Background Color')}${color('foreground', 'Foreground Color')}
                    <div class="config-field"><label for="brightnessSlider">Brightness (<output id="brightnessValue">${esc(config.display.brightness)}</output>/255)</label><input type="range" class="form-control" id="brightnessSlider" data-config-path="display.brightness" data-value-type="number" min="0" max="255" value="${esc(config.display.brightness)}"></div>
                </div>
            </div>
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-clock" aria-hidden="true"></i> Time &amp; Location</h3>
                <div class="config-section-fields">
                    <div class="config-field"><label for="config-time">Time</label><input type="time" id="config-time" step="1" class="form-control"></div>
                    <div class="config-field"><label for="config-date">Date</label><input type="date" id="config-date" class="form-control"></div>
                    <div class="config-field"><label for="config-timezone">Timezone</label><div class="input-with-button"><select id="config-timezone" class="form-control" data-config-path="timezone">${buildTimezoneOptionsHtml(config.timezone)}</select><button type="button" class="btn btn-secondary btn-detect" id="detectTimezoneBtn"><i class="fas fa-crosshairs" aria-hidden="true"></i> Detect</button></div></div>
                    <div class="config-field config-field-actions"><p class="field-hint">Date and time use your computer's local timezone.</p><button type="button" class="btn btn-primary" id="syncTimeBtn"><i aria-hidden="true" class="fas fa-sync"></i> Sync Time to Device</button></div>
                </div>
            </div>
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-cog" aria-hidden="true"></i> Advanced Settings</h3>
                <div class="config-section-fields">
                    <div class="config-field"><label for="mqttEnabled">MQTT</label><label class="toggle-switch"><input id="mqttEnabled" type="checkbox" data-config-path="settings.mqtt.enabled" ${config.settings.mqtt.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div>
                </div>
                <div class="custom-properties-section">
                    <div class="custom-properties-heading"><div><h4>Custom Properties (<span id="customPropertyCount">${this.originalCustomFields.length}</span>)</h4><p class="field-hint">Use <code>api_key</code> for a root property, or <code>settings.weather.city</code> for a nested one.</p></div><button type="button" class="btn btn-secondary" id="addPropertyBtn"><i aria-hidden="true" class="fas fa-plus"></i> Add property</button></div>
                    <div id="customProperties">${this.originalCustomFields.map(field => this.customFieldHtml(field)).join('')}</div>
                    <p id="customPropertiesEmpty" class="field-hint" ${this.originalCustomFields.length ? 'hidden' : ''}>No custom properties yet. Add a property to save it in webscreen.json.</p>
                    <details class="config-preview"><summary>View webscreen.json</summary><p class="field-hint">Includes passwords and other values stored in the file.</p><pre id="configPreview"></pre></details>
                </div>
            </div></fieldset>`;
        // Set the property directly so special characters are preserved without exposing a value attribute.
        document.getElementById('wifiPassword').value = wifi.pass;
        this.populateAutoStartDropdown();
        const now = new Date();
        document.getElementById('config-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        document.getElementById('config-time').value = now.toTimeString().slice(0,8);
        container.oninput = event => {
            if (event.target.id === 'brightnessSlider') {
                document.getElementById('brightnessValue').textContent = event.target.value;
                this.queueBrightnessPreview(Number(event.target.value));
                // A live adjustment before loading must not block the first configuration read.
                if (this.serial.connected && !this.configLoaded) return;
            }
            if (['config-date', 'config-time'].includes(event.target.id)) return;
            if (event.target.type === 'color') event.target.nextElementSibling.value = event.target.value.toUpperCase();
            if (event.target.matches('.color-hex-input') && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(event.target.value)) event.target.previousElementSibling.value = pickerColor(event.target.value);
            this.markSettingsDirty();
        };
        container.onchange = event => {
            if (event.target.id === 'clearWifiPassword') {
                document.getElementById('wifiPassword').disabled = event.target.checked;
                document.getElementById('toggleWifiPassword').disabled = event.target.checked;
            }
            if (event.target.id === 'brightnessSlider') {
                this.queueBrightnessPreview(Number(event.target.value), true);
                if (this.serial.connected && !this.configLoaded) return;
            }
            if (['config-date', 'config-time'].includes(event.target.id)) return;
            if (event.target.matches('[data-property-type]')) {
                const cell = event.target.closest('.custom-property').querySelector('.property-value-cell');
                const input = cell.querySelector('[data-property-value]');
                const value = event.target.value === 'json' ? JSON.stringify(input.value) : input.value;
                input.outerHTML = this.customValueHtml(event.target.value, value, input.id);
            }
            this.markSettingsDirty();
        };
        container.onclick = event => {
            const toggle = event.target.closest('#toggleWifiPassword');
            if (toggle) {
                const input = document.getElementById('wifiPassword');
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                toggle.setAttribute('aria-label', show ? 'Hide WiFi password' : 'Show WiFi password');
                toggle.title = toggle.getAttribute('aria-label');
                toggle.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
            if (event.target.closest('#addPropertyBtn')) {
                document.getElementById('customProperties').insertAdjacentHTML('beforeend', this.customFieldHtml());
                document.querySelector('#customProperties .custom-property:last-child [data-property-name]').focus();
                this.updatePropertyCount();
                this.markSettingsDirty();
            }
            const remove = event.target.closest('[data-remove-property]');
            if (remove) {
                remove.closest('.custom-property').remove();
                this.updatePropertyCount();
                this.markSettingsDirty();
                document.getElementById('addPropertyBtn').focus();
            }
        };
        container.querySelector('details').addEventListener('toggle', () => this.updateConfigPreview());
        document.getElementById('detectTimezoneBtn').onclick = () => {
            const name = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const select = document.getElementById('config-timezone');
            const option = [...select.options].find(option => option.dataset.iana === name);
            if (option) { select.value = option.value; this.markSettingsDirty(); }
            else this.showToast('Select your timezone from the list.', 'info');
        };
        document.getElementById('syncTimeBtn').onclick = () => this.syncSettingsTime();
        this.updateSettingsState();
    },

    queueBrightnessPreview(value, immediate = false) {
        if (!this.serial.connected) return;
        this.pendingBrightness = { value, session: this.serial.session };
        if (immediate) this.flushBrightnessPreview();
        else if (!this.brightnessTimer && !this.brightnessInFlight) {
            this.brightnessTimer = setTimeout(() => this.flushBrightnessPreview(), 75);
        }
    },

    async flushBrightnessPreview() {
        clearTimeout(this.brightnessTimer);
        this.brightnessTimer = null;
        if (this.brightnessInFlight) return;
        const next = this.pendingBrightness;
        this.pendingBrightness = null;
        if (!next || !this.serial.connected || next.session !== this.serial.session) return;
        this.brightnessInFlight = true;
        try {
            await this.serial.setBrightness(next.value);
        } catch (error) {
            if (this.serial.connected && next.session === this.serial.session) this.showToast(error.message, 'error');
        } finally {
            this.brightnessInFlight = false;
            if (this.pendingBrightness) {
                this.brightnessTimer = setTimeout(() => this.flushBrightnessPreview(), 75);
            }
        }
    },

    cancelBrightnessPreview() {
        clearTimeout(this.brightnessTimer);
        this.brightnessTimer = null;
        this.pendingBrightness = null;
    },

    updatePropertyCount() {
        const count = document.querySelectorAll('.custom-property').length;
        document.getElementById('customPropertyCount').textContent = count;
        document.getElementById('customPropertiesEmpty').hidden = count > 0;
    },

    async syncSettingsTime() {
        if (!this.serial.connected || this.configBusy) return;
        const date = document.getElementById('config-date').value;
        const time = document.getElementById('config-time').value;
        const epoch = Math.floor(new Date(`${date}T${time}`).getTime() / 1000);
        if (!Number.isFinite(epoch)) { this.setSettingsError('Enter a valid date and time.'); return; }
        const button = document.getElementById('syncTimeBtn');
        button.disabled = true;
        try {
            const success = await this.serial.syncTime(epoch);
            this.showToast(success ? 'Device time synchronized.' : 'The device did not confirm the time update.', success ? 'success' : 'error');
        } catch (error) { this.showToast(error.message, 'error'); }
        finally { this.updateSettingsState(); }
    },
});

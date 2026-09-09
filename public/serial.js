// WebScreen Serial Manager for Admin UI
class WebScreenSerial {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.connected = false;
        this.buffer = '';
        this.callbacks = new Map();
        this.activeCollectors = new Map(); // For multi-line response collection
        this.onStatusChange = null;
        this.onDataReceived = null;
        this.firmwareVersion = null; // Cache firmware version for capability detection
        this.supportsUploadCommand = null; // null = unknown, true/false = detected
        this.isUploading = false;
        this.session = 0;
        this.operationQueue = Promise.resolve();
        this.requestRejectors = new Map();
        // Every public device operation owns the serial stream until it finishes.
        // Internal calls bypass the queue to avoid re-entering their own operation.
        const operations = ['getDeviceInfo', 'getStats', 'listFiles', 'uploadFile',
            'deleteFile', 'readFile', 'loadApp', 'evalJs', 'getErrors', 'runGC',
            'getHelp', 'reboot', 'factoryReset', 'makeDirectory', 'downloadFileBase64',
            'takeScreenshot', 'backup', 'setConfig', 'getConfig', 'connectWiFi',
            'setBrightness', 'setOrientation', 'setTimeout', 'syncTime', 'writeConfiguration'];
        for (const name of operations) {
            const operation = this[name].bind(this);
            this[`_${name}`] = operation;
            this[name] = (...args) => this.runOperation(() => operation(...args));
        }
    }

    runOperation(operation) {
        const session = this.session;
        const run = async () => {
            if (!this.connected || session !== this.session) throw new Error('Device disconnected. Reconnect and try again.');
            this.operationSession = session;
            const result = await operation();
            if (session !== this.session) throw new Error('Device disconnected before the operation finished.');
            return result;
        };
        const result = this.operationQueue.then(run);
        this.operationQueue = result.catch(() => {});
        return result;
    }

    async connect() {
        if (this.connected) return true;
        if (this.connecting) return this.connecting;
        this.connecting = (async () => {
            try {
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 16384 });
                this.port = port;
                this.writer = port.writable.getWriter();
                this.buffer = '';
                this.firmwareVersion = null;
                this.supportsUploadCommand = null;
                this.session++;
                this.connected = true;
                this.readTask = this.readLoop(port, this.session);
                this.onStatusChange?.(true);
                return true;
            } catch (error) {
                await this.disconnect();
                throw error;
            } finally { this.connecting = null; }
        })();
        return this.connecting;
    }

    async disconnect() {
        if (this.disconnecting) return this.disconnecting;
        this.disconnecting = (async () => {
            const wasConnected = this.connected;
            this.connected = false;
            this.session++;
            const error = new Error('Device disconnected.');
            for (const reject of this.requestRejectors.values()) reject(error);
            this.requestRejectors.clear();
            this.activeCollectors.clear();
            this.callbacks.clear();
            try { await this.reader?.cancel(); } catch {}
            try { await this.readTask; } catch {}
            try { await this.writer?.abort(); } catch {}
            try { this.writer?.releaseLock(); } catch {}
            try { await this.port?.close(); } catch {}
            this.reader = this.writer = this.port = this.readTask = null;
            this.buffer = '';
            this.firmwareVersion = null;
            this.supportsUploadCommand = null;
            if (wasConnected) this.onStatusChange?.(false);
        })();
        try { await this.disconnecting; }
        finally { this.disconnecting = null; }
    }

    async readLoop(port, session) {
        const decoder = new TextDecoder();
        const reader = port.readable.getReader();
        this.reader = reader;
        try {
            while (this.connected && session === this.session) {
                const { value, done } = await reader.read();
                if (done) break;
                this.buffer += decoder.decode(value, { stream: true });
                const lines = this.buffer.split('\n');
                this.buffer = lines.pop() || '';
                if (this.buffer.length > 1024 * 1024) throw new Error('Serial response exceeded the receive limit.');
                for (const line of lines) this.processLine(line.replace(/\r$/, ''));
            }
        } catch (error) {
            if (this.connected) console.error('Serial read failed:', error.message);
        } finally {
            reader.releaseLock();
            if (this.reader === reader) this.reader = null;
            // Do not await disconnect here: it waits for this read task to end.
            if (session === this.session && this.connected) queueMicrotask(() => this.disconnect());
        }
    }

    // Process received line
    processLine(rawLine) {
        const line = rawLine.trim();
        // Notify data received
        if (this.onDataReceived) {
            try { this.onDataReceived(rawLine); } catch (error) { console.error(error); }
        }

        // Process active collectors (multi-line response handlers)
        for (const [id, collector] of this.activeCollectors) {
            collector(line, rawLine);
        }

        // Check for one-time pattern callbacks
        for (const [pattern, callback] of this.callbacks) {
            if (line.includes(pattern)) {
                callback(line);
            }
        }
    }

    sendCommand(command) {
        return this.runOperation(() => this._sendCommand(command));
    }

    async _sendCommand(command) {
        if (!this.connected || !this.writer || this.operationSession !== this.session) throw new Error('Not connected');
        const bytes = new TextEncoder().encode(command + '\r\n');
        // Native USB CDC defaults to a 256-byte RX queue. Pace long commands.
        for (let offset = 0; offset < bytes.length; offset += 128) {
            if (!this.connected || this.operationSession !== this.session) throw new Error('Device disconnected during transfer.');
            await this.writer.write(bytes.subarray(offset, offset + 128));
            if (offset + 128 < bytes.length) await new Promise(resolve => setTimeout(resolve, 10));
        }
        return true;
    }

    responsePromise(executor) {
        return new Promise((resolve, reject) => {
            const id = Symbol('response');
            const timers = new Set();
            const before = new Set(this.activeCollectors.keys());
            let collectorIds = [];
            let settled = false;
            const finish = (error, value) => {
                if (settled) return;
                settled = true;
                timers.forEach(clearTimeout);
                collectorIds.forEach(key => this.activeCollectors.delete(key));
                this.requestRejectors.delete(id);
                error ? reject(error) : resolve(value);
            };
            const schedule = (fn, delay) => {
                const timer = setTimeout(fn, delay);
                timers.add(timer);
                return timer;
            };
            this.requestRejectors.set(id, error => finish(error));
            try {
                // Defer settlement until the collector and its timers are registered.
                executor(value => queueMicrotask(() => finish(null, value)),
                    error => queueMicrotask(() => finish(error)), schedule);
                collectorIds = [...this.activeCollectors.keys()].filter(key => !before.has(key));
            } catch (error) { finish(error); }
        });
    }

    request(command, onLine, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            const id = Symbol(command);
            let timer;
            const finish = (error, value) => {
                if (!this.activeCollectors.has(id)) return;
                clearTimeout(timer);
                this.activeCollectors.delete(id);
                this.requestRejectors.delete(id);
                error ? reject(error) : resolve(value);
            };
            this.activeCollectors.set(id, (line, raw) => {
                try {
                    const result = onLine(line, raw);
                    if (result?.done) finish(null, result.value);
                } catch (error) { finish(error); }
            });
            this.requestRejectors.set(id, error => finish(error));
            timer = setTimeout(() => finish(new Error('The device did not finish its response. Please retry.')), timeoutMs);
            this._sendCommand(command).catch(error => finish(error));
        });
    }

    // High-level commands
    async getDeviceInfo() {
        return this.responsePromise((resolve, reject, schedule) => {
            let info = {};
            let collecting = false;
            const collectorId = 'info_' + Date.now();

            const collector = (line) => {
                if (line.includes('=== Device Information ===')) {
                    collecting = true;
                } else if (collecting) {
                    if (line.includes('Chip Model:')) {
                        info.chipModel = line.split(':')[1].trim();
                    } else if (line.includes('Chip Revision:')) {
                        info.chipRevision = line.split(':')[1].trim();
                    } else if (line.includes('Flash Size:')) {
                        info.flashSize = line.split(':')[1].trim();
                    } else if (line.includes('Flash Speed:')) {
                        info.flashSpeed = line.split(':')[1].trim();
                    } else if (line.includes('MAC Address:')) {
                        info.macAddress = line.split(':').slice(1).join(':').trim();
                    } else if (line.includes('SDK Version:')) {
                        info.sdkVersion = line.split(':')[1].trim();
                    } else if (line.includes('WebScreen Version:')) {
                        info.firmwareVersion = line.split(':')[1].trim();
                        // Cache firmware version for capability detection
                        this.firmwareVersion = info.firmwareVersion;
                        this.supportsUploadCommand = this.checkUploadCommandSupport(info.firmwareVersion);
                    } else if (line.includes('Build Date:')) {
                        info.buildDate = line.split(':').slice(1).join(':').trim();
                        // Build Date is the last info line
                        this.activeCollectors.delete(collectorId);
                        resolve(info);
                    }
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/info').catch(reject);

            // Timeout after 5 seconds
            schedule(() => {
                this.activeCollectors.delete(collectorId);
                if (Object.keys(info).length > 0) {
                    resolve(info);
                } else {
                    resolve(null);
                }
            }, 5000);
        });
    }

    // Check if firmware version supports the /upload command
    // /upload command was added in firmware version 2.0.0
    checkUploadCommandSupport(version) {
        if (!version) return false;

        // Parse version string (e.g., "2.0.0" or "1.5.2")
        const major = parseInt(version.split('.')[0], 10) || 0;

        // /upload command is available from version 2.0.0 onwards
        return major >= 2;
    }

    // Fallback upload method for older firmware using /write command
    // Only works for .js files
    async uploadFileUsingWrite(filename, content, onProgress = null) {
        // Check for concurrent upload
        if (this.isUploading) {
            throw new Error('Another upload is in progress. Please wait.');
        }
        this.isUploading = true;

        try {
            // /write command only works for .js files
            const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
            if (ext !== '.js') {
                throw new Error(`Legacy firmware only supports .js files via /write command. Cannot upload ${ext} files. Please upgrade your WebScreen firmware to version 2.0.0 or later.`);
            }

            // Calculate total size for progress
            if (typeof content !== 'string' || content.split('\n').some(line => line.trim() === 'END')) throw new Error('This script needs the newer base64 upload protocol. Update your firmware.');
            const totalSize = content.length;
            let sentSize = 0;

            // Remove leading slash if present for the /write command
            let writeFilename = filename;
            if (writeFilename.startsWith('/')) {
                writeFilename = writeFilename.substring(1);
            }
            // Remove .js extension since /write adds it automatically
            if (writeFilename.endsWith('.js')) {
                writeFilename = writeFilename.substring(0, writeFilename.length - 3);
            }

            await this._sendCommand(`/write ${writeFilename}`);

            // Wait a bit for the command to be processed
            await new Promise(resolve => setTimeout(resolve, 200));

            // Send content line by line
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                await this._sendCommand(lines[i]);
                sentSize += lines[i].length + 1; // +1 for newline

                // Report progress
                if (onProgress) {
                    onProgress(sentSize, totalSize);
                }

                // Small delay between lines to avoid overwhelming the device
                await new Promise(resolve => setTimeout(resolve, 30));
            }

            // End file write and wait for the device's saved/failed line
            // (register the watcher before END so the result can't be missed)
            await new Promise(resolve => setTimeout(resolve, 100));
            const ack = this.waitForUploadResult('/' + writeFilename + '.js');

            // Final progress update
            if (onProgress) {
                onProgress(totalSize, totalSize);
            }

            await ack; // throws if the device reported an upload failure

            return true;
        } finally {
            this.isUploading = false;
        }
    }

    async getStats() {
        return this.responsePromise((resolve, reject, schedule) => {
            let stats = {};
            let collecting = false;
            let resolved = false;
            const collectorId = 'stats_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                // Start collecting on header
                if (line.includes('=== System Statistics ===')) {
                    collecting = true;
                    return;
                }

                if (collecting) {
                    if (line.includes('Free Heap:')) {
                        stats.freeHeap = line.split(':')[1].trim();
                    } else if (line.includes('Total Heap:')) {
                        stats.totalHeap = line.split(':')[1].trim();
                    } else if (line.includes('Free PSRAM:')) {
                        stats.freePSRAM = line.split(':')[1].trim();
                    } else if (line.includes('Total PSRAM:')) {
                        stats.totalPSRAM = line.split(':')[1].trim();
                    } else if (line.includes('SD Card Size:')) {
                        stats.sdCardSize = line.split(':')[1].trim();
                        stats.sdCard = 'Mounted';
                    } else if (line.includes('SD Card Used:')) {
                        stats.sdCardUsed = line.split(':')[1].trim();
                    } else if (line.includes('SD Card Free:')) {
                        stats.sdCardFree = line.split(':')[1].trim();
                    } else if (line.includes('SD Card:') && !line.includes('Size') && !line.includes('Used') && !line.includes('Free')) {
                        stats.sdCard = line.split(':')[1].trim();
                    } else if (line.includes('Signal Strength:')) {
                        stats.signalStrength = line.split(':')[1].trim();
                    } else if (line.includes('WiFi:')) {
                        stats.wifi = line.split(':')[1].trim();
                    } else if (line.includes('IP Address:')) {
                        stats.ip = line.split(':')[1].trim();
                    } else if (line.includes('Uptime:')) {
                        stats.uptime = line.split(':')[1].trim();
                    } else if (line.includes('CPU Frequency:')) {
                        stats.cpuFrequency = line.split(':')[1].trim();
                        // CPU Frequency is the last stat, finish collecting
                        resolved = true;
                        this.activeCollectors.delete(collectorId);
                        resolve(stats);
                    }
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/stats').catch(reject);

            // Timeout after 5 seconds
            schedule(() => {
                if (!resolved && this.activeCollectors.has(collectorId)) {
                    this.activeCollectors.delete(collectorId);
                    if (Object.keys(stats).length > 0) {
                        resolve(stats);
                    } else {
                        resolve(null);
                    }
                }
            }, 5000);
        });
    }

    async listFiles(path = '/') {
        // Fast path: newer firmware answers '/ls <path> json' with a single
        // machine-readable line. Falls back to legacy text parsing.
        const jsonResult = await this.listFilesJson(path);
        if (jsonResult !== null) return jsonResult;
        return this.listFilesLegacy(path);
    }

    async listFilesJson(path) {
        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'filesjson_' + Date.now();
            const finish = (value) => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                resolve(value);
            };

            const collector = (line) => {
                if (line.startsWith('{"path":')) {
                    try {
                        const obj = JSON.parse(line);
                        finish((obj.entries || []).map(e => ({
                            type: e.dir ? 'dir' : 'file',
                            name: e.name,
                            size: e.size || 0
                        })));
                    } catch (err) {
                        finish(null);
                    }
                } else if (line.includes('Cannot open directory') || line.includes('Unknown command')) {
                    // Old firmware treats '<path> json' as a literal path — fall back
                    finish(null);
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand(`/ls ${path} json`).catch(() => finish(null)).catch(reject);

            schedule(() => finish(null), 1500);
        });
    }

    async listFilesLegacy(path = '/') {
        return this.responsePromise((resolve, reject, schedule) => {
            const files = [];
            let headerSeen = false;
            let resolved = false;
            const collectorId = 'files_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                // Skip empty lines and prompts
                if (!line.trim() || line.includes('WebScreen>')) return;

                // Detect header lines (start of listing)
                if (line.includes('Directory listing') ||
                    line.includes('Contents of') ||
                    line.includes('Type') && line.includes('Size') && line.includes('Name')) {
                    headerSeen = true;
                    return;
                }

                // Skip separator lines (but don't treat as end marker)
                if (line.match(/^-+$/) || line.includes('--------------------------------')) {
                    return;
                }

                // End of listing markers - must be specific
                if (line.includes('Total:') && line.includes('files') ||
                    line.match(/^\d+\s+files?,\s+\d+\s+directories?/i) ||
                    line.includes('bytes free')) {
                    resolved = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(files);
                    return;
                }

                // Try to parse file entries with multiple patterns

                // Pattern 1: DIR                dirname or FILE    size     filename
                // Example: "DIR                System Volume Information"
                // Example: "FILE    121 B      blink.js"
                let match = line.match(/^(DIR|FILE)\s+(?:(\d+(?:\.\d+)?)\s*([BKBMBGB]+)\s+)?(.+)$/i);
                if (match) {
                    const type = match[1].toLowerCase() === 'dir' ? 'dir' : 'file';
                    const sizeNum = match[2] ? parseFloat(match[2]) : 0;
                    const sizeUnit = match[3] ? match[3].toUpperCase() : 'B';
                    const name = match[4].trim();

                    // Convert size to bytes
                    let sizeBytes = sizeNum;
                    if (sizeUnit === 'KB' || sizeUnit === 'K') sizeBytes = sizeNum * 1024;
                    else if (sizeUnit === 'MB' || sizeUnit === 'M') sizeBytes = sizeNum * 1024 * 1024;
                    else if (sizeUnit === 'GB' || sizeUnit === 'G') sizeBytes = sizeNum * 1024 * 1024 * 1024;

                    if (name && name.length > 0) {
                        files.push({
                            type: type,
                            name: name,
                            size: Math.round(sizeBytes)
                        });
                    }
                    return;
                }

                // Pattern 2: [FILE] filename (size bytes) or [DIR] dirname
                match = line.match(/\[(FILE|DIR)\]\s+(.+?)(?:\s+\((\d+)\s*bytes?\))?$/i);
                if (match) {
                    const name = match[2].trim();
                    if (name && !name.includes('listing') && !name.includes('===')) {
                        files.push({
                            type: match[1].toLowerCase(),
                            name: name,
                            size: match[3] ? parseInt(match[3]) : 0
                        });
                    }
                    return;
                }

                // Pattern 3: <DIR> dirname
                match = line.match(/^<(DIR)>\s+(.+)$/i);
                if (match) {
                    files.push({
                        type: 'dir',
                        name: match[2].trim(),
                        size: 0
                    });
                    return;
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand(`/ls ${path}`).catch(reject);

            // Timeout after 3 seconds - return whatever we have
            schedule(() => {
                if (!resolved && this.activeCollectors.has(collectorId)) {
                    this.activeCollectors.delete(collectorId);
                    resolve(files);
                }
            }, 3000);
        });
    }

    async uploadFile(filename, content, onProgress = null) {
        if (/\s|[\r\n]/.test(filename) || !filename || filename.length > 200) throw new Error('Use a filename without spaces, up to 200 characters.');
        const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
        if (this.supportsUploadCommand !== true && ext === '.js') {
            return this.uploadFileUsingWrite(filename, content, onProgress);
        }
        if (this.supportsUploadCommand === false) throw new Error('This upload requires WebScreen firmware 2.0 or newer.');
        const bytes = typeof content === 'string' ? new TextEncoder().encode(content) :
            ArrayBuffer.isView(content) ? new Uint8Array(content.buffer, content.byteOffset, content.byteLength) : new Uint8Array(content);
        this.isUploading = true;
        const errorId = Symbol('upload-error');
        let uploadError;
        this.activeCollectors.set(errorId, line => { if (line.startsWith('[ERROR]')) uploadError = new Error(line); });
        try {
            await this.request(`/upload ${filename} base64`, line => {
                if (line.startsWith('[ERROR]') || line.includes('Unknown command')) throw new Error(line);
                if (line === '---') return { done: true };
            });
            // The ready marker is printed just before the SD file is opened.
            await new Promise(resolve => setTimeout(resolve, 200));
            if (uploadError) throw uploadError;
            // Encode only one block at a time; text is transferred byte-for-byte.
            // 144 bytes become 192 base64 characters plus CRLF, below USB RX capacity.
            for (let offset = 0; offset < bytes.length; offset += 144) {
                if (uploadError) throw uploadError;
                const block = bytes.subarray(offset, offset + 144);
                await this._sendCommand(btoa(String.fromCharCode(...block)));
                onProgress?.(Math.min(offset + block.length, bytes.length), bytes.length);
                await new Promise(resolve => setTimeout(resolve, 20));
            }
            await this.waitForUploadResult(filename);
            onProgress?.(bytes.length, bytes.length);
            return true;
        } finally { this.activeCollectors.delete(errorId); this.isUploading = false; }
    }

    waitForUploadResult(filename = null, timeoutMs = 8000) {
        return this.request('END', line => {
            if (line.startsWith('[ERROR]')) throw new Error(line.replace('[ERROR]', '').trim());
            if (/^\[OK\] (File|Script) saved:/.test(line)) {
                const path = filename && (filename.startsWith('/') ? filename : '/' + filename);
                if (path && !line.includes(`saved: ${path} (`)) return;
                return { done: true, value: line };
            }
        }, timeoutMs);
    }

    async writeConfiguration(config) {
        const content = JSON.stringify(config, null, 2) + '\n';
        await this._uploadFile('/webscreen.json', content);
        const saved = await this._readFile('/webscreen.json');
        let parsed;
        try { parsed = JSON.parse(saved); } catch { throw new Error('The saved configuration could not be read back.'); }
        if (JSON.stringify(parsed) !== JSON.stringify(config)) throw new Error('The saved configuration differs from your changes. Please retry the save.');
        return true;
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async deleteFile(filename) {
        await this._sendCommand(`/rm ${filename}`);
        return true;
    }

    async readFile(filename) {
        if (!filename.startsWith('/')) filename = '/' + filename;
        if (/[\r\n]/.test(filename)) throw new Error('Invalid filename.');
        let collecting = false;
        const content = [];
        return this.request(`/cat ${filename}`, (line, raw) => {
            if (!collecting) {
                const header = line.replace(/^WebScreen>\s*/, '');
                if ([`--- ${filename} ---`, `Contents of ${filename}`, `Contents of ${filename}:`,
                    `Reading ${filename}`, `Reading ${filename}...`, `File: ${filename}`, '=== FILE START ==='].includes(header)) collecting = true;
                else if (header.startsWith('[ERROR]') || header.includes('Unknown command') || /^File not found\b/i.test(header)) throw new Error(header);
            } else if (line === '--- End of file ---' || line === '=== FILE END ===' || /^---\s*EOF\s*---$/i.test(line) || /^\d+\s+bytes?\s+read\.?$/i.test(line)) {
                return { done: true, value: content.join('\n') };
            } else {
                content.push(raw);
                if (content.length > 100000) throw new Error('File exceeds the text preview limit.');
            }
        }, 15000);
    }

    // Load/run an app. With save=true the firmware persists it as the
    // default script in webscreen.json (/load <file> save).
    async loadApp(filename, save = false) {
        await this._sendCommand(save ? `/load ${filename} save` : `/load ${filename}`);
        return true;
    }

    // Evaluate a JS snippet inside the running app (firmware /eval, max 255 chars).
    // Resolves with the result text (lines arrive prefixed "[EVAL] "), or throws
    // on a firmware-side error ([ERROR] ...).
    async evalJs(code) {
        code = code.trim();
        if (!code) throw new Error('Empty snippet');
        if (code.length > 255) throw new Error('Snippet longer than 255 chars');

        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'eval_' + Date.now();
            const finish = (fn, value) => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                fn(value);
            };

            const collector = (line) => {
                if (line.startsWith('[EVAL]')) {
                    finish(resolve, line.substring(6).trim());
                } else if (line.includes('[ERROR]')) {
                    finish(reject, new Error(line.replace('[ERROR]', '').trim()));
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand(`/eval ${code}`).catch(err => finish(reject, err)).catch(reject);

            // Eval runs at the JS task's next safe point; allow a generous window
            schedule(() => finish(reject, new Error('Eval timed out (no response)')), 5000);
        });
    }

    // Fetch the JS error report (firmware /errors). Resolves with a structured
    // object; null if the device did not answer.
    async getErrors() {
        return this.responsePromise((resolve, reject, schedule) => {
            const report = {};
            let collecting = false;
            let resolved = false;
            const collectorId = 'errors_' + Date.now();
            const finish = () => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                resolve(collecting ? report : null);
            };

            const collector = (line) => {
                if (resolved) return;
                if (line.includes('=== JS Error Report ===')) {
                    collecting = true;
                    return;
                }
                if (!collecting) return;

                if (line.startsWith('Last JS error')) {
                    // "Last JS error (12s ago): msg" or "Last JS error: none"
                    const m = line.match(/^Last JS error(?:\s*\((\d+)s ago\))?:\s*(.*)$/);
                    if (m) {
                        report.lastErrorAge = m[1] ? parseInt(m[1], 10) : null;
                        report.lastError = m[2] === 'none' ? null : m[2];
                    }
                } else if (line.startsWith('Startup error:')) {
                    report.startupError = line.substring(14).trim();
                } else if (line.startsWith('Restart failures:')) {
                    report.restartFailures = line.substring(17).trim();
                } else if (line.startsWith('Auto-restart cycles:')) {
                    report.autoRestartCycles = line.substring(20).trim();
                } else if (line.startsWith('Safe mode:')) {
                    report.safeMode = line.substring(10).trim().toUpperCase().startsWith('YES');
                } else if (line.startsWith('Script:')) {
                    // Last line of the report
                    report.script = line.substring(7).trim();
                    finish();
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/errors').catch(() => finish()).catch(reject);

            schedule(finish, 3000);
        });
    }

    // Request a JS garbage collection (firmware /gc). Resolves with the
    // status line text, or null on timeout.
    async runGC() {
        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'gc_' + Date.now();
            const finish = (value) => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                resolve(value);
            };

            const collector = (line) => {
                if (line.includes('GC requested')) {
                    finish(line.replace('[OK]', '').trim());
                } else if (line.includes('Garbage collection unavailable')) {
                    finish(line.replace('[ERROR]', '').trim());
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/gc').catch(() => finish(null)).catch(reject);

            schedule(() => finish(null), 3000);
        });
    }

    async getHelp() {
        return this.responsePromise((resolve, reject, schedule) => {
            let helpText = '';
            let collecting = false;
            const collectorId = 'help_' + Date.now();

            const collector = (line) => {
                // Start collecting when we see help header or command list
                if (line.includes('Available commands') || line.includes('Commands:') || line.includes('/help')) {
                    collecting = true;
                }

                if (collecting) {
                    helpText += line + '\n';
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/help').catch(reject);

            // Timeout after 3 seconds
            schedule(() => {
                this.activeCollectors.delete(collectorId);
                resolve(helpText);
            }, 3000);
        });
    }

    async reboot() {
        await this._sendCommand('/reboot');
        return true;
    }

    // Factory reset: newer firmware has /factory_reset (requires the literal
    // 'confirm' argument); older firmware gets an emulation — delete the
    // device config (webscreen.json) and reboot into fallback mode.
    async factoryReset() {
        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'freset_' + Date.now();
            const finish = (value) => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                resolve(value);
            };

            const collector = (line) => {
                if (line.includes('Configuration deleted')) {
                    finish(true);
                } else if (line.includes('Unknown command')) {
                    // Old firmware — emulate with /rm + /reboot
                    this._sendCommand('/rm /webscreen.json')
                        .then(() => new Promise(r => schedule(r, 500)))
                        .then(() => this._sendCommand('/reboot'))
                        .then(() => finish(true))
                        .catch(() => finish(false));
                } else if (line.includes('[ERROR]')) {
                    finish(false);
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/factory_reset confirm').catch(() => finish(false)).catch(reject);

            schedule(() => finish(false), 8000);
        });
    }

    // Create a directory on the SD card (firmware /mkdir)
    async makeDirectory(path) {
        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'mkdir_' + Date.now();
            const finish = (fn, value) => {
                if (resolved) return;
                resolved = true;
                this.activeCollectors.delete(collectorId);
                fn(value);
            };

            const collector = (line) => {
                if (line.includes('Directory created')) {
                    finish(resolve, true);
                } else if (line.includes('Unknown command')) {
                    finish(reject, new Error('Firmware does not support /mkdir — please update'));
                } else if (line.includes('[ERROR]')) {
                    finish(reject, new Error(line.replace('[ERROR]', '').trim()));
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand(`/mkdir ${path}`).catch(err => finish(reject, err)).catch(reject);

            schedule(() => finish(reject, new Error('No response to /mkdir')), 3000);
        });
    }

    // Download any file (text or binary) via the firmware's base64 /download
    // stream. Resolves with a Uint8Array, or null if unsupported/failed
    // (callers can fall back to the text-only /cat path).
    async downloadFileBase64(filename) {
        if (/[\r\n]/.test(filename)) throw new Error('Invalid filename.');
        let expected = null;
        const chunks = [];
        let size = 0;
        return this.request(`/download ${filename}`, line => {
            if (line.startsWith('[ERROR]') || line.includes('Unknown command')) return { done: true, value: null };
            const header = line.match(/^=== DOWNLOAD (.+) SIZE (\d+) ===$/);
            if (header && header[1] === (filename.startsWith('/') ? filename : '/' + filename)) {
                expected = Number(header[2]);
                if (expected > 32 * 1024 * 1024) throw new Error('File exceeds the 32 MB browser download limit.');
            } else if (line === '=== DOWNLOAD END ===' && expected !== null) {
                if (size !== expected) throw new Error('Download was incomplete. Please retry.');
                const bytes = new Uint8Array(size);
                let offset = 0;
                for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
                return { done: true, value: bytes };
            } else if (expected !== null && /^[A-Za-z0-9+/=]+$/.test(line)) {
                const binary = atob(line);
                const chunk = Uint8Array.from(binary, c => c.charCodeAt(0));
                size += chunk.length;
                if (size > expected) throw new Error('Download size did not match the file.');
                chunks.push(chunk);
            }
        }, 30000);
    }

    // Capture the device screen (firmware /screenshot). Resolves with
    // { width, height, swap, bytes } where bytes is raw RGB565 pixel data.
    async takeScreenshot() {
        let header = null;
        let bytes = null;
        let received = 0;
        let streamError = null;
        let padded = false;
        return this.request('/screenshot', line => {
            // The capture runs asynchronously, after the console's non-newline prompt.
            const response = line.replace(/^(?:WebScreen>\s*)+/, '');
            if (response.includes('Unknown command')) throw new Error('Firmware does not support /screenshot — please update');
            if (response.startsWith('[ERROR]')) throw new Error(response.slice(7).trim());
            const match = response.match(/^=== SCREENSHOT (\d+)x(\d+) (\S+) ===$/);
            if (match) {
                if (header) { streamError = new Error('Duplicate screenshot header.'); return; }
                header = {width:Number(match[1]), height:Number(match[2]), swap:match[3] === 'RGB565_SWAP'};
                const size = header.width * header.height * 2;
                if (!header.width || !header.height) streamError = new Error('Invalid screenshot dimensions.');
                else if (!Number.isSafeInteger(size) || size > 16 * 1024 * 1024) streamError = new Error('Screenshot exceeds the 16 MB capture limit.');
                else if (!['RGB565', 'RGB565_SWAP'].includes(match[3])) streamError = new Error('Unsupported screenshot pixel format.');
                else bytes = new Uint8Array(size);
                return;
            }
            if (response === '=== SCREENSHOT END ===') {
                if (!header) throw new Error('Screenshot header was not received.');
                if (streamError) throw streamError;
                if (received !== bytes.length) throw new Error(`Screenshot incomplete: received ${received} of ${bytes.length} bytes.`);
                return {done:true, value:{...header, bytes}};
            }
            // Retain the serial operation until END, even if a payload chunk is invalid.
            if (!header || streamError || !/^[A-Za-z0-9+/=]+$/.test(response)) return;
            try {
                if (padded || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(response)) {
                    throw new Error('Invalid screenshot base64 data.');
                }
                const chunk = atob(response);
                if (received + chunk.length > bytes.length) throw new Error('Screenshot data size exceeds its dimensions.');
                for (let i = 0; i < chunk.length; i++) bytes[received++] = chunk.charCodeAt(i);
                padded = response.endsWith('=');
            } catch (error) {
                streamError = error;
            }
        }, 30000);
    }

    async backup() {
        return this.responsePromise((resolve, reject, schedule) => {
            let backupData = '';
            let collecting = false;
            const collectorId = 'backup_' + Date.now();

            const collector = (line) => {
                if (line.includes('=== BACKUP START ===')) {
                    collecting = true;
                } else if (line.includes('=== BACKUP END ===')) {
                    this.activeCollectors.delete(collectorId);
                    resolve(backupData);
                } else if (collecting) {
                    backupData += line + '\n';
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand('/backup').catch(reject);

            // Timeout after 10 seconds
            schedule(() => {
                this.activeCollectors.delete(collectorId);
                resolve(backupData);
            }, 10000);
        });
    }

    async setConfig(key, value) {
        await this._sendCommand(`/config set ${key} ${value}`);
        return true;
    }

    async getConfig(key) {
        return this.responsePromise((resolve, reject, schedule) => {
            let resolved = false;
            const collectorId = 'config_' + key + '_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                // Try multiple patterns to match config value
                // Pattern 1: key = value
                if (line.includes(`${key} =`) || line.includes(`${key}=`)) {
                    const value = line.split('=')[1]?.trim();
                    if (value !== undefined) {
                        resolved = true;
                        this.activeCollectors.delete(collectorId);
                        resolve(value);
                        return;
                    }
                }

                // Pattern 2: key: value
                if (line.includes(`${key}:`) || line.toLowerCase().includes(`${key.toLowerCase()}:`)) {
                    const parts = line.split(':');
                    if (parts.length >= 2) {
                        const value = parts.slice(1).join(':').trim();
                        resolved = true;
                        this.activeCollectors.delete(collectorId);
                        resolve(value);
                        return;
                    }
                }

                // Error handling
                if (line.includes('not found') || line.includes('Error') || line.includes('unknown')) {
                    resolved = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this._sendCommand(`/config get ${key}`).catch(reject);

            // Timeout after 2 seconds
            schedule(() => {
                if (!resolved) {
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                }
            }, 2000);
        });
    }

    async connectWiFi(ssid, password) {
        await this._setConfig('settings.wifi.ssid', ssid);
        await this._setConfig('settings.wifi.pass', password);
        await this._sendCommand('/reboot');
        return true;
    }

    async setBrightness(value) {
        if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error('Brightness must be an integer from 0 to 255.');
        return this.request(`/brightness ${value}`, line => {
            const response = line.replace(/^WebScreen>\s*/, '');
            if (response.startsWith('[ERROR]') || response.includes('Unknown command')) throw new Error(response);
            if (response === `[OK] Brightness set to ${value}`) return { done: true, value: true };
        }, 3000);
    }

    async setOrientation(value) {
        await this._setConfig('display.orientation', value);
        return true;
    }

    async setTimeout(value) {
        await this._setConfig('display.timeout', value);
        return true;
    }

    // Sync device time
    // epoch: Unix timestamp in seconds
    // timezone: Optional POSIX TZ string (e.g., "EST5EDT,M3.2.0,M11.1.0" or "<-03>3")
    async syncTime(epoch, timezone = null) {
        return this.responsePromise((resolve, reject, schedule) => {
            let success = false;
            const collectorId = 'settime_' + Date.now();

            const collector = (line) => {
                if (line.includes('Time set successfully') || line.includes('Device time synchronized')) {
                    success = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(true);
                } else if (line.includes('[ERROR]') || line.includes('Failed')) {
                    this.activeCollectors.delete(collectorId);
                    resolve(false);
                }
            };

            this.activeCollectors.set(collectorId, collector);

            // Send command with optional timezone
            const cmd = timezone ? `/settime ${epoch} ${timezone}` : `/settime ${epoch}`;
            this._sendCommand(cmd).catch(reject);

            // Timeout after 3 seconds
            schedule(() => {
                if (!success) {
                    this.activeCollectors.delete(collectorId);
                    resolve(true); // Assume success if no error received
                }
            }, 3000);
        });
    }

    // Explain port failures without hiding the browser's underlying error.
    static connectionErrorMessage(error) {
        switch (error.name) {
            case 'NotFoundError':
                return 'No serial port selected. Click Connect Device and select your WebScreen.';
            case 'NetworkError':
                return 'Could not open the serial port. Close Arduino Serial Monitor/Plotter and any other serial tabs, then reconnect. If it still fails, check the USB cable and serial-port permissions.';
            case 'InvalidStateError':
                return 'The serial port is already open. Disconnect it or reload this page, then try again.';
            case 'SecurityError':
            case 'NotAllowedError':
                return 'Serial access was denied. Allow serial access for this site in your browser settings, then reconnect.';
            default:
                return `Could not connect: ${error.message || 'Check the USB connection and try again.'}`;
        }
    }

    // Check if Web Serial API is supported
    static isSupported() {
        return 'serial' in navigator;
    }
}

// Export for use
window.WebScreenSerial = WebScreenSerial;

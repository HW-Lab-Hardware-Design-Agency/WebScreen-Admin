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
        this.isUploading = false; // Lock to prevent concurrent uploads
    }

    // Connect to WebScreen device
    async connect() {
        try {
            // Request port access
            this.port = await navigator.serial.requestPort();

            // Open the port with WebScreen settings
            await this.port.open({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            });

            this.connected = true;
            this.writer = this.port.writable.getWriter();

            // Start reading
            this.readLoop();

            // Notify status change
            if (this.onStatusChange) {
                this.onStatusChange(true);
            }

            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            this.connected = false;
            if (this.onStatusChange) {
                this.onStatusChange(false);
            }
            throw error;
        }
    }

    // Disconnect from device
    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                await this.reader.releaseLock();
            }
            if (this.writer) {
                await this.writer.close();
                await this.writer.releaseLock();
            }
            if (this.port) {
                await this.port.close();
            }

            this.connected = false;
            this.port = null;
            this.reader = null;
            this.writer = null;

            if (this.onStatusChange) {
                this.onStatusChange(false);
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    // Read data from serial port
    async readLoop() {
        const decoder = new TextDecoder();
        this.reader = this.port.readable.getReader();

        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                this.buffer += text;

                // Process complete lines
                const lines = this.buffer.split('\n');
                this.buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.replace('\r', '').trim();
                    if (trimmedLine) {
                        this.processLine(trimmedLine);
                    }
                }
            }
        } catch (error) {
            console.error('Read error:', error);
        }
    }

    // Process received line
    processLine(line) {
        // Notify data received
        if (this.onDataReceived) {
            this.onDataReceived(line);
        }

        // Process active collectors (multi-line response handlers)
        for (const [id, collector] of this.activeCollectors) {
            collector(line);
        }

        // Check for one-time pattern callbacks
        for (const [pattern, callback] of this.callbacks) {
            if (line.includes(pattern)) {
                callback(line);
            }
        }
    }

    // Send command to device
    async sendCommand(command) {
        if (!this.connected || !this.writer) {
            throw new Error('Not connected');
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command + '\r\n');
            await this.writer.write(data);
            return true;
        } catch (error) {
            console.error('Send error:', error);
            throw error;
        }
    }

    // High-level commands
    async getDeviceInfo() {
        return new Promise((resolve) => {
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
            this.sendCommand('/info');

            // Timeout after 5 seconds
            setTimeout(() => {
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
        const parts = version.split('.').map(p => parseInt(p, 10));
        const major = parts[0] || 0;
        const minor = parts[1] || 0;
        const patch = parts[2] || 0;

        // /upload command is available from version 2.0.0 onwards
        if (major > 2) return true;
        if (major === 2 && (minor > 0 || patch >= 0)) return true;
        return false;
    }

    // Fallback upload method for older firmware using /write command
    // Only works for .js files
    async uploadFileUsingWrite(filename, content, onProgress = null) {
        // Check for concurrent upload
        if (this.isUploading) {
            throw new Error('Another upload is in progress. Please wait.');
        }
        this.isUploading = true;
        console.log('uploadFileUsingWrite: Using legacy /write command for', filename);

        try {
            // /write command only works for .js files
            const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
            if (ext !== '.js') {
                throw new Error(`Legacy firmware only supports .js files via /write command. Cannot upload ${ext} files. Please upgrade your WebScreen firmware to version 2.0.0 or later.`);
            }

            // Calculate total size for progress
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

            await this.sendCommand(`/write ${writeFilename}`);

            // Wait a bit for the command to be processed
            await new Promise(resolve => setTimeout(resolve, 200));

            // Send content line by line
            const lines = content.split('\n');
            console.log('uploadFileUsingWrite: Sending', lines.length, 'lines');

            for (let i = 0; i < lines.length; i++) {
                await this.sendCommand(lines[i]);
                sentSize += lines[i].length + 1; // +1 for newline

                // Report progress
                if (onProgress) {
                    onProgress(sentSize, totalSize);
                }

                // Small delay between lines to avoid overwhelming the device
                await new Promise(resolve => setTimeout(resolve, 30));
            }

            // End file write
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.sendCommand('END');

            // Final progress update
            if (onProgress) {
                onProgress(totalSize, totalSize);
            }

            // Wait for file to be finalized
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('uploadFileUsingWrite: Upload complete for', filename);
            return true;
        } finally {
            this.isUploading = false;
        }
    }

    async getStats() {
        return new Promise((resolve) => {
            let stats = {};
            let collecting = false;
            let resolved = false;
            const collectorId = 'stats_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                // Start collecting on header
                if (line.includes('=== System Statistics ===')) {
                    collecting = true;
                    console.log('getStats: Started collecting');
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
                        console.log('getStats: Found SD Card Size:', stats.sdCardSize);
                    } else if (line.includes('SD Card Used:')) {
                        stats.sdCardUsed = line.split(':')[1].trim();
                    } else if (line.includes('SD Card Free:')) {
                        stats.sdCardFree = line.split(':')[1].trim();
                    } else if (line.includes('SD Card:') && !line.includes('Size') && !line.includes('Used') && !line.includes('Free')) {
                        stats.sdCard = line.split(':')[1].trim();
                        console.log('getStats: Found SD Card status:', stats.sdCard);
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
                        console.log('getStats: Complete, stats:', stats);
                        resolved = true;
                        this.activeCollectors.delete(collectorId);
                        resolve(stats);
                    }
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand('/stats');
            console.log('getStats: Sent /stats command');

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!resolved && this.activeCollectors.has(collectorId)) {
                    console.log('getStats: Timeout, returning stats:', stats);
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
        return new Promise((resolve) => {
            const files = [];
            let headerSeen = false;
            let resolved = false;
            const collectorId = 'files_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                console.log('listFiles parsing line:', line);

                // Skip empty lines and prompts
                if (!line.trim() || line.includes('WebScreen>')) return;

                // Detect header lines (start of listing)
                if (line.includes('Directory listing') ||
                    line.includes('Contents of') ||
                    line.includes('Type') && line.includes('Size') && line.includes('Name')) {
                    headerSeen = true;
                    console.log('listFiles: Header detected');
                    return;
                }

                // Skip separator lines (but don't treat as end marker)
                if (line.match(/^-+$/) || line.includes('--------------------------------')) {
                    console.log('listFiles: Separator line, skipping');
                    return;
                }

                // End of listing markers - must be specific
                if (line.includes('Total:') && line.includes('files') ||
                    line.match(/^\d+\s+files?,\s+\d+\s+directories?/i) ||
                    line.includes('bytes free')) {
                    console.log('listFiles: End marker, found', files.length, 'files');
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
                        console.log('listFiles: Parsed DIR/FILE:', type, name, sizeBytes);
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
                        console.log('listFiles: Parsed [TYPE]:', name);
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
                    console.log('listFiles: Parsed <DIR>:', match[2]);
                    return;
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand(`/ls ${path}`);
            console.log('listFiles: Sent /ls command for', path);

            // Timeout after 3 seconds - return whatever we have
            setTimeout(() => {
                if (!resolved && this.activeCollectors.has(collectorId)) {
                    console.log('listFiles: Timeout, returning', files.length, 'files');
                    this.activeCollectors.delete(collectorId);
                    resolve(files);
                }
            }, 3000);
        });
    }

    async uploadFile(filename, content, onProgress = null) {
        console.log('uploadFile: Starting upload to', filename, '- content length:', content.length);

        // Check if we need to use legacy /write command for older firmware
        // supportsUploadCommand: true = firmware 2.0.0+, false = older firmware, null = unknown
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

        if (this.supportsUploadCommand === true) {
            // Firmware 2.0.0+ supports /upload command, proceed normally
            console.log('uploadFile: Using /upload command (firmware 2.0.0+)');
        } else if (this.supportsUploadCommand === false) {
            // Old firmware - use /write for .js files only
            if (ext === '.js') {
                console.log('uploadFile: Old firmware detected, using legacy /write method');
                return await this.uploadFileUsingWrite(filename, content, onProgress);
            } else {
                // Non-.js file on old firmware - not supported
                throw new Error(`Your WebScreen firmware (${this.firmwareVersion || 'unknown'}) does not support uploading ${ext} files. Please upgrade to firmware version 2.0.0 or later.`);
            }
        } else {
            // supportsUploadCommand is null (firmware version unknown)
            // Be conservative: use legacy /write for .js files
            if (ext === '.js') {
                console.log('uploadFile: Firmware version unknown, using legacy /write method for safety');
                return await this.uploadFileUsingWrite(filename, content, onProgress);
            }
            // For non-.js files with unknown firmware, try /upload but warn
            console.log('uploadFile: Firmware version unknown, attempting /upload command for', ext, 'file');
        }

        // Check for concurrent upload (for /upload command path)
        if (this.isUploading) {
            throw new Error('Another upload is in progress. Please wait.');
        }
        this.isUploading = true;

        try {
            // Determine if this is a text file or binary file
            const textExtensions = ['.js', '.json', '.txt', '.html', '.css', '.xml', '.csv', '.md'];
            const isTextFile = textExtensions.includes(ext);

            // Calculate total size for progress
            let totalSize = 0;
            let sentSize = 0;

            if (isTextFile) {
                // Text mode - send as plain text
                console.log('uploadFile: Using text mode for', ext);
                totalSize = content.length;

                await this.sendCommand(`/upload ${filename}`);

                // Wait a bit for the command to be processed
                await new Promise(resolve => setTimeout(resolve, 200));

                // Send content line by line
                const lines = content.split('\n');
                console.log('uploadFile: Sending', lines.length, 'lines');

                for (let i = 0; i < lines.length; i++) {
                    await this.sendCommand(lines[i]);
                    sentSize += lines[i].length + 1; // +1 for newline

                    // Report progress
                    if (onProgress) {
                        onProgress(sentSize, totalSize);
                    }

                    // Small delay between lines to avoid overwhelming the device
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            } else {
                // Binary mode - encode as base64
                console.log('uploadFile: Using base64 mode for', ext);

                // Get the actual binary size
                if (typeof content === 'string') {
                    totalSize = content.length;
                } else {
                    totalSize = content.byteLength;
                }

                await this.sendCommand(`/upload ${filename} base64`);

                // Wait a bit for the command to be processed
                await new Promise(resolve => setTimeout(resolve, 200));

                // Convert content to base64
                let base64Content;
                if (typeof content === 'string') {
                    base64Content = btoa(unescape(encodeURIComponent(content)));
                } else {
                    base64Content = this.arrayBufferToBase64(content);
                }

                // Send base64 in chunks (76 chars per line is standard)
                const chunkSize = 76;
                const totalChunks = Math.ceil(base64Content.length / chunkSize);
                console.log('uploadFile: Sending', totalChunks, 'base64 chunks');

                // Calculate bytes per chunk (base64 decodes to 3/4 of original size)
                const bytesPerChunk = Math.ceil(chunkSize * 3 / 4);

                for (let i = 0; i < base64Content.length; i += chunkSize) {
                    const chunk = base64Content.substring(i, i + chunkSize);
                    await this.sendCommand(chunk);

                    // Calculate approximate bytes sent
                    sentSize = Math.min(Math.floor((i + chunkSize) * 3 / 4), totalSize);

                    // Report progress
                    if (onProgress) {
                        onProgress(sentSize, totalSize);
                    }

                    // Small delay between chunks
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
            }

            // End file write
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.sendCommand('END');

            // Final progress update
            if (onProgress) {
                onProgress(totalSize, totalSize);
            }

            // Wait for file to be finalized
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('uploadFile: Upload complete for', filename);
            return true;
        } finally {
            this.isUploading = false;
        }
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
        await this.sendCommand(`/rm ${filename}`);
        return true;
    }

    async readFile(filename) {
        return new Promise((resolve) => {
            let content = '';
            let collecting = false;
            let endDetected = false;
            const collectorId = 'cat_' + Date.now();

            console.log('readFile: Reading', filename);

            const collector = (line) => {
                if (endDetected) return;

                console.log('readFile parsing line:', line.substring(0, 100), 'collecting:', collecting);

                // Skip prompts
                if (line.includes('WebScreen>') && !line.includes(filename)) {
                    return;
                }

                // Start collecting after we see the filename header
                // Pattern: "--- /webscreen.json ---" or "Contents of /webscreen.json"
                if (line.includes(`--- ${filename}`) ||
                    line.includes(`Contents of ${filename}`) ||
                    line.includes('=== FILE START ===') ||
                    line.includes(`Reading ${filename}`) ||
                    line.includes(`File: ${filename}`)) {
                    collecting = true;
                    console.log('readFile: Started collecting content');
                    return;
                }

                // End of file marker
                if (line.includes('--- End of file ---') ||
                    line.includes('=== FILE END ===') ||
                    (line.includes('---') && line.includes('EOF')) ||
                    (collecting && line.match(/^\d+\s+bytes?\s+read/i))) {
                    endDetected = true;
                    console.log('readFile: End detected, content length:', content.length);
                    this.activeCollectors.delete(collectorId);
                    resolve(content.trim());
                    return;
                }

                // Error handling
                if (line.includes('[ERROR]') || line.includes('File not found') || line.includes('not found')) {
                    console.log('readFile: Error or file not found');
                    endDetected = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                    return;
                }

                // Collect content lines
                if (collecting) {
                    content += line + '\n';
                    console.log('readFile: Added line, content now:', content.length, 'chars');
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand(`/cat ${filename}`);

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!endDetected && this.activeCollectors.has(collectorId)) {
                    console.log('readFile: Timeout, collected', content.length, 'chars');
                    this.activeCollectors.delete(collectorId);
                    // Return what we have if we collected something
                    if (content.trim()) {
                        resolve(content.trim());
                    } else {
                        resolve(null);
                    }
                }
            }, 5000);
        });
    }

    async loadApp(filename) {
        await this.sendCommand(`/load ${filename}`);
        return true;
    }

    async getHelp() {
        return new Promise((resolve) => {
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
            this.sendCommand('/help');

            // Timeout after 3 seconds
            setTimeout(() => {
                this.activeCollectors.delete(collectorId);
                console.log('getHelp output:', helpText);
                resolve(helpText);
            }, 3000);
        });
    }

    async reboot() {
        await this.sendCommand('/reboot');
        return true;
    }

    async factoryReset() {
        await this.sendCommand('/factory_reset');
        return true;
    }

    async backup() {
        return new Promise((resolve) => {
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
            this.sendCommand('/backup');

            // Timeout after 10 seconds
            setTimeout(() => {
                this.activeCollectors.delete(collectorId);
                resolve(backupData);
            }, 10000);
        });
    }

    async setConfig(key, value) {
        await this.sendCommand(`/config set ${key} ${value}`);
        return true;
    }

    async getConfig(key) {
        return new Promise((resolve) => {
            let resolved = false;
            const collectorId = 'config_' + key + '_' + Date.now();

            const collector = (line) => {
                if (resolved) return;

                console.log('getConfig parsing line for', key + ':', line);

                // Try multiple patterns to match config value
                // Pattern 1: key = value
                if (line.includes(`${key} =`) || line.includes(`${key}=`)) {
                    const value = line.split('=')[1]?.trim();
                    if (value !== undefined) {
                        console.log('getConfig: Found', key, '=', value);
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
                        console.log('getConfig: Found', key, ':', value);
                        resolved = true;
                        this.activeCollectors.delete(collectorId);
                        resolve(value);
                        return;
                    }
                }

                // Pattern 3: Just the value on its own line after the key
                // (for simple responses like "MySSID")
                if (line.trim() && !line.includes('config') && !line.includes('Error') &&
                    !line.includes('=') && !line.includes(':') && line.trim().length < 100) {
                    // This might be just the value
                    console.log('getConfig: Possible value for', key, ':', line.trim());
                }

                // Error handling
                if (line.includes('not found') || line.includes('Error') || line.includes('unknown')) {
                    console.log('getConfig: Not found or error for', key);
                    resolved = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand(`/config get ${key}`);
            console.log('getConfig: Sent /config get', key);

            // Timeout after 2 seconds
            setTimeout(() => {
                if (!resolved) {
                    console.log('getConfig: Timeout for', key);
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                }
            }, 2000);
        });
    }

    async connectWiFi(ssid, password) {
        await this.setConfig('wifi.ssid', ssid);
        await this.setConfig('wifi.password', password);
        await this.sendCommand('/reboot');
        return true;
    }

    async setBrightness(value) {
        await this.setConfig('display.brightness', value);
        return true;
    }

    async setOrientation(value) {
        await this.setConfig('display.orientation', value);
        return true;
    }

    async setTimeout(value) {
        await this.setConfig('display.timeout', value);
        return true;
    }

    // Sync device time
    // epoch: Unix timestamp in seconds
    // timezone: Optional timezone string (e.g., "America/New_York" or "UTC0")
    async syncTime(epoch, timezone = null) {
        return new Promise((resolve) => {
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
            this.sendCommand(cmd);
            console.log('syncTime: Sent', cmd);

            // Timeout after 3 seconds
            setTimeout(() => {
                if (!success) {
                    this.activeCollectors.delete(collectorId);
                    resolve(true); // Assume success if no error received
                }
            }, 3000);
        });
    }

    // Helper to parse device info
    parseDeviceInfo(line) {
        const info = {};
        const parts = line.split(',');
        parts.forEach(part => {
            const [key, value] = part.split(':').map(s => s.trim());
            info[key] = value;
        });
        return info;
    }

    // Check if Web Serial API is supported
    static isSupported() {
        return 'serial' in navigator;
    }
}

// Export for use
window.WebScreenSerial = WebScreenSerial;
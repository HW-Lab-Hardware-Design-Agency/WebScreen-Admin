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

    async getStats() {
        return new Promise((resolve) => {
            let stats = {};
            let collecting = false;
            const collectorId = 'stats_' + Date.now();

            const collector = (line) => {
                if (line.includes('=== System Statistics ===')) {
                    collecting = true;
                } else if (collecting) {
                    if (line.includes('Free Heap:')) {
                        stats.freeHeap = line.split(':')[1].trim();
                    } else if (line.includes('Total Heap:')) {
                        stats.totalHeap = line.split(':')[1].trim();
                    } else if (line.includes('Free PSRAM:')) {
                        stats.freePSRAM = line.split(':')[1].trim();
                    } else if (line.includes('Total PSRAM:')) {
                        stats.totalPSRAM = line.split(':')[1].trim();
                    } else if (line.includes('SD Card:')) {
                        stats.sdCard = line.split(':')[1].trim();
                    } else if (line.includes('WiFi:')) {
                        stats.wifi = line.split(':')[1].trim();
                    } else if (line.includes('IP Address:')) {
                        stats.ip = line.split(':')[1].trim();
                    } else if (line.includes('Uptime:')) {
                        stats.uptime = line.split(':')[1].trim();
                    } else if (line.includes('CPU Frequency:')) {
                        stats.cpuFrequency = line.split(':')[1].trim();
                        // CPU Frequency is the last stat, finish collecting
                        this.activeCollectors.delete(collectorId);
                        resolve(stats);
                    }
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand('/stats');

            // Timeout after 5 seconds
            setTimeout(() => {
                this.activeCollectors.delete(collectorId);
                if (Object.keys(stats).length > 0) {
                    resolve(stats);
                } else {
                    resolve(null);
                }
            }, 5000);
        });
    }

    async listFiles(path = '/') {
        return new Promise((resolve) => {
            const files = [];
            let collecting = false;
            const collectorId = 'files_' + Date.now();

            const collector = (line) => {
                if (line.includes('Directory listing')) {
                    collecting = true;
                } else if (collecting && line.startsWith('[')) {
                    // Parse file entry: [FILE] filename (size bytes)
                    const match = line.match(/\[(FILE|DIR)\]\s+(.+?)(?:\s+\((\d+)\s+bytes\))?$/);
                    if (match) {
                        files.push({
                            type: match[1].toLowerCase(),
                            name: match[2],
                            size: match[3] ? parseInt(match[3]) : 0
                        });
                    }
                } else if (collecting && line.includes('Total:')) {
                    this.activeCollectors.delete(collectorId);
                    resolve(files);
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand(`/ls ${path}`);

            // Timeout after 5 seconds
            setTimeout(() => {
                this.activeCollectors.delete(collectorId);
                resolve(files);
            }, 5000);
        });
    }

    async uploadFile(filename, content) {
        // Start file write
        await this.sendCommand(`/write ${filename}`);

        // Wait a bit for the command to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Send content line by line
        const lines = content.split('\n');
        for (const line of lines) {
            await this.sendCommand(line);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // End file write
        await this.sendCommand('END');

        return true;
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

            const collector = (line) => {
                // Start collecting after we see the filename echoed or content starts
                if (line.includes(`Contents of ${filename}`) || line.includes('=== FILE START ===')) {
                    collecting = true;
                    return;
                }

                // End of file marker
                if (line.includes('=== FILE END ===') || line.includes('--- End of file ---')) {
                    endDetected = true;
                    this.activeCollectors.delete(collectorId);
                    resolve(content.trim());
                    return;
                }

                // Error handling
                if (line.includes('Error:') || line.includes('File not found')) {
                    this.activeCollectors.delete(collectorId);
                    resolve(null);
                    return;
                }

                // Collect content lines
                if (collecting && !endDetected) {
                    content += line + '\n';
                }
            };

            this.activeCollectors.set(collectorId, collector);
            this.sendCommand(`/cat ${filename}`);

            // Timeout after 5 seconds
            setTimeout(() => {
                this.activeCollectors.delete(collectorId);
                // Return what we have if we collected something
                if (content.trim()) {
                    resolve(content.trim());
                } else {
                    resolve(null);
                }
            }, 5000);
        });
    }

    async loadApp(filename) {
        await this.sendCommand(`/load ${filename}`);
        return true;
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
            const callback = (line) => {
                if (line.includes(`${key} =`)) {
                    const value = line.split('=')[1].trim();
                    this.callbacks.delete(key);
                    resolve(value);
                }
            };

            this.callbacks.set(key, callback);
            this.sendCommand(`/config get ${key}`);

            // Timeout after 3 seconds
            setTimeout(() => {
                this.callbacks.delete(key);
                resolve(null);
            }, 3000);
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
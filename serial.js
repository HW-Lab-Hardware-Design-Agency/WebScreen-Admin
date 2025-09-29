// WebScreen Serial Manager for Admin UI
class WebScreenSerial {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.connected = false;
        this.buffer = '';
        this.callbacks = new Map();
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

                const text = decoder.decode(value);
                this.buffer += text;

                // Process complete lines
                const lines = this.buffer.split('\n');
                this.buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        this.processLine(line.trim());
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

        // Check for callbacks
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
            const callback = (line) => {
                if (line.includes('Device:')) {
                    const info = this.parseDeviceInfo(line);
                    this.callbacks.delete('Device:');
                    resolve(info);
                }
            };
            this.callbacks.set('Device:', callback);
            this.sendCommand('/info');

            // Timeout after 5 seconds
            setTimeout(() => {
                this.callbacks.delete('Device:');
                resolve(null);
            }, 5000);
        });
    }

    async getStats() {
        return new Promise((resolve) => {
            let stats = {};
            let collecting = false;

            const callback = (line) => {
                if (line.includes('=== System Statistics ===')) {
                    collecting = true;
                } else if (collecting) {
                    if (line.includes('Free Heap:')) {
                        stats.freeHeap = line.split(':')[1].trim();
                    } else if (line.includes('Total Heap:')) {
                        stats.totalHeap = line.split(':')[1].trim();
                    } else if (line.includes('Free PSRAM:')) {
                        stats.freePSRAM = line.split(':')[1].trim();
                    } else if (line.includes('SD Card Size:')) {
                        stats.sdSize = line.split(':')[1].trim();
                    } else if (line.includes('SD Card Free:')) {
                        stats.sdFree = line.split(':')[1].trim();
                    } else if (line.includes('WiFi:')) {
                        stats.wifi = line.split(':')[1].trim();
                    } else if (line.includes('IP Address:')) {
                        stats.ip = line.split(':')[1].trim();
                        // This is typically the last stat
                        this.callbacks.delete('=== System Statistics ===');
                        resolve(stats);
                        collecting = false;
                    }
                }
            };

            this.callbacks.set('=== System Statistics ===', callback);
            this.sendCommand('/stats');

            // Timeout after 5 seconds
            setTimeout(() => {
                this.callbacks.delete('=== System Statistics ===');
                resolve(stats);
            }, 5000);
        });
    }

    async listFiles(path = '/') {
        return new Promise((resolve) => {
            const files = [];
            let collecting = false;

            const callback = (line) => {
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
                    this.callbacks.delete('Directory listing');
                    resolve(files);
                    collecting = false;
                }
            };

            this.callbacks.set('Directory listing', callback);
            this.sendCommand(`/ls ${path}`);

            // Timeout after 5 seconds
            setTimeout(() => {
                this.callbacks.delete('Directory listing');
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

            const callback = (line) => {
                if (line.includes('=== BACKUP START ===')) {
                    collecting = true;
                } else if (line.includes('=== BACKUP END ===')) {
                    this.callbacks.delete('=== BACKUP');
                    resolve(backupData);
                    collecting = false;
                } else if (collecting) {
                    backupData += line + '\n';
                }
            };

            this.callbacks.set('=== BACKUP', callback);
            this.sendCommand('/backup');

            // Timeout after 10 seconds
            setTimeout(() => {
                this.callbacks.delete('=== BACKUP');
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
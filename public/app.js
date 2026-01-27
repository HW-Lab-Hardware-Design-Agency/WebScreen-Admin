// WebScreen Admin UI Application
class WebScreenAdmin {
    constructor() {
        this.serial = new WebScreenSerial();
        this.currentSection = 'dashboard';
        this.availableApps = [];
        this.installedApps = [];
        this.currentPath = '/';
        this.files = [];
        this.sdCardAvailable = false;
        this.currentConfig = null;

        // Sections that require SD card
        this.sdRequiredSections = ['files', 'config'];

        // Terminal
        this.terminal = null;
        this.fitAddon = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';

        // Loading overlay state
        this.waitingForScriptExecution = false;
        this.scriptExecutionTimeout = null;

        // Bind serial callbacks
        this.serial.onStatusChange = (connected) => this.handleConnectionChange(connected);
        this.serial.onDataReceived = (data) => this.handleSerialData(data);

        this.init();
    }

    async init() {
        // Check Web Serial API support
        if (!WebScreenSerial.isSupported()) {
            this.showToast('Web Serial API not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
            return;
        }

        // Initialize theme
        this.setupTheme();

        // Initialize terminal
        this.initTerminal();

        // Setup event listeners
        this.setupEventListeners();

        // Load apps from embedded configuration
        this.loadAppsFromConfig();

        // Initialize sections
        this.initializeSections();
    }

    setupTheme() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('webscreen-admin-theme') || 'light';
        this.currentTheme = savedTheme;

        // Apply theme
        this.applyTheme(savedTheme);

        // Setup theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'light' ? 'eva' : 'light';
                this.applyTheme(newTheme);
                localStorage.setItem('webscreen-admin-theme', newTheme);
            });
        }
    }

    applyTheme(theme) {
        this.currentTheme = theme;

        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle?.querySelector('i');
        const label = themeToggle?.querySelector('.theme-label');

        if (theme === 'eva') {
            document.documentElement.setAttribute('data-theme', 'eva');
            if (icon) {
                icon.className = 'fas fa-robot';
            }
            if (label) {
                label.textContent = 'EVA';
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
            if (label) {
                label.textContent = 'Light';
            }
        }
    }

    initTerminal() {
        // Create terminal with custom theme
        this.terminal = new Terminal({
            theme: {
                background: '#0d1117',
                foreground: '#c9d1d9',
                cursor: '#58a6ff',
                cursorAccent: '#0d1117',
                selectionBackground: '#264f78',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc'
            },
            fontFamily: '"Cascadia Code", "Fira Code", Menlo, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            scrollback: 1000,
            convertEol: true
        });

        // Fit addon to auto-resize terminal
        this.fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(this.fitAddon);

        // Open terminal in container
        const terminalContainer = document.getElementById('terminal');
        if (terminalContainer) {
            this.terminal.open(terminalContainer);

            // Delay fit to allow CSS padding to be applied
            setTimeout(() => {
                this.fitAddon.fit();
            }, 50);

            // Handle window resize
            window.addEventListener('resize', () => {
                setTimeout(() => this.fitAddon.fit(), 10);
            });

            // Write welcome message
            this.writeToTerminal('\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m\r\n');
            this.writeToTerminal('\x1b[1;36m║\x1b[0m   \x1b[1;37mWebScreen Serial Console\x1b[0m          \x1b[1;36m║\x1b[0m\r\n');
            this.writeToTerminal('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m\r\n\r\n');
            this.writeToTerminal('\x1b[33mConnect to a device to start...\x1b[0m\r\n\r\n');

            // Handle terminal input
            this.terminal.onData((data) => this.handleTerminalInput(data));
        }
    }

    handleTerminalInput(data) {
        if (!this.serial.connected) {
            return;
        }

        // Handle special keys
        switch (data) {
            case '\r': // Enter
                this.terminal.write('\r\n');
                if (this.currentInput.trim()) {
                    this.commandHistory.push(this.currentInput);
                    this.historyIndex = this.commandHistory.length;
                    this.sendTerminalCommand(this.currentInput);
                }
                this.currentInput = '';
                this.writePrompt();
                break;

            case '\x7f': // Backspace
                if (this.currentInput.length > 0) {
                    this.currentInput = this.currentInput.slice(0, -1);
                    this.terminal.write('\b \b');
                }
                break;

            case '\x1b[A': // Up arrow
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.replaceInput(this.commandHistory[this.historyIndex]);
                }
                break;

            case '\x1b[B': // Down arrow
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.replaceInput(this.commandHistory[this.historyIndex]);
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.replaceInput('');
                }
                break;

            case '\x03': // Ctrl+C
                this.terminal.write('^C\r\n');
                this.currentInput = '';
                this.writePrompt();
                break;

            default:
                // Regular character input
                if (data >= ' ' || data === '\t') {
                    this.currentInput += data;
                    this.terminal.write(data);
                }
        }
    }

    replaceInput(newInput) {
        // Clear current input from terminal
        const clearLength = this.currentInput.length;
        this.terminal.write('\b'.repeat(clearLength) + ' '.repeat(clearLength) + '\b'.repeat(clearLength));
        // Write new input
        this.currentInput = newInput;
        this.terminal.write(newInput);
    }

    writePrompt() {
        this.terminal.write('\x1b[1;32mWebScreen\x1b[0m\x1b[1;37m>\x1b[0m ');
    }

    writeToTerminal(text) {
        if (this.terminal) {
            this.terminal.write(text);
        }
    }

    async sendTerminalCommand(command) {
        try {
            await this.serial.sendCommand(command);
        } catch (error) {
            this.writeToTerminal(`\x1b[31mError: ${error.message}\x1b[0m\r\n`);
        }
    }

    setupEventListeners() {
        // Connection button
        document.getElementById('connectBtn').addEventListener('click', () => this.toggleConnection());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;

                // Check if section requires SD card
                if (this.sdRequiredSections.includes(section) && !this.sdCardAvailable) {
                    this.showToast('SD card required for this section', 'warning');
                    return;
                }

                this.switchSection(section);
            });
        });

        // Dashboard actions
        document.getElementById('rebootBtn')?.addEventListener('click', () => this.rebootDevice());
        document.getElementById('backupBtn')?.addEventListener('click', () => this.backupConfig());
        document.getElementById('factoryResetBtn')?.addEventListener('click', () => this.factoryReset());
        document.getElementById('refreshInfoBtn')?.addEventListener('click', () => this.refreshDeviceInfo());

        // Serial Console
        document.getElementById('clearConsoleBtn')?.addEventListener('click', () => this.clearTerminal());

        // Marketplace
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterApps(btn.dataset.category);
            });
        });

        document.getElementById('appSearch')?.addEventListener('input', (e) => {
            this.searchApps(e.target.value);
        });

        // File Manager
        this.setupFileManager();

        // Settings
        document.getElementById('saveSystemBtn')?.addEventListener('click', () => this.saveSystemSettings());
        document.getElementById('reloadConfigBtn')?.addEventListener('click', () => this.reloadConfig());

        // Brightness slider
        document.getElementById('displayBrightness')?.addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value;
        });

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelInstallBtn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('installAppBtn')?.addEventListener('click', () => this.installApp());
    }

    setupFileManager() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        // File upload
        uploadBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Drag and drop
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleFileUpload(e.dataTransfer.files);
            });
        }

        // File actions
        document.getElementById('newFolderBtn')?.addEventListener('click', () => this.createNewFolder());
        document.getElementById('refreshFilesBtn')?.addEventListener('click', () => this.refreshFiles());
    }

    async toggleConnection() {
        if (this.serial.connected) {
            await this.serial.disconnect();
        } else {
            try {
                await this.serial.connect();
                // Give device time to initialize after connection
                this.showToast('Connected! Loading device info...', 'info');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.loadDeviceInfo();
            } catch (error) {
                this.showToast('Failed to connect to device', 'error');
            }
        }
    }

    handleConnectionChange(connected) {
        const btn = document.getElementById('connectBtn');
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (connected) {
            btn.innerHTML = '<i class="fas fa-plug-circle-xmark"></i> Disconnect';
            indicator.classList.add('connected');
            statusText.textContent = 'Connected';
            this.showToast('Connected to WebScreen', 'success');

            // Show connected message in terminal
            this.writeToTerminal('\x1b[1;32m✓ Connected to WebScreen\x1b[0m\r\n');
            this.writeToTerminal('\x1b[90mType /help for available commands\x1b[0m\r\n\r\n');
            this.writePrompt();
        } else {
            btn.innerHTML = '<i class="fas fa-plug"></i> Connect Device';
            indicator.classList.remove('connected');
            statusText.textContent = 'Disconnected';

            // Reset SD card status when disconnected
            this.sdCardAvailable = false;
            this.updateSDCardDependentSections();

            // Show disconnected message in terminal
            this.writeToTerminal('\r\n\x1b[1;31m✗ Disconnected\x1b[0m\r\n');
            this.writeToTerminal('\x1b[33mConnect to a device to continue...\x1b[0m\r\n\r\n');

            // Reset terminal input state
            this.currentInput = '';
            this.historyIndex = this.commandHistory.length;
        }

        // Enable/disable controls based on connection
        this.updateControlsState(connected);
    }

    handleSerialData(data) {
        console.log('Serial data:', data);
        // Display in terminal - handle multiline data properly
        if (this.terminal) {
            // Convert newlines and write to terminal
            const formattedData = data.replace(/\n/g, '\r\n');
            this.terminal.write(formattedData + '\r\n');
        }

        // Check if we're waiting for script execution
        if (this.waitingForScriptExecution) {
            // Look for success messages from the device
            // The firmware may output various messages when script starts/completes
            const successPatterns = [
                'JavaScript script executed successfully',
                'Script executed successfully',
                'Starting JavaScript execution',
                'JavaScript execution',
                'script executed',
                'Elk JS',
                'JS execution complete'
            ];

            const lowerData = data.toLowerCase();
            const matched = successPatterns.some(pattern =>
                lowerData.includes(pattern.toLowerCase())
            );

            if (matched) {
                console.log('Script execution detected, hiding loading modal');
                this.hideLoadingModal();
            }
        }
    }

    clearTerminal() {
        if (this.terminal) {
            this.terminal.clear();
            this.writeToTerminal('\x1b[2J\x1b[H'); // Clear screen and move cursor home
            this.writeToTerminal('\x1b[90mConsole cleared\x1b[0m\r\n\r\n');
            if (this.serial.connected) {
                this.writePrompt();
            }
        }
    }

    updateControlsState(enabled) {
        // Update all interactive elements based on connection state
        const controls = document.querySelectorAll('.action-btn, .form-control, .btn-primary:not(#connectBtn)');
        controls.forEach(control => {
            control.disabled = !enabled;
        });
    }

    async loadDeviceInfo() {
        try {
            // Send a blank line first to wake up the device/clear any pending input
            await this.serial.sendCommand('');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get device information (chip model, firmware version, etc.)
            const info = await this.serial.getDeviceInfo();
            if (info) {
                document.getElementById('deviceModel').textContent = info.chipModel || '-';
                document.getElementById('deviceRevision').textContent = info.chipRevision || '-';
                document.getElementById('deviceVersion').textContent = info.firmwareVersion || '-';
                document.getElementById('deviceSDK').textContent = info.sdkVersion || '-';
                document.getElementById('deviceFlashSize').textContent = info.flashSize || '-';
                document.getElementById('deviceFlashSpeed').textContent = info.flashSpeed || '-';
                document.getElementById('deviceMAC').textContent = info.macAddress || '-';
                document.getElementById('deviceBuildDate').textContent = info.buildDate || '-';
            }

            // Get system statistics (memory, storage, WiFi, etc.)
            const stats = await this.serial.getStats();
            if (stats) {
                document.getElementById('deviceMemory').textContent = stats.freeHeap || '-';
                document.getElementById('deviceTotalHeap').textContent = stats.totalHeap || '-';
                document.getElementById('deviceFreePSRAM').textContent = stats.freePSRAM || '-';
                document.getElementById('deviceTotalPSRAM').textContent = stats.totalPSRAM || '-';
                // Show SD card info: either size details or status
                if (stats.sdCardSize) {
                    document.getElementById('deviceStorage').textContent =
                        `${stats.sdCardUsed || '?'} / ${stats.sdCardSize}`;
                } else {
                    document.getElementById('deviceStorage').textContent = stats.sdCard || '-';
                }
                document.getElementById('deviceCPU').textContent = stats.cpuFrequency || '-';
                document.getElementById('deviceWifi').textContent = stats.wifi || '-';
                document.getElementById('deviceIP').textContent = stats.ip || '-';
                document.getElementById('deviceUptime').textContent = stats.uptime || '-';

                // Also update Network Status section
                const netStatus = document.getElementById('netStatus');
                const netIP = document.getElementById('netIP');
                const netSignal = document.getElementById('netSignal');
                const netMAC = document.getElementById('netMAC');

                if (netStatus) netStatus.textContent = stats.wifi || 'Not Connected';
                if (netIP) netIP.textContent = stats.ip || '-';
                if (netSignal) netSignal.textContent = stats.signalStrength || '-';
                if (netMAC && info) netMAC.textContent = info.macAddress || '-';

                // Check SD card availability - if we have sdCardSize, it's definitely mounted
                this.sdCardAvailable = !!(stats.sdCardSize ||
                    (stats.sdCard && !stats.sdCard.toLowerCase().includes('not mounted') &&
                     !stats.sdCard.toLowerCase().includes('not detected')));
                console.log('SD Card available:', this.sdCardAvailable, 'sdCardSize:', stats.sdCardSize, 'sdCard:', stats.sdCard);
                this.updateSDCardDependentSections();
            }

            // Load files and config only if SD card is available
            if (this.sdCardAvailable) {
                await this.refreshFiles();
                // Load current webscreen.json config and populate form fields
                await this.loadCurrentConfig();
                // Populate auto-start dropdown with installed apps
                await this.populateAutoStartDropdown();
            }
        } catch (error) {
            console.error('Failed to load device info:', error);
        }
    }

    // Populate auto-start dropdown with JS files from SD card
    async populateAutoStartDropdown() {
        const autoStartSelect = document.getElementById('autoStart');
        if (!autoStartSelect) return;

        // Keep the "None" option
        const noneOption = autoStartSelect.querySelector('option[value=""]');
        autoStartSelect.innerHTML = '';
        if (noneOption) {
            autoStartSelect.appendChild(noneOption);
        } else {
            const none = document.createElement('option');
            none.value = '';
            none.textContent = 'None';
            autoStartSelect.appendChild(none);
        }

        // Add JS files from the file list
        for (const file of this.files) {
            if (file.type === 'file' && file.name.endsWith('.js')) {
                const option = document.createElement('option');
                option.value = file.name;
                option.textContent = file.name;
                // Select if this is the current script
                if (this.currentConfig?.script === file.name) {
                    option.selected = true;
                }
                autoStartSelect.appendChild(option);
            }
        }
    }

    updateSDCardDependentSections() {
        console.log('updateSDCardDependentSections called, sdCardAvailable:', this.sdCardAvailable);
        // Update nav items that require SD card
        this.sdRequiredSections.forEach(section => {
            const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
            console.log(`Section ${section}: navItem found:`, !!navItem);
            if (navItem) {
                if (this.sdCardAvailable) {
                    navItem.classList.remove('disabled');
                    navItem.style.opacity = '1';
                    navItem.style.pointerEvents = 'auto';
                    console.log(`Enabled section: ${section}`);
                } else {
                    navItem.classList.add('disabled');
                    navItem.style.opacity = '0.4';
                    navItem.style.pointerEvents = 'auto'; // Keep clickable to show warning
                    console.log(`Disabled section: ${section}`);
                }
            }
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update content
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });

        this.currentSection = section;

        // Section-specific initialization
        if (section === 'files' && this.serial.connected && this.sdCardAvailable) {
            console.log('switchSection: Triggering refreshFiles for files section');
            this.refreshFiles();
        } else if (section === 'files') {
            console.log('switchSection: Cannot refresh files - connected:', this.serial.connected, 'sdCardAvailable:', this.sdCardAvailable);
        }

        // Reload config when switching to settings or network sections
        if ((section === 'config' || section === 'network') && this.serial.connected && this.sdCardAvailable) {
            console.log('switchSection: Reloading config for', section);
            this.loadCurrentConfig();
        }
    }

    // Dashboard functions
    async rebootDevice() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (confirm('Are you sure you want to restart the device?')) {
            try {
                await this.serial.reboot();
                this.showToast('Device is restarting...', 'info');
            } catch (error) {
                this.showToast('Failed to restart device', 'error');
            }
        }
    }

    async backupConfig() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        try {
            const backup = await this.serial.backup();
            if (backup) {
                // Create download link
                const blob = new Blob([backup], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `webscreen-backup-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Configuration backed up successfully', 'success');
            }
        } catch (error) {
            this.showToast('Failed to backup configuration', 'error');
        }
    }

    async factoryReset() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (confirm('Are you sure you want to factory reset the device? This will erase all settings and data.')) {
            if (confirm('This action cannot be undone. Continue with factory reset?')) {
                try {
                    await this.serial.factoryReset();
                    this.showToast('Device reset to factory settings', 'success');
                } catch (error) {
                    this.showToast('Failed to reset device', 'error');
                }
            }
        }
    }

    async refreshDeviceInfo() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        this.showToast('Refreshing device info...', 'info');
        await this.loadDeviceInfo();
        this.showToast('Device info refreshed', 'success');
    }

    // Marketplace functions
    loadAppsFromConfig() {
        try {
            // Embedded apps configuration
            this.availableApps = [
                {
                    "name": "Blink LED",
                    "id": "blink",
                    "category": "utilities",
                    "description": "Simple LED blinking example to test your WebScreen setup",
                    "icon": "fa-lightbulb",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/blink",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/blink/script.js",
                    "size": 1,
                    "featured": true
                },
                {
                    "name": "Time API",
                    "id": "timeapi",
                    "category": "productivity",
                    "description": "Display current time and date from world time API",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timeapi/script.js",
                    "size": 2,
                    "featured": true
                },
                {
                    "name": "SD Card Reader",
                    "id": "sd_reader",
                    "category": "utilities",
                    "description": "Read and display files from your SD card storage",
                    "icon": "fa-sd-card",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/sd_reader",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/sd_reader/script.js",
                    "size": 1,
                    "featured": false
                },
                {
                    "name": "Weather Display",
                    "id": "weather_app",
                    "category": "productivity",
                    "description": "Show current weather conditions and forecast",
                    "icon": "fa-cloud-sun",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/weather",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/weather/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Digital Clock",
                    "id": "digital_clock",
                    "category": "utilities",
                    "description": "Beautiful digital clock with customizable themes",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/clock",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/clock/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "System Monitor",
                    "id": "system_monitor",
                    "category": "utilities",
                    "description": "Monitor system performance and resource usage",
                    "icon": "fa-chart-line",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/monitor",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/monitor/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Snake Game",
                    "id": "snake_game",
                    "category": "games",
                    "description": "Classic snake game with touch controls",
                    "icon": "fa-gamepad",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/snake",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/snake/script.js",
                    "size": 4,
                    "featured": true
                },
                {
                    "name": "Music Player",
                    "id": "music_player",
                    "category": "social",
                    "description": "Control your favorite music streaming services",
                    "icon": "fa-music",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/music",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/music/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "Notification Center",
                    "id": "notifications",
                    "category": "productivity",
                    "description": "Centralized notification hub for all your services",
                    "icon": "fa-bell",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/notifications",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/notifications/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Teleprompter",
                    "id": "teleprompter",
                    "category": "productivity",
                    "description": "Scrolling text display for presentations and speeches",
                    "icon": "fa-scroll",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/teleprompter",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/teleprompter/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Steam Connect",
                    "id": "steam_connect",
                    "category": "games",
                    "description": "Display Steam profile, friends online, and game activity",
                    "icon": "fa-steam",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/steam",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/steam/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Stock Ticker",
                    "id": "stock_ticker",
                    "category": "productivity",
                    "description": "Real-time stock prices and market information",
                    "icon": "fa-chart-line",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/stocks",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/stocks/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Pomodoro Timer",
                    "id": "pomodoro",
                    "category": "productivity",
                    "description": "Focus timer with work and break intervals for productivity",
                    "icon": "fa-p",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/pomodoro",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/pomodoro/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "RSS Reader",
                    "id": "rss_reader",
                    "category": "productivity",
                    "description": "Display latest news and updates from RSS feeds",
                    "icon": "fa-rss",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/rss",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/rss/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "IoT Monitor",
                    "id": "iot_monitor",
                    "category": "utilities",
                    "description": "Monitor and control IoT devices and sensors",
                    "icon": "fa-microchip",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/iot",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/iot/script.js",
                    "size": 4,
                    "featured": true
                },
                {
                    "name": "Bid Watcher",
                    "id": "bid_watcher",
                    "category": "productivity",
                    "description": "Track auction bids and marketplace listings",
                    "icon": "fa-gavel",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/auctions",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/auctions/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "Reminders",
                    "id": "reminders",
                    "category": "productivity",
                    "description": "Personal reminder system with notifications and alerts",
                    "icon": "fa-calendar-days",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/reminders",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/reminders/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Timer & Stopwatch",
                    "id": "timer",
                    "category": "utilities",
                    "description": "Countdown timer and stopwatch for productivity",
                    "icon": "fa-stopwatch",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timer",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timer/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Social Feed",
                    "id": "social_feed",
                    "category": "social",
                    "description": "Display your social media feeds and updates",
                    "icon": "fa-hashtag",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/social",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/social/script.js",
                    "size": 4,
                    "featured": false
                },
                {
                    "name": "Calculator",
                    "id": "calculator",
                    "category": "utilities",
                    "description": "Basic calculator with arithmetic operations",
                    "icon": "fa-calculator",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/calculator",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/calculator/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Dual Clock",
                    "id": "dual_clock",
                    "category": "productivity",
                    "description": "Display two time zones simultaneously with automatic sync",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/dual_clock",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/dual_clock/script.js",
                    "size": 3,
                    "featured": true
                }
            ];

            this.renderApps();
            console.log(`Loaded ${this.availableApps.length} apps from embedded configuration`);
        } catch (error) {
            console.error('Failed to load apps from configuration:', error);
            this.showToast('Failed to load app catalog', 'error');
            this.loadFallbackApps();
        }
    }

    loadFallbackApps() {
        // Minimal fallback apps if JSON loading fails
        this.availableApps = [
            {
                name: 'Blink LED',
                id: 'blink',
                category: 'utilities',
                description: 'Simple LED blinking example to test your WebScreen setup',
                icon: 'fa-lightbulb',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/blink',
                main_file: null,
                size: 1,
                featured: true
            },
            {
                name: 'Time API',
                id: 'timeapi',
                category: 'productivity',
                description: 'Display current time and date from world time API',
                icon: 'fa-clock',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi',
                main_file: null,
                size: 2,
                featured: true
            },
            {
                name: 'System Monitor',
                id: 'system_monitor',
                category: 'utilities',
                description: 'Monitor system performance and resource usage',
                icon: 'fa-chart-line',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/monitor',
                main_file: null,
                size: 2,
                featured: false
            }
        ];
        this.renderApps();
    }


    renderApps(category = 'all', search = '') {
        const grid = document.getElementById('appsGrid');
        if (!grid) return;

        let apps = this.availableApps;

        // Filter by category
        if (category === 'featured') {
            apps = apps.filter(app => app.featured === true);
        } else if (category !== 'all') {
            apps = apps.filter(app => app.category === category);
        }

        // Filter by search
        if (search) {
            apps = apps.filter(app =>
                app.name.toLowerCase().includes(search.toLowerCase()) ||
                app.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        grid.innerHTML = apps.map(app => `
            <div class="app-card" data-app-id="${app.id}">
                <div class="app-card-icon">
                    <i class="fas ${app.icon}"></i>
                </div>
                <div class="app-card-name">${app.name}</div>
                <div class="app-card-category">${app.category}</div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('click', () => {
                const appId = card.dataset.appId;
                const app = this.availableApps.find(a => a.id === appId);
                this.showAppDetails(app);
            });
        });
    }

    filterApps(category) {
        this.renderApps(category);
    }

    searchApps(query) {
        const category = document.querySelector('.category-btn.active')?.dataset.category || 'all';
        this.renderApps(category, query);
    }

    showAppDetails(app) {
        document.getElementById('modalAppName').textContent = app.name;
        document.getElementById('modalAppDesc').textContent = app.description;
        document.getElementById('modalAppVersion').textContent = '1.0.0';
        document.getElementById('modalAppAuthor').textContent = 'HW Media Lab LLC';
        document.getElementById('modalAppSize').textContent = `${app.size} KB`;

        const modalIcon = document.getElementById('modalAppIcon');
        modalIcon.style.display = 'none'; // Hide img, show icon instead
        modalIcon.insertAdjacentHTML('afterend', `
            <div class="app-card-icon" style="margin: 0 auto 1.5rem;">
                <i class="fas ${app.icon}"></i>
            </div>
        `);

        // Update install button state based on connection and SD card
        const installBtn = document.getElementById('installAppBtn');
        if (!this.serial.connected) {
            installBtn.disabled = true;
            installBtn.innerHTML = '<i class="fas fa-plug"></i> Connect Device First';
            installBtn.title = 'Connect to a WebScreen device to install apps';
        } else if (!this.sdCardAvailable) {
            installBtn.disabled = true;
            installBtn.innerHTML = '<i class="fas fa-sd-card"></i> SD Card Required';
            installBtn.title = 'Insert an SD card to install apps';
        } else {
            installBtn.disabled = false;
            installBtn.innerHTML = '<i class="fas fa-download"></i> Install to SD Card';
            installBtn.title = 'Download and install this app to your WebScreen';
        }

        document.getElementById('appModal').classList.add('active');
        document.getElementById('appModal').dataset.appId = app.id;
    }

    closeModal() {
        document.getElementById('appModal').classList.remove('active');
        // Clean up inserted icon
        const insertedIcon = document.querySelector('.modal-body .app-card-icon');
        if (insertedIcon) insertedIcon.remove();
    }

    async installApp() {
        const modal = document.getElementById('appModal');
        const appId = modal.dataset.appId;
        const app = this.availableApps.find(a => a.id === appId);

        if (!app || !app.main_file) {
            this.showToast('App installation file not found', 'error');
            return;
        }

        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to install apps', 'warning');
            return;
        }

        const installBtn = document.getElementById('installAppBtn');
        const cancelBtn = document.getElementById('cancelInstallBtn');
        const progressEl = document.getElementById('installProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressIcon = document.getElementById('progressIcon');
        const progressStatus = progressEl.querySelector('.progress-status');

        // Hide buttons and show progress
        installBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        progressEl.style.display = 'block';

        // Helper to update progress
        const updateProgress = (step, percent, text) => {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = text;

            // Update step indicators
            for (let i = 1; i <= 4; i++) {
                const stepEl = document.getElementById(`step${i}`);
                stepEl.classList.remove('active', 'completed');
                if (i < step) {
                    stepEl.classList.add('completed');
                } else if (i === step) {
                    stepEl.classList.add('active');
                }
            }
        };

        // Helper to show error
        const showError = (message) => {
            progressStatus.classList.add('error');
            progressIcon.classList.remove('fa-spinner', 'fa-spin');
            progressIcon.classList.add('fa-exclamation-circle');
            progressText.textContent = message;
            progressBar.style.background = 'var(--danger-color)';

            // Show buttons again after error
            setTimeout(() => {
                installBtn.style.display = '';
                cancelBtn.style.display = '';
                progressEl.style.display = 'none';
                // Reset progress state
                progressStatus.classList.remove('error');
                progressIcon.classList.remove('fa-exclamation-circle');
                progressIcon.classList.add('fa-spinner', 'fa-spin');
                progressBar.style.width = '0%';
                progressBar.style.background = '';
            }, 3000);
        };

        // Helper to show success
        const showSuccess = (message) => {
            progressStatus.classList.add('success');
            progressIcon.classList.remove('fa-spinner', 'fa-spin');
            progressIcon.classList.add('fa-check-circle');
            progressText.textContent = message;
        };

        // Get the base URL for this app's folder
        const getAppBaseUrl = () => {
            // Extract base URL from main_file (remove script.js from the end)
            const mainFile = app.main_file;
            return mainFile.substring(0, mainFile.lastIndexOf('/') + 1);
        };

        try {
            // Step 1: Fetch app.json to get assets list, then download app code
            updateProgress(1, 5, 'Fetching app configuration...');

            const baseUrl = getAppBaseUrl();
            const appJsonUrl = baseUrl + 'app.json';
            let assets = [];

            try {
                const appJsonResponse = await fetch(appJsonUrl);
                if (appJsonResponse.ok) {
                    const appConfig = await appJsonResponse.json();
                    assets = appConfig.assets || [];
                    console.log(`Found ${assets.length} assets for ${app.name}:`, assets);
                }
            } catch (e) {
                console.log('Could not fetch app.json, proceeding without assets:', e);
            }

            updateProgress(1, 10, 'Downloading app from GitHub...');
            const response = await fetch(app.main_file);
            if (!response.ok) {
                throw new Error('Failed to download app from GitHub');
            }
            const code = await response.text();
            updateProgress(1, 20, 'Download complete');

            // Step 2: Download and upload assets (if any)
            if (assets.length > 0) {
                updateProgress(2, 25, `Downloading ${assets.length} asset(s)...`);

                for (let i = 0; i < assets.length; i++) {
                    const assetName = assets[i];
                    const assetUrl = baseUrl + assetName;
                    const progressPercent = 25 + (i / assets.length) * 20;

                    updateProgress(2, progressPercent, `Downloading ${assetName}...`);

                    try {
                        const assetResponse = await fetch(assetUrl);
                        if (!assetResponse.ok) {
                            console.warn(`Failed to download asset: ${assetName}`);
                            continue;
                        }

                        // Determine if asset is binary or text
                        const ext = assetName.substring(assetName.lastIndexOf('.')).toLowerCase();
                        const textExtensions = ['.js', '.json', '.txt', '.html', '.css', '.xml', '.csv', '.md', '.pem'];
                        const isTextFile = textExtensions.includes(ext);

                        let assetContent;
                        if (isTextFile) {
                            assetContent = await assetResponse.text();
                        } else {
                            assetContent = await assetResponse.arrayBuffer();
                        }

                        updateProgress(2, progressPercent + 5, `Uploading ${assetName}...`);
                        await this.serial.uploadFile('/' + assetName, assetContent);
                        console.log(`Uploaded asset: ${assetName}`);

                    } catch (assetError) {
                        console.warn(`Error processing asset ${assetName}:`, assetError);
                    }
                }

                updateProgress(2, 45, 'Assets uploaded');
            }

            // Step 3: Upload script to SD card
            updateProgress(3, 50, 'Uploading script to SD card...');
            const scriptFilename = `${app.id}.js`;
            await this.serial.uploadFile(scriptFilename, code);
            updateProgress(3, 65, 'Script uploaded');

            // Step 4: Update the script setting in config
            updateProgress(4, 70, 'Updating configuration...');
            await this.serial.setConfig('script', scriptFilename);
            updateProgress(4, 85, 'Configuration saved');

            // Mark all steps as completed
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`step${i}`).classList.remove('active');
                document.getElementById(`step${i}`).classList.add('completed');
            }

            updateProgress(4, 100, 'Restarting device to load app...');
            showSuccess(`${app.name} installed successfully! Device is restarting...`);

            // Wait a moment for the user to see the success message, then reboot
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Close modal and show global loading overlay
            this.closeModal();
            // Reset progress UI for next time
            installBtn.style.display = '';
            cancelBtn.style.display = '';
            progressEl.style.display = 'none';
            progressStatus.classList.remove('success');
            progressIcon.classList.remove('fa-check-circle');
            progressIcon.classList.add('fa-spinner', 'fa-spin');
            progressBar.style.width = '0%';
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`step${i}`).classList.remove('active', 'completed');
            }

            // Show loading modal
            this.showLoadingModal(
                'Starting ' + app.name,
                'Device is restarting and loading your app...'
            );

            // Reboot the device
            await this.serial.reboot();

        } catch (error) {
            console.error('Failed to install app:', error);
            showError(`Installation failed: ${error.message}`);
            this.showToast(`Failed to install app: ${error.message}`, 'error');
        }
    }

    // File Manager functions
    async refreshFiles() {
        if (!this.serial.connected) {
            console.log('refreshFiles: Not connected');
            return;
        }

        if (!this.sdCardAvailable) {
            console.log('refreshFiles: SD card not available');
            return;
        }

        // Show loading state
        const fileList = document.getElementById('fileList');
        if (fileList) {
            fileList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading files...</div>';
        }

        try {
            console.log('refreshFiles: Loading files from', this.currentPath);
            this.files = await this.serial.listFiles(this.currentPath);
            console.log('refreshFiles: Got files:', this.files);
            this.renderFiles();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showToast('Failed to load files', 'error');
            if (fileList) {
                fileList.innerHTML = '<div style="text-align: center; color: var(--danger-color); padding: 2rem;"><i class="fas fa-exclamation-circle"></i> Failed to load files</div>';
            }
        }
    }

    renderFiles() {
        const fileList = document.getElementById('fileList');
        if (!fileList) {
            console.log('renderFiles: fileList element not found');
            return;
        }

        console.log('renderFiles: Rendering', this.files.length, 'files');

        if (!this.files || this.files.length === 0) {
            fileList.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No files found in ${this.currentPath}
                </div>`;
            return;
        }

        fileList.innerHTML = this.files.map(file => `
            <div class="file-item" data-name="${file.name}" data-type="${file.type}">
                <i class="fas ${file.type === 'dir' ? 'fa-folder' : this.getFileIcon(file.name)}"></i>
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-size">${this.formatFileSize(file.size)}</span>
                <div class="file-item-actions">
                    ${file.type === 'file' ? `
                        <button class="btn-icon" data-action="download" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-icon" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event handlers
        fileList.querySelectorAll('.file-item').forEach(item => {
            const name = item.dataset.name;
            const type = item.dataset.type;

            if (type === 'dir') {
                item.addEventListener('click', () => {
                    this.currentPath = this.currentPath + name + '/';
                    document.getElementById('currentPath').textContent = this.currentPath;
                    this.refreshFiles();
                });
            }

            item.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    if (action === 'delete') {
                        this.deleteFile(name);
                    } else if (action === 'download') {
                        this.downloadFile(name);
                    }
                });
            });
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'js': 'fa-file-code',
            'json': 'fa-file-code',
            'txt': 'fa-file-alt',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio'
        };
        return icons[ext] || 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    async handleFileUpload(files) {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to upload files', 'warning');
            return;
        }

        for (const file of files) {
            try {
                // Show upload progress overlay
                this.showUploadProgress(file.name, 0, file.size);

                // Determine if file is text or binary based on extension
                const textExtensions = ['.js', '.json', '.txt', '.html', '.css', '.xml', '.csv', '.md'];
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                const isTextFile = textExtensions.includes(ext);

                const content = await this.readFileFromBrowser(file, !isTextFile);

                // Include current path in filename
                const fullPath = this.currentPath + file.name;
                console.log('Uploading file to:', fullPath, 'binary:', !isTextFile);

                // Upload with progress callback
                await this.serial.uploadFile(fullPath, content, (sent, total) => {
                    this.updateUploadProgress(file.name, sent, total);
                });

                this.hideUploadProgress();
                this.showToast(`${file.name} uploaded successfully`, 'success');
            } catch (error) {
                console.error('Upload error:', error);
                this.hideUploadProgress();
                this.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }

        // Refresh file list after upload
        await this.refreshFiles();
    }

    showUploadProgress(filename, sent, total) {
        const overlay = document.getElementById('uploadProgressOverlay');
        const fileNameEl = document.getElementById('uploadFileName');
        const progressBar = document.getElementById('uploadProgressBar');
        const percentEl = document.getElementById('uploadProgressPercent');
        const bytesEl = document.getElementById('uploadProgressBytes');

        overlay.style.display = 'flex';
        fileNameEl.textContent = `Uploading ${filename}...`;
        progressBar.style.width = '0%';
        percentEl.textContent = '0%';
        bytesEl.textContent = `0 B / ${this.formatBytes(total)}`;
    }

    updateUploadProgress(filename, sent, total) {
        const progressBar = document.getElementById('uploadProgressBar');
        const percentEl = document.getElementById('uploadProgressPercent');
        const bytesEl = document.getElementById('uploadProgressBytes');

        const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
        progressBar.style.width = `${percent}%`;
        percentEl.textContent = `${percent}%`;
        bytesEl.textContent = `${this.formatBytes(sent)} / ${this.formatBytes(total)}`;
    }

    hideUploadProgress() {
        const overlay = document.getElementById('uploadProgressOverlay');
        overlay.style.display = 'none';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    readFileFromBrowser(file, asBinary = false) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            if (asBinary) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    async deleteFile(filename) {
        if (!this.serial.connected) return;

        if (confirm(`Are you sure you want to delete ${filename}?`)) {
            try {
                await this.serial.deleteFile(this.currentPath + filename);
                this.showToast('File deleted', 'success');
                this.refreshFiles();
            } catch (error) {
                this.showToast('Failed to delete file', 'error');
            }
        }
    }

    async downloadFile(filename) {
        // TODO: Implement file download
        this.showToast('Download feature coming soon', 'info');
    }

    createNewFolder() {
        const name = prompt('Enter folder name:');
        if (name) {
            // TODO: Implement folder creation
            this.showToast('Folder creation coming soon', 'info');
        }
    }

    // Settings functions
    async saveSystemSettings() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to save settings', 'warning');
            return;
        }

        const btn = document.getElementById('saveSystemBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            // Collect all values from dynamic config fields
            const container = document.getElementById('dynamicConfigContainer');

            // Start with normalized current config (migrates old format)
            const updatedConfig = this.normalizeConfig(this.currentConfig || {});

            // Helper to set nested value in object
            const setNestedValue = (obj, path, value) => {
                const keys = path.split('.');
                let current = obj;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            };

            // Collect WiFi settings from the form
            const wifiSsid = document.getElementById('wifiSSID')?.value?.trim();
            const wifiPassword = document.getElementById('wifiPassword')?.value;

            if (wifiSsid) {
                updatedConfig.settings.wifi.ssid = wifiSsid;
            }
            if (wifiPassword) {
                updatedConfig.settings.wifi.pass = wifiPassword;
            }

            // Collect timezone
            const timezone = document.getElementById('timezoneSelect')?.value;
            if (timezone) {
                updatedConfig.timezone = timezone;
            }

            // Collect display brightness
            const brightness = document.getElementById('displayBrightness')?.value;
            if (brightness) {
                if (!updatedConfig.display) {
                    updatedConfig.display = {};
                }
                updatedConfig.display.brightness = parseInt(brightness, 10);
            }

            // Clean up any legacy keys that shouldn't exist
            delete updatedConfig.wifi;
            delete updatedConfig['wifi.ssid'];
            delete updatedConfig['wifi.password'];
            delete updatedConfig.device; // device.name is not used by firmware

            // Collect values from all config inputs
            container.querySelectorAll('[data-config-path]').forEach(input => {
                const path = input.dataset.configPath;

                // Skip color picker inputs (we use the hex input instead)
                if (input.classList.contains('color-picker-input')) {
                    return;
                }

                let value;
                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'number') {
                    value = parseFloat(input.value) || 0;
                } else {
                    value = input.value;
                }

                setNestedValue(updatedConfig, path, value);
            });

            console.log('Saving updated config:', updatedConfig);

            // Save the updated configuration to webscreen.json
            await this.saveWebScreenConfig(updatedConfig);

            // Update the stored config
            this.currentConfig = updatedConfig;

            this.showToast('Settings saved! Restart device to apply changes.', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Helper to read and update webscreen.json
    async readWebScreenConfig() {
        try {
            console.log('Reading webscreen.json...');
            const content = await this.serial.readFile('/webscreen.json');
            console.log('webscreen.json raw content:', content);
            if (content) {
                const config = JSON.parse(content);
                console.log('webscreen.json parsed:', config);
                return config;
            }
        } catch (e) {
            console.warn('Could not read/parse webscreen.json:', e);
        }
        // Return default config if file doesn't exist or is invalid
        console.log('Using default config');
        return {
            settings: {
                wifi: { ssid: '', pass: '' },
                mqtt: { enabled: false }
            },
            screen: {
                background: '#000000',
                foreground: '#FFFFFF'
            },
            script: '',
            timezone: ''
        };
    }

    // Normalize config to standard format (handles backwards compatibility)
    normalizeConfig(config) {
        const normalized = JSON.parse(JSON.stringify(config));

        // Ensure settings structure exists
        if (!normalized.settings) {
            normalized.settings = {};
        }
        if (!normalized.settings.wifi) {
            normalized.settings.wifi = {};
        }
        if (!normalized.settings.mqtt) {
            normalized.settings.mqtt = { enabled: false };
        }

        // Migrate old wifi format (root level wifi.ssid/wifi.password) to settings.wifi
        if (normalized.wifi && typeof normalized.wifi === 'object') {
            if (normalized.wifi.ssid && !normalized.settings.wifi.ssid) {
                normalized.settings.wifi.ssid = normalized.wifi.ssid;
            }
            if (normalized.wifi.password && !normalized.settings.wifi.pass) {
                normalized.settings.wifi.pass = normalized.wifi.password;
            }
            if (normalized.wifi.pass && !normalized.settings.wifi.pass) {
                normalized.settings.wifi.pass = normalized.wifi.pass;
            }
            // Remove duplicate root-level wifi key
            delete normalized.wifi;
        }

        // Migrate old format: root level wifi.ssid string (from /config set)
        if (normalized['wifi.ssid']) {
            normalized.settings.wifi.ssid = normalized['wifi.ssid'];
            delete normalized['wifi.ssid'];
        }
        if (normalized['wifi.password']) {
            normalized.settings.wifi.pass = normalized['wifi.password'];
            delete normalized['wifi.password'];
        }

        // Ensure screen structure
        if (!normalized.screen) {
            normalized.screen = {
                background: '#000000',
                foreground: '#FFFFFF'
            };
        }

        return normalized;
    }

    async saveWebScreenConfig(config) {
        const configJson = JSON.stringify(config, null, 2);
        await this.serial.uploadFile('/webscreen.json', configJson);
    }

    // Load current config and populate form fields
    async loadCurrentConfig() {
        if (!this.serial.connected || !this.sdCardAvailable) {
            console.log('loadCurrentConfig: Not connected or no SD card');
            return;
        }

        console.log('loadCurrentConfig: Starting to load config...');

        try {
            // Try to get config values using /config get commands (more reliable)
            const configValues = {};

            // Get WiFi SSID (try both old and new paths)
            let wifiSsid = await this.serial.getConfig('settings.wifi.ssid');
            if (!wifiSsid) wifiSsid = await this.serial.getConfig('wifi.ssid');
            if (wifiSsid) configValues.wifiSsid = wifiSsid;

            // Get WiFi password (might not be returned for security)
            let wifiPass = await this.serial.getConfig('settings.wifi.pass');
            if (!wifiPass) wifiPass = await this.serial.getConfig('wifi.password');
            if (wifiPass) configValues.wifiPass = wifiPass;

            // Get script
            const script = await this.serial.getConfig('script');
            if (script) configValues.script = script;

            // Get timezone
            const timezone = await this.serial.getConfig('timezone');
            if (timezone) configValues.timezone = timezone;

            // Get brightness
            const brightness = await this.serial.getConfig('display.brightness');
            if (brightness) configValues.brightness = brightness;

            console.log('loadCurrentConfig: Got config values:', configValues);

            // Also try reading webscreen.json as fallback
            let fileConfig = await this.readWebScreenConfig();
            // Normalize config for backwards compatibility
            fileConfig = this.normalizeConfig(fileConfig);
            console.log('loadCurrentConfig: Normalized file config:', fileConfig);

            // Merge configs (command values take priority)
            const wifiConfig = fileConfig.settings?.wifi || {};
            const finalSsid = configValues.wifiSsid || wifiConfig.ssid || '';
            const finalPass = configValues.wifiPass || wifiConfig.pass || '';
            const finalScript = configValues.script || fileConfig.script || '';
            const finalTimezone = configValues.timezone || fileConfig.timezone || '';
            const finalBrightness = configValues.brightness || fileConfig.display?.brightness || 200;

            console.log('loadCurrentConfig: Final values - SSID:', finalSsid, 'Script:', finalScript, 'Timezone:', finalTimezone);

            // Populate WiFi fields
            const ssidField = document.getElementById('wifiSSID');
            const passwordField = document.getElementById('wifiPassword');

            console.log('loadCurrentConfig: Found ssidField:', !!ssidField, 'passwordField:', !!passwordField);

            if (ssidField) {
                ssidField.value = finalSsid;
                console.log('loadCurrentConfig: Set WiFi SSID to:', finalSsid);
            }
            if (passwordField) {
                passwordField.value = '';
                if (finalPass) {
                    passwordField.placeholder = '••••••••• (password set)';
                } else {
                    passwordField.placeholder = 'Enter WiFi password';
                }
            }

            // Populate timezone
            const timezoneField = document.getElementById('timezoneSelect');
            if (timezoneField && finalTimezone) {
                for (const option of timezoneField.options) {
                    if (option.value === finalTimezone || option.textContent.includes(finalTimezone)) {
                        option.selected = true;
                        break;
                    }
                }
                console.log('loadCurrentConfig: Set timezone to:', finalTimezone);
            }

            // Populate brightness
            const brightnessSlider = document.getElementById('displayBrightness');
            const brightnessValue = document.getElementById('brightnessValue');
            if (brightnessSlider) {
                brightnessSlider.value = finalBrightness;
                if (brightnessValue) {
                    brightnessValue.textContent = finalBrightness;
                }
                console.log('loadCurrentConfig: Set brightness to:', finalBrightness);
            }

            // Populate script/auto-start dropdown
            if (finalScript) {
                const autoStartSelect = document.getElementById('autoStart');
                console.log('loadCurrentConfig: Found autoStartSelect:', !!autoStartSelect);
                if (autoStartSelect) {
                    let optionExists = false;
                    for (const option of autoStartSelect.options) {
                        if (option.value === finalScript) {
                            optionExists = true;
                            option.selected = true;
                            break;
                        }
                    }
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = finalScript;
                        option.textContent = finalScript;
                        option.selected = true;
                        autoStartSelect.appendChild(option);
                    }
                    console.log('loadCurrentConfig: Set auto-start script to:', finalScript);
                }
            }

            // Store current config for later use
            this.currentConfig = { ...fileConfig, ...configValues };

            // Render the dynamic config UI
            this.renderDynamicConfig(fileConfig);

        } catch (error) {
            console.error('Failed to load current config:', error);
        }
    }

    // Reload configuration from device
    async reloadConfig() {
        if (!this.serial.connected || !this.sdCardAvailable) {
            this.showToast('Device not connected or SD card not available', 'warning');
            return;
        }

        const btn = document.getElementById('reloadConfigBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reloading...';
        btn.disabled = true;

        try {
            await this.loadCurrentConfig();
            this.showToast('Configuration reloaded', 'success');
        } catch (error) {
            console.error('Failed to reload config:', error);
            this.showToast('Failed to reload configuration', 'error');
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    // Render dynamic configuration fields from JSON config
    renderDynamicConfig(config) {
        const container = document.getElementById('dynamicConfigContainer');
        if (!container) return;

        // Clear loading state
        container.innerHTML = '';

        // Helper to determine if a value looks like a color
        const isColorValue = (value) => {
            if (typeof value !== 'string') return false;
            return /^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value);
        };

        // Helper to create a form field based on value type
        const createField = (key, value, path = '') => {
            const fullPath = path ? `${path}.${key}` : key;
            const fieldId = `config-${fullPath.replace(/\./g, '-')}`;
            const labelText = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

            let fieldHtml = '';

            if (typeof value === 'boolean') {
                // Toggle switch for booleans
                fieldHtml = `
                    <div class="config-field">
                        <label for="${fieldId}">${labelText}</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${fieldId}" data-config-path="${fullPath}" ${value ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            } else if (typeof value === 'number') {
                // Number input
                fieldHtml = `
                    <div class="config-field">
                        <label for="${fieldId}">${labelText}</label>
                        <input type="number" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}">
                    </div>
                `;
            } else if (typeof value === 'string') {
                if (isColorValue(value)) {
                    // Color picker for color values
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="${fieldId}-picker" class="color-picker-input" data-config-path="${fullPath}" value="${value}">
                                <input type="text" id="${fieldId}" class="form-control color-hex-input" data-config-path="${fullPath}" value="${value}" placeholder="#FFFFFF">
                            </div>
                        </div>
                    `;
                } else if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('password')) {
                    // Password field
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <div class="password-input">
                                <input type="password" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}" placeholder="Enter ${labelText.toLowerCase()}">
                                <button type="button" class="btn-icon toggle-password-btn">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    // Regular text input
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <input type="text" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}">
                        </div>
                    `;
                }
            }

            return fieldHtml;
        };

        // Get appropriate icon for section type
        const getSectionIcon = (title) => {
            const icons = {
                'settings': 'fa-sliders-h',
                'screen': 'fa-desktop',
                'wifi': 'fa-wifi',
                'mqtt': 'fa-broadcast-tower',
                'device': 'fa-microchip',
                'general': 'fa-cog',
                'network': 'fa-network-wired',
                'display': 'fa-tv',
                'theme': 'fa-palette',
                'colors': 'fa-paint-brush'
            };
            return icons[title.toLowerCase()] || 'fa-cog';
        };

        // Helper to create a section from an object
        const createSection = (title, obj, path = '') => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return '';
            }

            let fieldsHtml = '';
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object - create subsection
                    fieldsHtml += createSection(key.charAt(0).toUpperCase() + key.slice(1), value, path ? `${path}.${key}` : key);
                } else if (!Array.isArray(value)) {
                    // Simple value - create field
                    fieldsHtml += createField(key, value, path);
                }
            }

            if (!fieldsHtml) return '';

            const icon = getSectionIcon(title);
            return `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas ${icon}"></i> ${title}</h3>
                    <div class="config-section-fields">
                        ${fieldsHtml}
                    </div>
                </div>
            `;
        };

        // Helper to create fields from an object (without section wrapper)
        const createFieldsFromObject = (obj, path = '') => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return '';
            }

            let fieldsHtml = '';
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object - recurse
                    fieldsHtml += createFieldsFromObject(value, path ? `${path}.${key}` : key);
                } else if (!Array.isArray(value)) {
                    // Simple value - create field
                    fieldsHtml += createField(key, value, path);
                }
            }
            return fieldsHtml;
        };

        // Build the dynamic config UI with organized sections
        let html = '';

        // 1. DEVICE SECTION - includes device info and screen settings
        let deviceFields = '';
        if (config.device) {
            deviceFields += createFieldsFromObject(config.device, 'device');
        }
        if (config.screen) {
            deviceFields += createFieldsFromObject(config.screen, 'screen');
        }
        if (deviceFields) {
            html += `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas fa-microchip"></i> Device</h3>
                    <div class="config-section-fields">
                        ${deviceFields}
                    </div>
                </div>
            `;
        }

        // 2. TIME & LOCATION SECTION - editable time/date with sync button
        const currentTimezone = config.timezone || config.device?.timezone || '';
        html += `
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-clock"></i> Time & Location</h3>
                <div class="config-section-fields">
                    <div class="config-field">
                        <label for="config-time">Time</label>
                        <div class="input-with-button">
                            <input type="time" id="config-time" class="form-control" step="1">
                            <button type="button" class="btn btn-secondary btn-detect" id="detectTimeBtn">
                                <i class="fas fa-crosshairs"></i> Detect
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <label for="config-date">Date</label>
                        <input type="date" id="config-date" class="form-control">
                    </div>
                    <div class="config-field">
                        <label for="config-timezone">Timezone</label>
                        <div class="input-with-button">
                            <input type="text" id="config-timezone" class="form-control" data-config-path="timezone" value="${currentTimezone}" placeholder="e.g. America/New_York">
                            <button type="button" class="btn btn-secondary btn-detect" id="detectTimezoneBtn">
                                <i class="fas fa-crosshairs"></i> Detect
                            </button>
                        </div>
                    </div>
                    <div class="config-field config-field-actions">
                        <label></label>
                        <button type="button" class="btn btn-primary" id="syncTimeBtn">
                            <i class="fas fa-sync"></i> Sync Time to Device
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 3. GENERAL SECTION - top-level simple properties (excluding already handled ones)
        const excludeKeys = ['settings', 'screen', 'wifi', 'mqtt', 'device', 'timezone'];
        const topLevelFields = {};
        for (const [key, value] of Object.entries(config)) {
            if (!excludeKeys.includes(key) && typeof value !== 'object') {
                topLevelFields[key] = value;
            }
        }
        if (Object.keys(topLevelFields).length > 0) {
            let generalFields = '';
            for (const [key, value] of Object.entries(topLevelFields)) {
                generalFields += createField(key, value, '');
            }
            html += `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas fa-cog"></i> General</h3>
                    <div class="config-section-fields">
                        ${generalFields}
                    </div>
                </div>
            `;
        }

        // 4. SETTINGS SECTION - MQTT and other settings (WiFi is managed in Network tab)
        let settingsFields = '';

        // Get MQTT config (either from settings.mqtt or top-level mqtt, not both)
        const mqttConfig = config.settings?.mqtt || config.mqtt;
        if (mqttConfig) {
            const mqttPath = config.settings?.mqtt ? 'settings.mqtt' : 'mqtt';
            settingsFields += createFieldsFromObject(mqttConfig, mqttPath);
        }

        // Add other settings fields (excluding wifi and mqtt which we handled separately)
        if (config.settings) {
            for (const [key, value] of Object.entries(config.settings)) {
                // Skip wifi (managed in Network tab) and mqtt (handled above)
                if (key !== 'wifi' && key !== 'mqtt') {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        settingsFields += createFieldsFromObject(value, `settings.${key}`);
                    } else if (!Array.isArray(value)) {
                        settingsFields += createField(key, value, 'settings');
                    }
                }
            }
        }

        if (settingsFields) {
            html += `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas fa-cog"></i> Advanced Settings</h3>
                    <div class="config-section-fields">
                        ${settingsFields}
                    </div>
                </div>
            `;
        }

        if (!html) {
            html = `
                <div class="config-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>No configuration options available.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Setup event listeners for color pickers
        container.querySelectorAll('.color-picker-wrapper').forEach(wrapper => {
            const picker = wrapper.querySelector('.color-picker-input');
            const hexInput = wrapper.querySelector('.color-hex-input');

            if (picker && hexInput) {
                // Sync picker to hex input
                picker.addEventListener('input', () => {
                    hexInput.value = picker.value.toUpperCase();
                });

                // Sync hex input to picker
                hexInput.addEventListener('input', () => {
                    const val = hexInput.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        picker.value = val;
                    }
                });
            }
        });

        // Setup password toggle buttons
        container.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const icon = btn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        });

        // Setup time/date fields
        const timeInput = document.getElementById('config-time');
        const dateInput = document.getElementById('config-date');
        const detectTimeBtn = document.getElementById('detectTimeBtn');
        const detectTimezoneBtn = document.getElementById('detectTimezoneBtn');
        const timezoneInput = document.getElementById('config-timezone');
        const syncTimeBtn = document.getElementById('syncTimeBtn');

        // Helper to set current browser time/date
        const setCurrentTime = () => {
            const now = new Date();
            if (timeInput) {
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                timeInput.value = `${hours}:${minutes}:${seconds}`;
            }
            if (dateInput) {
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                dateInput.value = `${year}-${month}-${day}`;
            }
        };

        // Set initial values to current time
        setCurrentTime();

        // Detect time button
        if (detectTimeBtn) {
            detectTimeBtn.addEventListener('click', () => {
                setCurrentTime();
                this.showToast('Time updated to current local time', 'success');
            });
        }

        // Setup timezone detect button
        if (detectTimezoneBtn && timezoneInput) {
            // Auto-detect if empty
            if (!timezoneInput.value) {
                timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }

            detectTimezoneBtn.addEventListener('click', () => {
                const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                timezoneInput.value = detectedTimezone;
                this.showToast(`Detected timezone: ${detectedTimezone}`, 'success');
            });
        }

        // Sync time to device button
        if (syncTimeBtn) {
            syncTimeBtn.addEventListener('click', async () => {
                if (!this.serial.connected) {
                    this.showToast('Please connect to a device first', 'warning');
                    return;
                }

                const timeVal = timeInput?.value;
                const dateVal = dateInput?.value;
                const timezone = timezoneInput?.value || 'UTC0';

                if (!timeVal || !dateVal) {
                    this.showToast('Please set both time and date', 'warning');
                    return;
                }

                // Parse the time and date
                const [hours, minutes, seconds] = timeVal.split(':').map(Number);
                const [year, month, day] = dateVal.split('-').map(Number);

                // Create a Date object and get epoch
                const dateObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
                const epoch = Math.floor(dateObj.getTime() / 1000);

                syncTimeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
                syncTimeBtn.disabled = true;

                try {
                    const success = await this.serial.syncTime(epoch, timezone);
                    if (success) {
                        this.showToast('Time synced to device!', 'success');
                    } else {
                        this.showToast('Failed to sync time', 'error');
                    }
                } catch (error) {
                    console.error('Time sync error:', error);
                    this.showToast('Failed to sync time', 'error');
                } finally {
                    syncTimeBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Time to Device';
                    syncTimeBtn.disabled = false;
                }
            });
        }
    }

    // WiFi Connection
    async connectWiFi() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        const ssid = document.getElementById('wifiSSID').value.trim();
        const password = document.getElementById('wifiPassword').value;

        if (!ssid) {
            this.showToast('Please enter a network name (SSID)', 'warning');
            return;
        }

        try {
            this.showToast('Saving WiFi settings...', 'info');
            await this.serial.connectWiFi(ssid, password);
            this.showToast('WiFi settings saved. Device will reboot and connect to the network.', 'success');
        } catch (error) {
            console.error('Failed to connect WiFi:', error);
            this.showToast('Failed to save WiFi settings', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Loading modal
    showLoadingModal(title = 'Preparing App', message = 'Please wait while the device loads the app') {
        const modal = document.getElementById('loadingModal');
        const titleEl = document.getElementById('loadingTitle');
        const messageEl = document.getElementById('loadingMessage');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        if (modal) {
            modal.classList.add('active');
        }

        // Set waiting flag
        this.waitingForScriptExecution = true;

        // Set a timeout to auto-hide after 30 seconds (fallback)
        this.scriptExecutionTimeout = setTimeout(() => {
            console.log('Script execution timeout, hiding loading modal');
            this.hideLoadingModal();
        }, 30000);
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Clear waiting flag and timeout
        this.waitingForScriptExecution = false;
        if (this.scriptExecutionTimeout) {
            clearTimeout(this.scriptExecutionTimeout);
            this.scriptExecutionTimeout = null;
        }
    }

    initializeSections() {
        // Initialize with dashboard
        this.switchSection('dashboard');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.webScreenAdmin = new WebScreenAdmin();
});
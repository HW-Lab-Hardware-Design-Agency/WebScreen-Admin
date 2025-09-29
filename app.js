// WebScreen Admin UI Application
class WebScreenAdmin {
    constructor() {
        this.serial = new WebScreenSerial();
        this.currentSection = 'dashboard';
        this.availableApps = [];
        this.installedApps = [];
        this.currentPath = '/';
        this.files = [];

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

        // Setup event listeners
        this.setupEventListeners();

        // Load apps from embedded configuration
        this.loadAppsFromConfig();

        // Initialize sections
        this.initializeSections();
    }

    setupEventListeners() {
        // Connection button
        document.getElementById('connectBtn').addEventListener('click', () => this.toggleConnection());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Dashboard actions
        document.getElementById('rebootBtn')?.addEventListener('click', () => this.rebootDevice());
        document.getElementById('backupBtn')?.addEventListener('click', () => this.backupConfig());
        document.getElementById('factoryResetBtn')?.addEventListener('click', () => this.factoryReset());
        document.getElementById('updateBtn')?.addEventListener('click', () => this.checkUpdates());

        // App controls
        document.getElementById('stopAppBtn')?.addEventListener('click', () => this.stopCurrentApp());
        document.getElementById('restartAppBtn')?.addEventListener('click', () => this.restartCurrentApp());

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

        // Network
        document.getElementById('connectWifiBtn')?.addEventListener('click', () => this.connectWiFi());
        document.getElementById('togglePassword')?.addEventListener('click', (e) => {
            const input = document.getElementById('wifiPassword');
            const icon = e.currentTarget.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });

        // Display settings
        document.getElementById('brightness')?.addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value;
        });
        document.getElementById('saveDisplayBtn')?.addEventListener('click', () => this.saveDisplaySettings());

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
        } else {
            btn.innerHTML = '<i class="fas fa-plug"></i> Connect Device';
            indicator.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }

        // Enable/disable controls based on connection
        this.updateControlsState(connected);
    }

    handleSerialData(data) {
        console.log('Serial data:', data);
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
            const stats = await this.serial.getStats();
            if (stats) {
                document.getElementById('deviceMemory').textContent = stats.freeHeap || '-';
                document.getElementById('deviceStorage').textContent = stats.sdFree || '-';
                document.getElementById('deviceWifi').textContent = stats.wifi || '-';
                document.getElementById('deviceIP').textContent = stats.ip || '-';
            }

            // Load files
            await this.refreshFiles();
        } catch (error) {
            console.error('Failed to load device info:', error);
        }
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
        if (section === 'files' && this.serial.connected) {
            this.refreshFiles();
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

    async checkUpdates() {
        this.showToast('Checking for updates...', 'info');
        // TODO: Implement update check
        setTimeout(() => {
            this.showToast('Your device is up to date', 'success');
        }, 2000);
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/blink/main.js",
                    "size": 1,
                    "featured": true
                },
                {
                    "name": "Time API",
                    "id": "timeapi_app",
                    "category": "productivity",
                    "description": "Display current time and date from world time API",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi_app",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timeapi_app/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/sd_reader/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/weather/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/clock/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/monitor/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/games/snake.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/music/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/notifications/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/teleprompter/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/steam/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/stocks/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/pomodoro/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/rss/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/iot/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/auctions/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/reminders/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timer/main.js",
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
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/social/main.js",
                    "size": 4,
                    "featured": false
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
                id: 'timeapi_app',
                category: 'productivity',
                description: 'Display current time and date from world time API',
                icon: 'fa-clock',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi_app',
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
        document.getElementById('modalAppAuthor').textContent = 'WebScreen Community';
        document.getElementById('modalAppSize').textContent = `${app.size} KB`;

        const modalIcon = document.getElementById('modalAppIcon');
        modalIcon.style.display = 'none'; // Hide img, show icon instead
        modalIcon.insertAdjacentHTML('afterend', `
            <div class="app-card-icon" style="margin: 0 auto 1.5rem;">
                <i class="fas ${app.icon}"></i>
            </div>
        `);

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

        try {
            // Download app code
            const response = await fetch(app.main_file);
            const code = await response.text();

            // Upload to device
            await this.serial.uploadFile(`${app.id}.js`, code);

            // Load the app
            await this.serial.loadApp(`${app.id}.js`);

            this.showToast(`${app.name} installed successfully!`, 'success');
            this.closeModal();

            // Update current app display
            this.updateCurrentApp(app);
        } catch (error) {
            console.error('Failed to install app:', error);
            this.showToast('Failed to install app', 'error');
        }
    }

    updateCurrentApp(app) {
        document.getElementById('currentAppName').textContent = app.name;
        document.getElementById('currentAppDesc').textContent = app.description;
        document.getElementById('stopAppBtn').disabled = false;
        document.getElementById('restartAppBtn').disabled = false;
    }

    async stopCurrentApp() {
        if (!this.serial.connected) return;

        try {
            await this.serial.sendCommand('/stop');
            document.getElementById('currentAppName').textContent = 'No App Running';
            document.getElementById('currentAppDesc').textContent = 'Select an app from the Marketplace to get started';
            document.getElementById('stopAppBtn').disabled = true;
            document.getElementById('restartAppBtn').disabled = true;
            this.showToast('App stopped', 'success');
        } catch (error) {
            this.showToast('Failed to stop app', 'error');
        }
    }

    async restartCurrentApp() {
        // TODO: Implement app restart
        this.showToast('Restarting app...', 'info');
    }

    // File Manager functions
    async refreshFiles() {
        if (!this.serial.connected) return;

        try {
            this.files = await this.serial.listFiles(this.currentPath);
            this.renderFiles();
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }

    renderFiles() {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        if (this.files.length === 0) {
            fileList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No files found</div>';
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

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                await this.serial.uploadFile(file.name, content);
                this.showToast(`${file.name} uploaded successfully`, 'success');
            } catch (error) {
                this.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }

        this.refreshFiles();
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
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

        try {
            const deviceName = document.getElementById('deviceName').value;
            const autoStart = document.getElementById('autoStart').value;
            const timezone = document.getElementById('timezone').value;

            if (deviceName) {
                await this.serial.setConfig('device.name', deviceName);
            }
            if (autoStart) {
                await this.serial.setConfig('autostart.app', autoStart);
            }
            if (timezone) {
                await this.serial.setConfig('timezone', timezone);
            }

            this.showToast('Settings saved successfully', 'success');
        } catch (error) {
            this.showToast('Failed to save settings', 'error');
        }
    }

    // Network functions
    async connectWiFi() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        const ssid = document.getElementById('wifiSSID').value;
        const password = document.getElementById('wifiPassword').value;

        if (!ssid) {
            this.showToast('Please enter a network name', 'warning');
            return;
        }

        try {
            await this.serial.connectWiFi(ssid, password);
            this.showToast('Connecting to WiFi... Device will restart', 'info');
        } catch (error) {
            this.showToast('Failed to configure WiFi', 'error');
        }
    }

    // Display functions
    async saveDisplaySettings() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        try {
            const brightness = document.getElementById('brightness').value;
            const orientation = document.getElementById('orientation').value;
            const timeout = document.getElementById('timeout').value;

            await this.serial.setBrightness(brightness);
            await this.serial.setOrientation(orientation);
            await this.serial.setTimeout(timeout);

            this.showToast('Display settings saved', 'success');

            // Update preview
            this.updateDisplayPreview();
        } catch (error) {
            this.showToast('Failed to save display settings', 'error');
        }
    }

    updateDisplayPreview() {
        const orientation = document.getElementById('orientation').value;
        const brightness = document.getElementById('brightness').value;
        const preview = document.getElementById('previewScreen');

        preview.style.transform = `rotate(${orientation}deg)`;
        preview.style.opacity = brightness / 255;
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

    initializeSections() {
        // Initialize with dashboard
        this.switchSection('dashboard');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.webScreenAdmin = new WebScreenAdmin();
});
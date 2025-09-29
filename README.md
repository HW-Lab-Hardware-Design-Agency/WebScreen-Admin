# WebScreen Admin - Visual Configuration Tool

A modern, user-friendly web application for configuring and managing WebScreen devices without any programming knowledge. Perfect for non-technical users who want to use and configure WebScreen with simple visual controls.

## Features

### 🎯 **Designed for Non-Technical Users**
- **Visual Interface**: No command line or code required
- **One-Click Actions**: Install apps, configure settings, manage files with simple clicks
- **Guided Setup**: Step-by-step configuration with clear labels and descriptions
- **Modern Design**: Beautiful, intuitive interface inspired by modern web applications

### 📱 **Marketplace**
- **Browse Applications**: Discover apps from the WebScreen-Awesome repository
- **Categories**: Apps organized by type (Featured, Utilities, Games, Productivity, Social)
- **Search**: Find apps quickly with the search function
- **One-Click Install**: Install any app with a single click
- **Auto-Updates**: Automatically shows new apps when added to the repository

### 📂 **File Manager**
- **Visual File Browser**: See all files on your WebScreen device
- **Drag & Drop Upload**: Simply drag files to upload them
- **File Actions**: Download, delete, and manage files easily
- **Folder Navigation**: Browse through directories with clicks

### ⚙️ **Device Settings**
- **System Configuration**: Set device name, timezone, auto-start apps
- **Network Setup**: Configure WiFi with a simple form
- **Display Settings**: Adjust brightness, orientation, and timeout with sliders
- **Live Preview**: See display changes in real-time

### 🎛️ **Dashboard**
- **Device Information**: View memory, storage, network status at a glance
- **Quick Actions**: Restart, backup, factory reset with one click
- **Current App**: See what's running and control it
- **Status Monitoring**: Real-time connection and device status

## Getting Started

### Requirements
- **Browser**: Chrome, Edge, or Opera (requires Web Serial API support)
- **WebScreen Device**: Connected via USB cable

### Installation
1. No installation needed! Just open `index.html` in a supported browser
2. The application runs entirely in your browser

### Usage

#### First Time Setup
1. **Open the Admin Panel**
   - Open `index.html` in Chrome, Edge, or Opera
   - You'll see the beautiful dashboard interface

2. **Connect Your WebScreen**
   - Click the "Connect Device" button in the top right
   - Select your WebScreen from the list
   - The status will show "Connected" when ready

3. **Configure WiFi**
   - Go to "Network" in the sidebar
   - Enter your WiFi network name and password
   - Click "Connect to WiFi"
   - Your device will restart and connect

#### Installing Apps

1. **Browse the Marketplace**
   - Click "Marketplace" in the sidebar
   - Browse by category or search for apps
   - Click on any app to see details

2. **Install an App**
   - Click on an app card
   - Review the app information
   - Click "Install" button
   - The app will download and start automatically

#### Managing Files

1. **Upload Files**
   - Go to "Files" in the sidebar
   - Drag and drop files onto the upload area
   - Or click "Browse Files" to select files

2. **Browse Files**
   - See all files on your device
   - Click folders to navigate
   - Use action buttons to download or delete

#### Configuring Settings

1. **System Settings**
   - Go to "Settings" in the sidebar
   - Enter device name and preferences
   - Select timezone
   - Choose app to auto-start
   - Click "Save Settings"

2. **Display Settings**
   - Go to "Display" in the sidebar
   - Adjust brightness with the slider
   - Select screen orientation
   - Set screen timeout
   - See preview of changes
   - Click "Save Display Settings"

## Interface Overview

### Sidebar Navigation
- **Dashboard**: Overview and quick actions
- **Marketplace**: Browse and install applications
- **Files**: Manage device files
- **Settings**: System configuration
- **Network**: WiFi setup
- **Display**: Screen settings

### Color-Coded Feedback
- **Green**: Successful actions
- **Blue**: Information messages
- **Yellow**: Warnings
- **Red**: Errors or important alerts

## Features for Non-Technical Users

### Simple Visual Controls
- **No coding required**: Everything is point-and-click
- **Clear labels**: Every setting has a descriptive label
- **Visual feedback**: Toast notifications for all actions
- **Confirmation dialogs**: Protection against accidental actions

### Smart Defaults
- **Pre-configured settings**: Works out of the box
- **Automatic app discovery**: New apps appear automatically
- **Smart categorization**: Apps organized by type
- **Helpful placeholders**: Form fields show example values

### Safety Features
- **Confirmation prompts**: For critical actions like factory reset
- **Connection status**: Always visible connection indicator
- **Disabled controls**: Buttons disabled when not connected
- **Clear error messages**: Understandable feedback when issues occur

## Troubleshooting

### Can't Connect to Device
1. Make sure WebScreen is connected via USB
2. Check that you're using Chrome, Edge, or Opera
3. Try a different USB cable or port
4. Restart your WebScreen device

### Apps Won't Install
1. Ensure device is connected
2. Check available storage on device
3. Try refreshing the page
4. Verify internet connection for app downloads

### WiFi Won't Connect
1. Double-check network name (case sensitive)
2. Verify password is correct
3. Ensure network is 2.4GHz (not 5GHz only)
4. Device will restart after WiFi configuration

### Files Won't Upload
1. Check file size (must be reasonable for device)
2. Ensure device has available storage
3. Try smaller files first
4. Check file format compatibility

## Technical Details

### Architecture
- **Pure Web Application**: No server or installation required
- **Web Serial API**: Direct USB communication
- **GitHub Integration**: Auto-loads apps from WebScreen-Awesome repository
- **Modern JavaScript**: ES6+ with async/await
- **Responsive Design**: Works on desktop and tablet

### Browser Support
- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Opera 75+
- ❌ Firefox (no Web Serial API)
- ❌ Safari (no Web Serial API)

### File Structure
```
WebScreen-Admin/
├── index.html        # Main application
├── styles.css        # Modern, gradient-based styling
├── app.js           # Application logic
├── serial.js        # Serial communication
├── assets/          # Images and icons
└── README.md        # This documentation
```

## Design Philosophy

This admin interface was created with non-technical users in mind:

- **Visual over textual**: Icons, colors, and visual feedback instead of text commands
- **Progressive disclosure**: Advanced features hidden until needed
- **Forgiving interactions**: Confirmation dialogs and undo options
- **Consistent patterns**: Similar actions work the same way everywhere
- **Modern aesthetics**: Beautiful gradients and smooth animations

## Contributing

We welcome contributions that make WebScreen even easier to use! Focus areas:

- **Simplifying workflows**: Making common tasks even easier
- **Visual improvements**: Better icons, clearer layouts
- **Error handling**: More helpful error messages
- **Documentation**: Clearer instructions and tutorials
- **Accessibility**: Support for screen readers and keyboard navigation

## Support

- **WebScreen Hardware**: [CrowdSupply](https://www.crowdsupply.com/hw-media-lab/webscreen)
- **GitHub Issues**: [Report problems or suggestions](https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Software/issues)
- **Community**: [WebScreen Website](https://webscreen.cc)

## License

This project is part of the WebScreen ecosystem and follows the same licensing terms.

---

**WebScreen Admin** - Making WebScreen accessible to everyone, regardless of technical expertise!
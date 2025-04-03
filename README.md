# Read Aloud - Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Chrome extension that reads web pages aloud with word highlighting, providing an accessible and convenient way to consume web content.

![Read Aloud Screenshot](extension/icons/icon128.png)

## 🌟 Features

-   **Word Highlighting**: Follow along with real-time highlighting as text is read
-   **Adjustable Speed**: Customize reading speed up to 4x
-   **Floating Control Bar**: Easy access to play, pause, and settings controls
-   **Read from Selection**: Start reading from any selected text on the page
-   **Context Menu Integration**: Right-click on selected text to start reading
-   **Smart Scrolling**: Automatically scrolls to keep the current text in view
-   **Customizable Voice**: Choose from available system voices and adjust pitch

## 📋 Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Technology Stack](#technology-stack)
-   [Contributing](#contributing)
-   [License](#license)
-   [Contact](#contact)

## 🔧 Installation

### Method 1: Manual Installation (Developer Mode)

1. **Download the Extension**

    - Clone this repository or download it as a ZIP file
    - If downloaded as ZIP, extract the contents to a folder

    ```bash
    git clone https://github.com/chirag127/Read-aloud.git
    ```

2. **Open Chrome Extensions Page**

    - Open Chrome and navigate to `chrome://extensions/`
    - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**

    - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**

    - Click the "Load unpacked" button
    - Select the `extension` folder from the downloaded repository

5. **Verify Installation**
    - The Read Aloud extension should appear in your extensions list
    - The extension icon should be visible in your Chrome toolbar

## 🎮 Usage

### Starting Read Aloud

1. **From the Extension Popup**:

    - Click the Read Aloud icon in your browser toolbar
    - Click the "Start Reading" button in the popup

2. **From Selected Text**:
    - Select any text on a webpage
    - Right-click and choose "Read from this text" from the context menu

### Using the Control Bar

-   **Play/Pause**: Control reading playback
-   **Stop**: Stop reading completely
-   **Settings**: Adjust reading speed, pitch, and voice
-   **Move**: Click and drag to reposition the control bar

### Adjusting Settings

-   Click the settings icon (⚙️) in the control bar
-   Adjust the reading speed (0.5x to 4.0x)
-   Adjust the pitch of the voice
-   Select from available system voices

## 💻 Technology Stack

-   **JavaScript**: Core programming language
-   **Chrome Extension API**: Browser integration
-   **Web Speech API**: Text-to-speech functionality
-   **HTML/CSS**: User interface components

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

-   **Report Issues**: [GitHub Issues](https://github.com/chirag127/Read-aloud/issues)
-   **Feature Requests**: [GitHub Issues](https://github.com/chirag127/Read-aloud/issues)

---

<p align="center">Made with ❤️ for better web accessibility</p>

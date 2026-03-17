# 🚀 QuickCopy Pro — The Premium Cloud Clipboard ☁️

[![GitHub version](https://img.shields.io/badge/version-2.1.0-blue.svg)](changelog.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/abhi340/quickcopy/graphs/commit-activity)

> <strong>“One-click copy. Zero drag. Pure Productivity.”</strong>

QuickCopy Pro is a <strong>high-performance, secure, and visually stunning cloud clipboard manager</strong>. Built with a modern Glassmorphism aesthetic, it allows you to sync text, links, and code snippets across all your devices in real-time.

---

## ✨ Why QuickCopy Pro?

QuickCopy isn't just a list of texts; it's a <strong>professional-grade digital companion</strong> designed for developers, writers, and power users who need their data to follow them.

### 🌟 Premium Features
- <strong>📱 PWA Support:</strong> Install QuickCopy on your desktop or mobile for a native app experience with offline support.
- <strong>🧱 Masonry Layout:</strong> A beautiful Pinterest-style flow that optimizes vertical space (3 columns on PC, 1 on Mobile).
- <strong>🔗 Public Sharing:</strong> Generate unique, view-only links for any snippet to share with colleagues or friends.
- <strong>✍️ Markdown Rendering:</strong> Toggle <strong>M↓</strong> to render beautiful formatted notes, lists, and code blocks.
- <strong>📦 Advanced Management:</strong> Keep your workspace clean with dedicated <strong>Archive</strong> and <strong>Trash</strong> folders.
- <strong>⚡ Power-User Shortcuts:</strong>
  - `Ctrl + Enter`: Instant Save
  - `Ctrl + F`: Global Search
  - `Alt + 1-9`: Instant Copy top clips
  - `Esc`: Clear search/modals

### 🔐 Security & Privacy
- <strong>End-to-End Hardening:</strong> Patched against XSS and attribute injection.
- <strong>DOMPurify Integration:</strong> Every markdown snippet is sanitized before rendering.
- <strong>Zero-Trust Architecture:</strong> Forced re-login on refresh and restricted Firestore rules.

---

## 🚀 Getting Started

### 🛠️ Prerequisites
- A modern web browser (Chrome, Edge, or Safari recommended for PWA).
- A [Firebase Project](https://console.firebase.google.com/).

### 📦 Installation
1.  <strong>Clone the repository:</strong>
    ```bash
    git clone https://github.com/abhi340/quickcopy.git
    cd quickcopy
    ```

2.  <strong>Configure Firebase:</strong>
    - Copy `firebase-config.example.js` to `firebase-config.js`.
    - Fill in your actual credentials from the Firebase Console.
    ```javascript
    // firebase-config.js
    export const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      // ... rest of your config
    };
    ```

3.  <strong>Launch the app:</strong>
    Simply open `index.html` in your browser or use a local server like <strong>Live Server</strong> in VS Code.

---

## 🛠️ Tech Stack
- <strong>Frontend:</strong> Vanilla JavaScript (ES Modules), HTML5, CSS3.
- <strong>Libraries:</strong> [Marked.js](https://marked.js.org/) (Markdown), [DOMPurify](https://github.com/cure53/dompurify) (Sanitization).
- <strong>Backend:</strong> Firebase Auth & Firestore Real-time Database.
- <strong>PWA:</strong> Service Workers & Manifest.json.

---

## 🤝 Collaboration & Contribution
QuickCopy Pro is a testament to the power of <strong>Human-AI Pair Programming</strong>, co-developed by <strong>[Abhi](https://github.com/abhi340)</strong> and <strong>Gemini (AI Pair Programmer)</strong>.

- <strong>Security issues?</strong> See [docs/SECURITY.md](docs/SECURITY.md).
- <strong>Interested in our process?</strong> Read the [docs/COLLABORATION.md](docs/COLLABORATION.md).
- <strong>What's coming next?</strong> Check the [docs/TODO.md](docs/TODO.md).

---

## 🙌 Credits
- <strong>Lead Developer:</strong> [Abhi](https://github.com/abhi340)
- <strong>AI Engineer:</strong> Gemini AI

---

👉 <strong>[Launch QuickCopy Pro Live](https://abhi340.github.io/quickcopy/)</strong>

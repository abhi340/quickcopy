# 🚀 QuickCopy Pro — The Premium Cloud Clipboard ☁️

[![GitHub version](https://img.shields.io/badge/version-2.5.8-blue.svg)](changelog.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/abhi340/quickcopy/graphs/commit-activity)
[![Powered by Cloudflare](https://img.shields.io/badge/Powered%20By-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)

> <strong>“One-click copy. Zero drag. Pure Productivity.”</strong>

QuickCopy Pro is a <strong>high-performance, secure, and visually stunning cloud clipboard manager</strong>. Built with a modern Glassmorphism aesthetic, it allows you to sync text, links, and code snippets across all your devices in real-time.

---

## 🌐 The QuickCopy Ecosystem

We've evolved from a simple web app into a fully integrated productivity ecosystem.

### 🧩 Browser Extension V2 (Chrome, Firefox, Edge)
The "Heart" of the Pro experience. Save anything from around the web without ever leaving your tab.
- **🚀 Right-Click Sync:** Highlight any text or link, right-click, and "Save to QuickCopy" instantly.
- **🔍 Global Search Popup:** Find and copy your cloud snippets directly from the browser toolbar.
- **🖱️ Premium Reordering:** Intuitive Drag-and-Drop management synced globally via a custom `priority` engine.
- **🔐 Native Auth:** Direct Google Sign-In within the extension using specialized Web Auth Flows.

### 💻 Web Dashboard
Your command center for deep snippet management and analytics.
- **⚡ Real-Time Sync:** Upgraded to Firestore `onSnapshot` listeners for zero-latency cross-device updates.
- **📱 PWA Support:** Native app experience on Mobile and Desktop with offline capabilities.
- **🧱 Masonry Layout:** Intelligent visual grid that optimizes vertical space.
- **✍️ Markdown Rendering:** Toggle **M↓** for beautiful code blocks and formatted notes.

---

## 🛠️ The "Human-AI" Development Story

QuickCopy Pro is a testament to the power of <strong>human-driven AI pair programming</strong>. This project was built through an intensive, high-velocity collaboration between **Abhiram (Lead Developer)** and **Gemini (AI Engineer)**.

### How we solved the hard problems:
1.  **The Auth Bridge:** To solve cross-browser OAuth2 restrictions, we architected a custom "Direct Sync Bridge" using `postMessage` and `chrome.storage.onChanged` to relay sessions between the website and the extension securely.
2.  **Global Ranking:** Instead of simple date sorting, we implemented a `doubleValue` priority system, allowing users to perform infinite drag-and-drop reordering without database collisions.
3.  **Cross-Browser Packaging:** We developed a specialized PowerShell pipeline that dynamically generates browser-specific `manifest.json` files for Chromium and Firefox, handling specific security headers and background script variations automatically.

---

## 🚀 Deployment & Tech Stack

### Infrastructure
- **Hosting:** [Cloudflare Workers/Pages](https://pages.cloudflare.com/) — Global CDN delivery with edge performance.
- **Database:** [Firebase Firestore](https://firebase.google.com/) — Real-time NoSQL synchronization.
- **Auth:** [Firebase Authentication](https://firebase.google.com/) — Multi-platform secure identity provider.

### Core Tech
- **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3 (Glassmorphism).
- **Security:** Strict [DOMPurify](https://github.com/cure53/dompurify) sanitization and Zero-Trust architecture.
- **Packaging:** Native .NET `ZipArchive` normalization for cross-store compatibility.

---

## 🤝 Credits
- **Lead Developer:** [Abhiram](https://github.com/abhi340)
- **AI Engineer:** Gemini AI (Google)

---

👉 **[Launch QuickCopy Pro Live](https://quickcopy.abhicm019.workers.dev/)**

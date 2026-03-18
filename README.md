# 🚀 QuickCopy Pro — The Premium Cloud Clipboard ☁️

[![GitHub version](https://img.shields.io/badge/version-2.5.8-blue.svg)](changelog.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/abhi340/quickcopy/graphs/commit-activity)
[![Powered by Cloudflare](https://img.shields.io/badge/Powered%20By-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)

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
- <strong>📊 Productivity Analytics:</strong> Visual stats on your clip usage and storage health.
- <strong>⚡ Power-User Shortcuts:</strong>
  - `Ctrl + Enter`: Instant Save
  - `j / k`: Vim-style navigation
  - `y`: Instant Copy selected clip
  - `/`: Focus Search
  - `Esc`: Clear search/modals

---

## 🛠️ The "Human-AI" Development Story

QuickCopy Pro is a testament to the power of <strong>human-driven AI pair programming</strong>. This project was built through an intensive, high-velocity collaboration between **Abhiram (Lead Developer)** and **Gemini (AI Engineer)**.

### How we built this:
1.  **Ideation & Architecture:** Abhiram defined the vision for a "Digital Second Brain," while Gemini architected the robust Design System v5.0.
2.  **Iterative Refinement:** Every UI pixel—from the multi-line dynamic input box to the grid-based mobile header—was refined through dozens of real-time feedback loops.
3.  **Deployment:** Leveraging **Cloudflare Pages** for lightning-fast global edge hosting and **Firebase** for low-latency real-time synchronization.
4.  **Security First:** We jointly implemented strict Regex validations, Zero-Trust authentication flows, and E2E hardening.

---

## 🚀 Deployment & Tech Stack

### Infrastructure
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) — Global CDN delivery with automatic CI/CD.
- **Database:** [Firebase Firestore](https://firebase.google.com/) — Real-time NoSQL data synchronization.
- **Auth:** [Firebase Authentication](https://firebase.google.com/) — Secure Google and Email/Password flows.

### Core Tech
- **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3 (Glassmorphism).
- **Security:** [DOMPurify](https://github.com/cure53/dompurify) for sanitization.
- **Rendering:** [Marked.js](https://marked.js.org/) for high-speed Markdown parsing.

---

## 🚀 Getting Started

1.  **Clone:** `git clone https://github.com/abhi340/quickcopy.git`
2.  **Configure:** Copy `firebase-config.example.js` to `firebase-config.js` and add your keys.
3.  **Deploy:** Connect your repository to **Cloudflare Pages** for instant deployment.

---

## 🙌 Support the Vision
If QuickCopy Pro has helped your workflow, consider supporting the journey!
- **International:** [Buy Me a Coffee](https://www.buymeacoffee.com/abhiram)
- **India:** Pay via UPI (**abhiramkodicherla-1@oksbi**)

---

## 🤝 Credits
- **Lead Developer:** [Abhiram](https://github.com/abhi340)
- **AI Engineer:** Gemini AI (Google)

---

👉 **[Launch QuickCopy Pro Live](https://quickcopy.pages.dev/)**

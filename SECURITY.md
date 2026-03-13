# Security Policy

## Supported Versions

The following versions of QuickCopy are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability within QuickCopy, please report it privately. You can reach the maintainer via:

*   **Email:** [Your Email Address - Please Update This]
*   **GitHub Private Message:** [Link to your profile]

We aim to acknowledge all security reports within 48 hours and provide a fix or mitigation strategy within 7 business days.

## Our Security Philosophy

QuickCopy is built with a **Zero-Trust** mindset. While we prioritize convenience, we implement the following measures to ensure data integrity:

1.  **Firebase Security Rules:** All database operations are restricted to the authenticated owner of the data. No user can read or write snippets belonging to another UID.
2.  **Short-Lived Sessions:** Authentication persistence is set to `none`, meaning users are required to re-authenticate on page refresh/reload to prevent unauthorized access on shared devices.
3.  **Credential Protection:** We advocate for API Key restrictions (domain whitelisting) to ensure that exposed configuration files cannot be used outside of authorized environments.

## Secure Configuration

If you are forking or deploying this project, ensure you:
1.  **Restrict your Google API Keys** to your specific deployment domains in the Google Cloud Console.
2.  **Enable Firebase App Check** if you anticipate high traffic or potential abuse.
3.  **Regularly audit** your Firebase Authentication users and Firestore data usage.

---

> Thank you for helping keep QuickCopy safe for everyone! 🛡️

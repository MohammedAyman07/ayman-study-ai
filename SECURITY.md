# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Reporting a Vulnerability

We take the security of **AYMAN STUDY AI** very seriously. If you discover a security vulnerability or potential credential exposure:

1. **Do NOT open a public GitHub issue.**
2. Send an email to **security@aymaninfotech.com** or **aymaninfotechs@gmail.com** with details of the vulnerability.
3. Include:
   * A detailed description of the issue.
   * Steps or proof-of-concept to reproduce the behavior.
   * Potential impact on users or infrastructure.
4. You will receive an acknowledgment within 48 hours.

---

## API Key Security & Compliance

To protect user data and service quotas:
* **Private Secrets:** AI provider keys (Gemini, Groq, OpenRouter, Hugging Face), payment gateway secrets (Razorpay Secret Key), and database passwords must reside strictly in serverless runtime environment variables.
* **No Client Leakage:** The frontend Vite application never receives raw secret keys.
* **If an API Key is Compromised:**
  1. Immediately revoke and regenerate the compromised key in the respective provider dashboard (Google AI Studio, Groq Console, Razorpay Dashboard).
  2. Update the environment variable in Vercel project settings.
  3. Redeploy the application.
  4. Note that removing a key in a new commit does NOT remove it from Git commit history if previously pushed; keys must be invalidated at the vendor level.

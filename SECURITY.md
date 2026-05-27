# Security Policy

## Supported Versions

SPENDR is a continuously deployed web app. Only the **current production deployment** receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest production ([spendr-finance.netlify.app](https://spendr-finance.netlify.app)) | :white_check_mark: |
| `main` branch (pre-release) | :white_check_mark: |
| Older commits, tags, or forks | :x: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Where to report

Send a private email to:

- **Security reports:** [hello@techboi.design](mailto:hello@techboi.design)
- **Privacy / data rights (GDPR, export, deletion):** [privacy@spendr.app](mailto:privacy@spendr.app)

Subject line example: `SPENDR Security Report`

Include:

- A clear description of the vulnerability
- Steps to reproduce (URL, account type, screenshots if useful)
- The impact you believe it has
- Your contact details (optional, for follow-up)

### What to expect

| Stage | Timeline |
| ----- | -------- |
| Acknowledgment that we received your report | Within **5 business days** |
| Initial assessment or status update | Within **14 business days** |
| Fix deployed (if accepted and confirmed) | Depends on severity; we will keep you informed |

**If the report is accepted:** we will work on a fix, notify you when it is deployed, and (with your permission) may credit you in release notes.

**If the report is declined:** we will explain why (e.g. out of scope, not reproducible, third-party issue, or no security impact).

### Scope

**In scope:** unauthorized access to user data, auth/session flaws, Supabase RLS bypasses, exposed secrets, or other exploitable issues in the SPENDR app or its configuration.

**Out of scope:** social engineering, denial-of-service, issues in Netlify/Supabase/OpenAI infrastructure (report those vendors directly), or theoretical hardening without a working exploit.

### Good-faith research

Do not access, modify, or delete data that is not yours. Do not disrupt the service for other users. If you follow these rules and report in good faith, we will not pursue legal action against you for your research.

### Leaked credentials

If you find API keys or passwords in this repository or its history, report them privately **before** discussing them publicly. Do not use leaked credentials.

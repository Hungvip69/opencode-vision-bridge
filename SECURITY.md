# Security

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead, email the maintainer privately (see the repository owner page on GitHub) with:

- a description of the vulnerability,
- steps to reproduce,
- impact assessment.

You will receive a response within 5 business days. Coordinated disclosure is appreciated — please wait for a fix to be released before publicizing the issue.

## Key handling

This plugin reads API keys exclusively from plugin options or environment variables (`GEMINI_API_KEY`, `GOOGLE_API_KEY`, `VISION_BRIDGE_API_KEY`). Keys are never written to disk by the plugin and never logged.

## Trust boundaries

- Image payloads are transmitted to Google's Gemini API. On the free tier, Google may use inputs to improve its products — do not attach sensitive content without reviewing Google's terms.
- The plugin runs inside OpenCode with the same privileges as OpenCode itself. It only performs outbound requests to `generativelanguage.googleapis.com` (configurable via the plugin source).

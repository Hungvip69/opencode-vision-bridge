# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-08-09

### Added

- `experimental.chat.messages.transform` hook that replaces image parts with Gemini text descriptions for non-vision models
- Automatic targeting: known vision-capable providers (`anthropic`, `openai` GPT-4o/5/o3/o4, `google` Gemini, `xai`, `mistral` Pixtral, `groq` Llama-4) are excluded by default, everything else is transformed
- `includeModels` / `excludeModels` regex options against `provider/model`
- Environment variable configuration: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `VISION_BRIDGE_API_KEY`, `VISION_BRIDGE_MODEL`, `VISION_BRIDGE_INCLUDE`, `VISION_BRIDGE_EXCLUDE`
- Multi-image batching (all images in a message → one Gemini request)
- In-memory description cache keyed by image content
- Retry with exponential backoff on HTTP 429 / 5xx
- Zero dependencies: global `fetch` + `node:fs` only
- Unit tests (`node --test`) covering targeting, data-URI parsing, file loading, and cache keys
- Smoke script verifying the plugin loads and registers its hooks

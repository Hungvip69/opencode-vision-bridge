# opencode-vision-bridge

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success)](package.json)
[![Tests](https://img.shields.io/badge/tests-node%3Apassing-orange)](https://github.com/Hungvip69/opencode-vision-bridge/actions)
[![GitHub stars](https://img.shields.io/github/stars/Hungvip69/opencode-vision-bridge)](https://github.com/Hungvip69/opencode-vision-bridge/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Hungvip69/opencode-vision-bridge)](https://github.com/Hungvip69/opencode-vision-bridge/issues)
[![GitHub repo size](https://img.shields.io/github/repo-size/Hungvip69/opencode-vision-bridge)](https://github.com/Hungvip69/opencode-vision-bridge)

Give **vision to non-vision models** in [OpenCode](https://opencode.ai) — for free, using Google's Gemini API.

When you attach an image to a chat running on a text-only model (DeepSeek, Qwen, Llama, ...), the image is transparently sent to Gemini, described in exhaustive detail (including **verbatim transcription of every piece of text** in the image), and the description is delivered to your model instead. Vision-capable models are left completely untouched and keep seeing the raw image.

> Screenshots, UI bugs, diagrams, error messages — all become readable by text-only models.

## Features

- 🔍 **Automatic** — no prompt changes, no new tools for the model to learn. The transform happens at the request layer.
- 🎯 **Smart targeting** — only models that *cannot* see images get transformed. Vision models (Claude, GPT-4o/5, Gemini, Grok, Pixtral, ...) pass through untouched.
- 💸 **Free** — uses the [Gemini API free tier](https://ai.google.dev/gemini-api/docs) (`gemini-2.5-flash` by default, ~10 RPM / 1500 requests/day).
- 📦 **Zero dependencies** — plain JS, only global `fetch` and `node:fs`.
- ⚡ **Efficient** — multiple images in one message are sent as a single request; identical images are cached in-memory; retry with exponential backoff on rate limits.
- 🔐 **Private by default** — the key never touches your config file (read from the environment).
- ✂️ **Non-destructive** — if Gemini fails or no key is set, image parts pass through unchanged; your session never breaks.

## How it works

```
you paste an image
        │
        ▼
┌───────────────────────────────┐
│  experimental.chat.messages   │  ← hook installed by this plugin
│  .transform                   │
└───────────────┬───────────────┘
                │  model needs vision?
                │  (provider/model not in exclude list)
        no      ▼       yes
        ├─── image parts pass through untouched ───▶ vision model sees the raw image
        │
        ▼
   Gemini generateContent (free tier)
   - inline_data: base64 image(s)
   - prompt: "describe exhaustively, transcribe ALL text"
        │
        ▼
   detailed text description
        │
        ▼
   image parts replaced by a text part
        │
        ▼
   non-vision model receives the description
```

## Install

### Option A — npm (recommended, configurable)

```sh
npm i -g opencode-vision-bridge
```

Add it to `~/.config/opencode/opencode.json` (global) or `./opencode.json` (project):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-vision-bridge"]
}
```

### Option B — local file (no npm needed)

Copy `src/index.js` into your plugin directory:

```sh
# global
mkdir -p ~/.config/opencode/plugins && cp src/index.js ~/.config/opencode/plugins/vision-bridge.js
# or project-local
mkdir -p .opencode/plugins && cp src/index.js .opencode/plugins/vision-bridge.js
```

Files in `~/.config/opencode/plugins/` and `.opencode/plugins/` are auto-discovered — no config entry required.

### 1. Get a free Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API key**
2. Copy the key — both formats work: the new **`AQ.Ab...`** (Auth key, issued by default since mid-2026) and legacy **`AIza...`**
3. Export it:

```sh
# bash / zsh
export GEMINI_API_KEY="AQ.Ab..."
# Windows PowerShell
setx GEMINI_API_KEY "AQ.Ab..."
```

> The plugin also accepts `VISION_BRIDGE_API_KEY` or `GOOGLE_API_KEY`.

### 3. Restart OpenCode

Config is loaded once at startup — **quit and restart OpenCode** for the plugin to take effect.

## Configuration

Plugin options (only needed if you want to customize):

```json
{
  "plugin": [
    [
      "opencode-vision-bridge",
      {
        "apiKey": "{env:GEMINI_API_KEY}",
        "geminiModel": "gemini-2.5-flash",
        "includeModels": [],
        "excludeModels": ["anthropic/.*", "openai/gpt-4o.*"],
        "prompt": "Describe this image for a text-only LLM..."
      }
    ]
  ]
}
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | env | Gemini API key. Read from `apiKey` → `VISION_BRIDGE_API_KEY` → `GEMINI_API_KEY` → `GOOGLE_API_KEY`. |
| `geminiModel` | `string` | `gemini-2.5-flash` | Gemini model used for descriptions. |
| `includeModels` | `string[]` | `[]` | Regexes against `provider/model`. When set, **only** matching models are transformed (overrides exclusions). |
| `excludeModels` | `string[]` | built-in vision list | Regexes against `provider/model` that are **never** transformed. Defaults exclude every known vision-capable provider. |
| `prompt` | `string` | built-in | Custom description prompt sent to Gemini alongside the image. |

### Environment variables

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` / `VISION_BRIDGE_API_KEY` | Gemini API key. |
| `VISION_BRIDGE_MODEL` | Override the Gemini model. |
| `VISION_BRIDGE_INCLUDE` | Comma-separated regexes (same as `includeModels`). |
| `VISION_BRIDGE_EXCLUDE` | Comma-separated regexes, **appended** to the built-in vision list (same as `excludeModels`). |

## Usage

1. Start a session with any text-only model (e.g. a DeepSeek provider).
2. Paste an image into the input (screenshot, UI mockup, error dialog, diagram...).
3. The model receives a detailed description instead of a broken image part.

To verify it works, watch the OpenCode log output — the plugin logs `Describing N image(s) for <provider>/<model> via gemini-2.5-flash` at debug level.

## FAQ

**My vision model (via OpenRouter / custom provider) is being described instead of seeing the image.**
Add its pattern to `excludeModels` (or `VISION_BRIDGE_EXCLUDE=openrouter/.*`).

**I want to force transformation even for vision models.**
Set `includeModels: ["anthropic/.*"]`.

**What happens if Gemini is down or rate-limited?**
The plugin retries 4 times with exponential backoff, then leaves the image parts untouched. Your session continues normally.

**How do I change the Gemini model?**
`VISION_BRIDGE_MODEL=gemini-2.5-flash-lite` or the `geminiModel` option.

**Is my image data private?**
Images are sent to Google's Gemini API. Free-tier data may be used by Google to improve products (per Google's terms). Do not attach sensitive content, or use a paid tier / Vertex AI if this matters.

## Limitations

- Built on the `experimental.chat.messages.transform` hook — it is experimental and may change across OpenCode versions.
- Descriptions are text; the model never sees pixel-level detail (e.g. exact color hex values are approximated by Gemini).
- Free tier is rate-limited (~10 RPM, ~1500 requests/day depending on model).

## Development

```sh
npm test              # unit tests (node --test, no dependencies)
npm run smoke         # loads the plugin and verifies the hook surface
npm run check         # syntax check + tests
npm run pack:check    # inspect what npm pack would publish
```

## License

[MIT](./LICENSE) © hungvip69

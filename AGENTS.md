# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

`opencode-vision-bridge` is an OpenCode plugin that gives vision to non-vision
models by replacing image parts with text descriptions from Google's free
Gemini API. See `README.md` for the full picture.

## Hard rules

- **Zero runtime dependencies.** The plugin must run anywhere OpenCode runs
  (Bun runtime). Only global `fetch` and Node built-ins (`node:fs`,
  `node:crypto`, `node:url`, `node:path`) are allowed. Never add an npm
  dependency to `src/`.
- **Non-destructive by design.** On any failure (no key, Gemini error, rate
  limit), image parts must pass through the transform untouched. Never throw
  from the hook.
- **No secrets.** Never hardcode, log, or commit API keys. Config examples
  use `{env:GEMINI_API_KEY}` or redacted placeholders.
- **Language:** plain JavaScript with JSDoc (the package is shipped as-is,
  no build step). Every exported helper needs a docblock.

## Layout

- `src/index.js` — the plugin entry (`VisionBridge` named + default export) and
  exported pure helpers: `shouldTransform`, `parseDataUri`, `resolveFilePath`,
  `loadImage`, `cacheKey`, `describeImages`, `DEFAULT_EXCLUDE_MODELS`,
  `DEFAULT_DESCRIBE_PROMPT`.
- `test/index.test.js` — unit tests using Node's built-in `node:test` and
  `node:assert/strict`. Helpers are exported precisely so they can be tested
  without an OpenCode runtime.
- `scripts/smoke.mjs` — loads the plugin with a fake client context and
  verifies the hook surface.
- `examples/` — sample `opencode.json` config and `.env.example`.
- `.github/` — issue templates and PR template.

## Commands

```sh
npm test            # unit tests
npm run smoke       # smoke test: plugin loads + hooks registered
npm run check       # syntax check + tests
npm run pack:check  # what npm pack would publish
```

## Behavior contract (do not break)

1. `experimental.chat.messages.transform` runs on every outgoing request.
2. A message is only touched if its `info.model` matches (no model info →
   untouched). No `includeModels` configured → transform everything not in
   `excludeModels` (defaults: `DEFAULT_EXCLUDE_MODELS`).
3. Image parts are `{ type: "file", mime: "image/*", url }` parts. URLs may be
   base64 data URIs, `file://` URLs, or plain paths.
4. All images in one message are described in a single Gemini request;
   results are cached by content hash.
5. The first image part is replaced with one text part; the rest are removed.
6. Keys: `apiKey` option → `VISION_BRIDGE_API_KEY` → `GEMINI_API_KEY` →
   `GOOGLE_API_KEY`. Missing key = plugin is a no-op (with one warn log).

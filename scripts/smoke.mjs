/**
 * Smoke test: verifies the plugin module loads, exposes a valid plugin
 * function, and returns the expected hook surface when invoked.
 *
 * Run with: npm run smoke
 */

import { VisionBridge, shouldTransform } from "../src/index.js"

const fatal = (msg) => {
  console.error(`smoke: FAIL - ${msg}`)
  process.exit(1)
}

if (typeof VisionBridge !== "function") fatal("VisionBridge is not a function")

const ctx = {
  client: {
    app: {
      log: () => {},
    },
  },
}

const hooks = await VisionBridge(ctx, {})
if (!hooks) fatal("plugin returned no hooks")
if (typeof hooks["experimental.chat.messages.transform"] !== "function") {
  fatal("missing experimental.chat.messages.transform hook")
}

if (shouldTransform("deepseek-v4-flash-0731", "deepseekk") !== true) {
  fatal("shouldTransform should transform non-vision models")
}

console.log("smoke: OK - plugin loads, hooks registered, non-vision detection works")

import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import {
  shouldTransform,
  parseDataUri,
  resolveFilePath,
  cacheKey,
  loadImage,
  DEFAULT_EXCLUDE_MODELS,
} from "../src/index.js"

test("shouldTransform: no model info -> never transform", () => {
  assert.equal(shouldTransform(undefined, undefined), false)
  assert.equal(shouldTransform("deepseek-v4", undefined), false)
  assert.equal(shouldTransform(undefined, "deepseekk"), false)
})

test("shouldTransform: non-vision model is transformed by default", () => {
  assert.equal(shouldTransform("deepseek-v4-flash-0731", "deepseekk"), true)
  assert.equal(shouldTransform("DeepSeek-V4-Flash-0731", "seek"), true)
})

test("shouldTransform: known vision providers are excluded by default", () => {
  assert.equal(shouldTransform("claude-sonnet-4-6", "anthropic"), false)
  assert.equal(shouldTransform("gpt-4o", "openai"), false)
  assert.equal(shouldTransform("gemini-2.5-flash", "google"), false)
  assert.equal(shouldTransform("grok-4", "xai"), false)
})

test("shouldTransform: DEFAULT_EXCLUDE_MODELS covers expected providers", () => {
  const all = DEFAULT_EXCLUDE_MODELS.join("\n")
  for (const p of ["anthropic", "openai", "google", "xai", "mistral", "groq"]) {
    assert.ok(all.includes(p), `default exclusions should mention ${p}`)
  }
})

test("shouldTransform: includeModels overrides exclusions", () => {
  assert.equal(shouldTransform("claude-sonnet-4-6", "anthropic", { includeModels: ["anthropic/.*"] }), true)
  assert.equal(shouldTransform("claude-sonnet-4-6", "anthropic", { includeModels: ["deepseekk/.*"] }), false)
})

test("shouldTransform: custom excludeModels wins over defaults", () => {
  assert.equal(shouldTransform("my-model", "my-provider", { excludeModels: ["my-provider/.*"] }), false)
  assert.equal(shouldTransform("my-model", "my-provider", { excludeModels: ["other/.*"] }), true)
})

test("parseDataUri: parses base64 payload and mime", () => {
  const parsed = parseDataUri("data:image/png;base64,aGVsbG8=")
  assert.deepEqual(parsed, { mime: "image/png", data: "aGVsbG8=" })
})

test("parseDataUri: defaults mime to image/png", () => {
  const parsed = parseDataUri("data:;base64,aGVsbG8=")
  assert.deepEqual(parsed, { mime: "image/png", data: "aGVsbG8=" })
})

test("parseDataUri: rejects non-base64 or non-data urls", () => {
  assert.equal(parseDataUri("https://example.com/x.png"), null)
  assert.equal(parseDataUri("data:text/plain,hello"), null)
  assert.equal(parseDataUri(""), null)
})

test("resolveFilePath: handles file:// URLs and plain paths", () => {
  const fileUrl = pathToFileURL(join("C:\\", "Users", "a.png")).href
  const resolved = resolveFilePath(fileUrl)
  assert.ok(resolved && resolved.endsWith("a.png"))
  assert.equal(resolveFilePath("not a file:// url".repeat(1)), resolve("not a file:// url".repeat(1)))
  assert.equal(resolveFilePath("file://"), null)
})

test("cacheKey: identical images produce identical keys, order-independent", () => {
  const a = { mime: "image/png", data: "AAAA" }
  const b = { mime: "image/png", data: "BBBB" }
  assert.equal(cacheKey([a, b]), cacheKey([a, b]))
  assert.equal(cacheKey([a, b]), cacheKey([b, a]))
  assert.notEqual(cacheKey([a, b]), cacheKey([a, a]))
})

test("loadImage: reads data URIs without touching the filesystem", async () => {
  const loaded = await loadImage({ url: "data:image/png;base64,aGVsbG8=", mime: "image/png" })
  assert.deepEqual(loaded, { mime: "image/png", data: "aGVsbG8=" })
})

test("loadImage: reads real files (file:// and plain path)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "vb-"))
  try {
    const file = join(dir, "shot.png")
    await writeFile(file, Buffer.from("fake-png"))
    const fromUrl = await loadImage({ url: pathToFileURL(file).href, mime: "image/png" })
    const fromPath = await loadImage({ url: file, mime: "image/png" })
    assert.deepEqual(fromUrl, { mime: "image/png", data: Buffer.from("fake-png").toString("base64") })
    assert.deepEqual(fromPath, { mime: "image/png", data: Buffer.from("fake-png").toString("base64") })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("loadImage: returns null for missing files", async () => {
  assert.equal(await loadImage({ url: join(tmpdir(), "definitely-missing.png") }), null)
  assert.equal(await loadImage({ url: "" }), null)
})

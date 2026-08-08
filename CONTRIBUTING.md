# Contributing

Thanks for taking the time to contribute!

## Getting started

```sh
git clone https://github.com/hungvip69/opencode-vision-bridge.git
cd opencode-vision-bridge
npm install   # only needed for type hints — runtime has zero deps
npm test
```

## Development workflow

1. **Fork** the repository and create a branch: `git checkout -b feat/my-change`
2. Make your change in `src/index.js`. Keep it **dependency-free** — the plugin must run anywhere OpenCode runs.
3. Add or update tests in `test/index.test.js` (uses Node's built-in `node:test` — no test framework required).
4. Run the full check: `npm run check` (syntax + tests) and `npm run smoke`.
5. Update `CHANGELOG.md` and `README.md` when behavior or options change.
6. Open a pull request describing what changed and why.

## Guidelines

- Pure helpers (`shouldTransform`, `parseDataUri`, `loadImage`, `describeImages`, ...) are exported from `src/index.js` — keep them free of OpenCode runtime dependencies so they stay unit-testable.
- Use environment variables for secrets; never hardcode keys.
- Follow the existing JSDoc style; every exported function has a docblock.
- Keep the plugin non-destructive: on any failure, image parts must pass through untouched.

## Reporting issues

Include your OpenCode version, the model/provider you used, and the relevant log output (`debug` level) when reporting a bug.

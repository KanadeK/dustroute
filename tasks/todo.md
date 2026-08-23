# DustRoute v0.1 task list

## Task 1: Project contract and fixtures

- [x] Add package/configuration files, v1 example projects, and validation tests.
- Acceptance: valid fixture passes; malformed/duplicate/reference/monotonicity cases fail with stable issue paths.
- Verify: focused validation test fails before implementation and passes afterward.
- Files: `package.json`, `examples/*.json`, `tests/validation.test.js`, `src/core/validate.js`.

## Task 2: Physics and operating point

- [x] Implement unit conversions, friction factor, segment loss, fan interpolation, and deterministic intersection.
- Acceptance: hand-calculated anchors meet stated tolerances; no-intersection boundaries are explicit.
- Verify: focused physics tests plus full suite.
- Files: `src/core/units.js`, `src/core/physics.js`, `src/core/fan.js`, `tests/physics.test.js`.

## Task 3: Project analysis

- [x] Produce route verdicts, constraint margins, loss breakdowns, and plot samples.
- Acceptance: passing and failing fixtures have correct stable verdicts and governing issues.
- Verify: integration tests and coverage.
- Files: `src/core/analyze.js`, `tests/analyze.test.js`, fixture adjustments.

### Checkpoint: Core

- [x] `npm test` and `npm run test:coverage` pass.
- [x] Numeric anchors and physical claim boundaries reviewed.

## Task 4: CLI and reports

- [x] Implement analyze/check, three formats, usage errors, and exit codes.
- Acceptance: real child-process tests prove output and 0/1/2 exit semantics.
- Verify: CLI tests and `npm run check`.
- Files: `bin/dustroute.js`, `src/core/report.js`, `tests/cli.test.js`.

## Task 5: Browser workbench

- [ ] Implement local JSON import/edit, sample load, result summary, route detail, curve SVG, and downloads.
- Acceptance: all actions work without remote requests and imported strings are rendered as text.
- Verify: browser/build tests plus isolated runtime inspection.
- Files: `web/index.html`, `web/app.js`, `web/styles.css`, `tests/build.test.js`.

## Task 6: Build and local server

- [ ] Build a deployable `dist/` tree and serve it locally without dependencies.
- Acceptance: imports resolve under a repository Pages base path; unknown paths fail cleanly.
- Verify: build tests and localhost browser load.
- Files: `scripts/build.mjs`, `scripts/serve.mjs`, `package.json`, `tests/build.test.js`.

### Checkpoint: Executable product

- [ ] CLI and browser agree on the same example.
- [ ] Console, accessibility tree, keyboard flow, and target viewports pass.

## Task 7: Documentation and automation

- [ ] Complete bilingual README, usage/equations/troubleshooting, changelog, policies, CI, and Pages.
- Acceptance: clone-to-result and failure repair are copy-pasteable; workflows use current official Actions.
- Verify: document link check, syntax/build/check/package gates.
- Files: `README.md`, `README.zh-CN.md`, `docs/*`, `.github/workflows/*`, policy files.

## Task 8: Review and local release gate

- [ ] Review correctness, simplicity, architecture, security, performance, and requirement coverage; fix all required findings.
- Acceptance: clean Git status, intended author identity, no co-author trailers/secrets, every success criterion evidenced.
- Verify: one final changed-state gate and package inspection.

## Task 9: Public release and notification

- [ ] Create `KanadeK/dustroute`, push main, wait for CI/Pages, create immutable `v0.1.0`, publish Release artifact, verify contributor list, send Gmail.
- Acceptance: public repo, Pages, tag, Release, assets, checks, and sent message are remotely confirmed.
- Verify: remote URLs/API/Actions and Gmail message ID.

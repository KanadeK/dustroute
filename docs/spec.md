# Spec: DustRoute v0.1

## Objective

Build a real, local-first CLI and browser workbench that estimates the operating point of each one-open-gate woodshop dust-collection route from explicit user data. A successful release lets a user clone the repository, run a supplied project, inspect route and segment evidence, modify the input, reproduce the result in the browser or CLI, and use `check` as a failing quality gate.

Target user: hobbyist or small-shop woodworker who has a collector fan curve and can describe proposed routes, but wants something more transparent than a single CFM heuristic and simpler than general HVAC software.

## Assumptions

1. v0.1 evaluates one tool route at a time with other blast gates closed.
2. Public input uses inches, feet, CFM, FPM, and inches water gauge; the calculation core converts to SI.
3. Every physical planning value comes from the project JSON. DustRoute does not silently invent real-shop design values.
4. The browser app is a static, offline-capable-after-load site with no backend, account, telemetry, or external requests.
5. Node.js 22 and 24 are the supported local/CI runtimes.

## Tech stack

- ECMAScript modules on Node.js 22/24
- Node built-in `node:test`, `assert`, `fs`, `http`, and `crypto`
- Browser-native HTML, CSS, JavaScript, and SVG
- GitHub Actions and GitHub Pages
- No runtime or development dependencies

## Public project contract

The v1 JSON document contains:

- `schemaVersion: 1`
- `project`: display name and optional notes
- `air`: density in kg/m3 and kinematic viscosity in m2/s
- `fanCurve`: two or more `{ cfm, pressureInWg }` points ordered by increasing CFM and non-increasing pressure, beginning at zero CFM and ending at zero pressure
- `segments`: uniquely named round-duct segments with length, diameter, roughness, loss multiplier, and explicit fitting K values
- `routes`: uniquely named tool routes with a target CFM, minimum transport FPM, and ordered segment IDs

Boundary errors use one stable shape:

```js
{
  code: "INVALID_PROJECT",
  issues: [{ path: "fanCurve[1].cfm", message: "must be greater than the previous point" }]
}
```

The core public functions are additive and documented:

```js
const project = validateProject(untrustedJson);
const analysis = analyzeProject(project);
const markdown = renderMarkdownReport(analysis);
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run unit and integration tests |
| `npm run test:coverage` | Run tests with Node coverage |
| `npm run lint` | Parse-check every shipped JavaScript module |
| `npm run build` | Build the static app into `dist/` |
| `npm run check` | Run the passing example as a CI gate |
| `npm start` | Build and serve the browser workbench on localhost |
| `node bin/dustroute.js analyze examples/garage-shop.json` | Human-readable analysis |
| `node bin/dustroute.js analyze examples/garage-shop.json --format json` | Machine-readable analysis |
| `node bin/dustroute.js check examples/garage-shop.json` | Exit 1 when any route misses a stated constraint |

## Project structure

```text
bin/                 CLI entry point
src/core/            validation, units, physics, analysis, reporting
web/                 browser UI source
examples/            deterministic runnable projects
tests/               unit, integration, CLI, build, and browser smoke tests
scripts/             static build and local server
docs/                research, usage, equations, and architecture decisions
tasks/               implementation plan and completion checklist
.github/workflows/   CI and Pages deployment
```

## Code style

Use small pure functions, explicit names, and boundary validation. Do not add defensive checks between trusted core functions.

```js
export function velocityMps(flowM3s, diameterM) {
  const areaM2 = Math.PI * (diameterM / 2) ** 2;
  return flowM3s / areaM2;
}
```

- Two-space indentation, semicolons, single quotes in JavaScript
- Named exports; no default exports in core modules
- JSDoc on exported contracts and non-obvious equations
- Tests describe behavior and assert outcomes, not implementation calls

## Calculation behavior

1. Convert public units to SI.
2. For each route and candidate flow, calculate segment velocity and Reynolds number.
3. Use `64 / Re` for laminar flow and the Zigrang-Sylvester Colebrook approximation documented by NIST FDS for turbulent flow; reject route input that cannot produce a finite calculation.
4. Calculate segment loss coefficient as wall friction `f * L / D` plus explicit fitting K, then apply the user-supplied loss multiplier.
5. Sum dynamic-pressure losses and convert Pa to inches water gauge.
6. Linearly interpolate the supplied fan curve.
7. Find the highest non-negative intersection of fan pressure and system loss within the supplied curve using deterministic bisection.
8. Compare operating airflow and every segment's velocity with the route's explicit constraints.

The output includes the operating airflow/pressure, target margins, route verdict, per-segment loss and velocity, governing issues, and a sampled fan/system curve for visualization.

## Testing strategy

- Unit: conversions, friction factor, fan interpolation, pressure loss, intersection, validation
- Integration: passing and failing project fixtures through the complete analysis/report pipeline
- CLI: real child process, output formats, exit codes, malformed input
- Browser/build: built files exist, imports resolve, the same example renders without network dependencies
- Runtime: isolated localhost browser, clean console, keyboard flow, accessibility structure, responsive screenshots

No test is skipped. Numeric tests use published equations or independently hand-calculated fixtures with stated tolerances.

## Security and trust boundaries

- Validate imported JSON at the CLI and browser boundaries.
- Browser import maximum: 1 MiB; no URL import and no network fetch.
- Render user strings only through DOM text nodes.
- CLI never executes project content and never constructs shell commands from it.
- No secrets, accounts, cookies, local storage, telemetry, or third-party scripts.
- Physical results are estimates from user data, not certification or professional acceptance.

## Success criteria

- [ ] A supplied three-route project produces stable operating points and per-segment evidence in CLI and browser.
- [ ] A deliberately undersized/failing project makes `check` exit 1 and names the failed constraints.
- [ ] Malformed, cyclic-by-reference, duplicate, non-monotonic, and non-physical boundary inputs fail fast with paths.
- [ ] Terminal, JSON, and Markdown reports are generated from the same analysis object.
- [ ] Browser import, example load, analysis, report download, fan/system plot, and route breakdown work without a server API.
- [ ] Browser console has no errors/warnings; keyboard order, labels, headings, live result updates, and 320/768/1024/1440 layouts pass runtime inspection.
- [ ] `npm test`, `npm run test:coverage`, `npm run lint`, `npm run build`, `npm run check`, and `npm pack --dry-run` pass locally.
- [ ] CI passes on Node 22 and 24; Pages deploys the built app.
- [ ] Public repository, immutable `v0.1.0` tag, GitHub Release artifact, changelog, and contributor identity are verified.
- [ ] README includes copy-paste acceptance and an explicit failure-repair decision tree in English and Chinese.
- [ ] Gmail notification is sent only after remote repository, CI, Pages, tag, and Release are confirmed.

## Boundaries

- Always: keep spec/tests/docs in sync, run focused tests per slice, validate external input, commit only green slices.
- Ask first: breaking the v1 schema or adding a dependency after release.
- Never: skip failing gates, fabricate real-shop values, call results certified, add hidden network behavior, rewrite a published tag.

## Open questions

None block v0.1. The user delegated direction and release authority; later multi-gate or measured-data work requires new evidence and a new specification.

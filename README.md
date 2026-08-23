# DustRoute

[中文说明](README.zh-CN.md) · [Live workbench](https://kanadek.github.io/dustroute/) · [Example project](examples/garage-shop.json) · [Equations](docs/equations.md)

[![CI](https://github.com/KanadeK/dustroute/actions/workflows/ci.yml/badge.svg)](https://github.com/KanadeK/dustroute/actions/workflows/ci.yml)
[![Pages](https://github.com/KanadeK/dustroute/actions/workflows/pages.yml/badge.svg)](https://github.com/KanadeK/dustroute/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-0a716d.svg)](LICENSE)

**A transparent fan-curve × duct-route solver for one-gate-at-a-time woodshop dust collection.**

DustRoute takes your collector fan curve, explicit duct segments, and per-tool constraints. It calculates each route's operating point, pressure-loss breakdown, transport velocity, and pass/fail margin in a local CLI and a no-login browser workbench powered by the same core.

![DustRoute browser workbench](docs/assets/dustroute-preview.png)

## Why this exists

Single-number CFM calculators hide the relationship that matters: the collector supplies pressure according to its fan curve while the route consumes pressure according to airflow. Layout tools can draw a duct without proving where those two curves meet.

DustRoute keeps that relationship visible:

- piecewise-linear interpolation of the fan curve you supplied;
- Darcy–Weisbach wall loss plus explicit fitting K values per segment;
- deterministic bisection of the fan/system intersection;
- route airflow and every segment's velocity compared with your stated limits;
- terminal, JSON, Markdown, and browser results from one calculation core.

It does **not** invent a fan curve, universal safety threshold, fitting allowance, or equipment recommendation.

## Quick start

Requires Node.js 22 or 24.

```bash
git clone https://github.com/KanadeK/dustroute.git
cd dustroute
npm ci
npm run check
```

Expected result:

```text
PASS 3/3 routes

PASS Table saw  619.1 CFM @ 9.55 in. wg
PASS Planer     629.0 CFM @ 9.50 in. wg
PASS Miter saw  428.1 CFM @ 10.55 in. wg
```

Start the local browser workbench:

```bash
npm start
```

Open `http://127.0.0.1:4173`. The static app has no backend, account, telemetry, or third-party script.

## CLI

```bash
# Human-readable analysis
node bin/dustroute.js analyze examples/garage-shop.json

# Machine-readable result
node bin/dustroute.js analyze examples/garage-shop.json --format json

# Markdown report
node bin/dustroute.js analyze examples/garage-shop.json --format markdown

# CI gate: exits 1 when a stated route constraint fails
node bin/dustroute.js check examples/garage-shop.json
```

Exit codes are stable:

| Code | Meaning |
| ---: | --- |
| `0` | Analysis completed; for `check`, every route passed |
| `1` | `check` completed and at least one route missed a stated constraint |
| `2` | Usage, file, JSON, or project-validation error |

See [usage and project format](docs/usage.md) for every input field and output mode.

## Browser workbench

The live/static app can:

- load the passing three-tool example;
- import or paste a project JSON file up to 1 MiB;
- switch routes with pointer or arrow keys;
- plot the fan and route system curves;
- show per-segment velocity, pressure loss, and effective K;
- download the complete analysis as JSON or a Markdown report;
- keep analyzing after the page has loaded and the network is offline.

Imported labels are validated and rendered as text nodes. Browser data is never sent to a server.

## Use your own project

Copy [examples/garage-shop.json](examples/garage-shop.json), then replace **every physical value** with manufacturer data, measurements, or a value you explicitly chose:

```json
{
  "schemaVersion": 1,
  "project": { "name": "My shop" },
  "air": {
    "densityKgM3": 1.204,
    "kinematicViscosityM2S": 0.00001506
  },
  "fanCurve": [
    { "cfm": 0, "pressureInWg": 8.2 },
    { "cfm": 900, "pressureInWg": 4.1 },
    { "cfm": 1400, "pressureInWg": 0 }
  ],
  "segments": [
    {
      "id": "main",
      "label": "Main duct",
      "lengthFt": 20,
      "diameterIn": 5,
      "roughnessIn": 0.0006,
      "lossMultiplier": 1,
      "fittings": [
        { "label": "Long-radius elbow", "lossCoefficient": 0.2, "quantity": 2 }
      ]
    }
  ],
  "routes": [
    {
      "id": "planer",
      "label": "Planer",
      "targetCfm": 500,
      "minTransportFpm": 3500,
      "segmentIds": ["main"]
    }
  ]
}
```

The example values demonstrate the workflow; they are not design recommendations.

## Copy-paste acceptance

Run the complete local release gate from a clean checkout:

```bash
npm ci
npm test
npm run test:coverage
npm run lint
npm run build
npm run check
npm audit --audit-level=high
npm pack --dry-run
```

Verify the real failure path separately. This command is expected to print both failed constraints and exit `1`:

```bash
node bin/dustroute.js check examples/undersized-route.json
```

## If a command fails

Use the exit code and first concrete message; do not edit values merely to make the badge green.

1. **Exit `2`, field path shown** — fix that exact JSON field. Fan points must start at `0 CFM`, increase in CFM, never rise in pressure, and end at `0 in. wg`. Segment and route IDs must be unique and referenced segments must exist.
2. **Exit `1`, airflow below target** — inspect the route's largest pressure-loss segments, then verify the real fan curve, length, diameter, roughness, fitting K, and loss multiplier. Change only inputs that differ in the real system.
3. **Exit `1`, velocity below minimum** — inspect the named segment and re-check its diameter and the minimum you explicitly selected. DustRoute does not choose a replacement threshold for you.
4. **Build or test failure** — run `node --version` (22/24 required), remove only the generated `dist/` directory if it is stale, run `npm ci`, and retry the single failing command before the full gate.
5. **Result still looks implausible** — stop using the output as a decision basis. Re-check units and source data, compare against equipment documentation or measurements, and obtain qualified review where the consequence warrants it.

More cases are in [troubleshooting](docs/troubleshooting.md).

## Physics and claim boundary

DustRoute converts the public imperial inputs to SI, calculates Reynolds number and Darcy friction factor, combines wall and explicit minor losses, and solves the curve intersection. The exact equations, constants, transition rule, numeric anchors, and primary technical source are documented in [docs/equations.md](docs/equations.md).

This is a planning estimate from user-supplied values. It is not CFD, particle-capture modeling, simultaneous multi-gate balancing, code compliance, certification, or professional acceptance. Local exhaust guidance and equipment instructions still apply.

## Architecture

```text
project JSON ──> validate ──> shared calculation core ──> analysis object
                                      │                       ├─ terminal
                                      │                       ├─ JSON
                                      │                       ├─ Markdown
                                      └───────────────────────└─ browser/SVG
```

There are no runtime or development dependencies. The CLI and browser import the same ECMAScript modules under `src/core/`; the static build copies them unchanged into `dist/core/`. See [ADR-0001](docs/decisions/0001-zero-dependency-static-architecture.md).

## Scope

v0.1 intentionally supports one open blast gate at a time. It does not solve branched simultaneous flow, model capture efficiency or particles, design a floor plan, recommend equipment, or store projects in the cloud. Those are different products with different evidence requirements.

## Contributing and security

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Please report vulnerabilities using [SECURITY.md](SECURITY.md), not a public issue.

MIT © KanadeK. See [LICENSE](LICENSE).

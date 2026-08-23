# Implementation plan: DustRoute v0.1

## Overview

Build risk-first: prove the boundary contract and operating-point math before spending time on presentation. Then expose the same core through CLI and browser, add packaging/docs/automation, and only publish after local and remote gates pass.

## Dependency graph

```text
JSON v1 contract
  -> unit conversion and duct physics
     -> route operating-point analysis
        -> report model
           -> CLI commands and exit codes
           -> browser workbench and SVG plot
              -> build/package/CI/Pages
                 -> tag/Release/Gmail
```

## Architecture decisions

- One zero-dependency ESM calculation core serves Node and browser.
- Public input is explicit and versioned; SI is internal.
- One-open-gate route analysis is the v0.1 model boundary.
- Static Pages deployment has no backend or stored user data.

## Phases and checkpoints

### Phase 1: Contract and physics

1. Define package metadata, JSON fixtures, validation contract, and failing tests.
2. Implement units, friction, pressure loss, fan interpolation, and operating-point tests/logic.
3. Compose route/project analysis with deterministic output.

Checkpoint: all core tests pass and the sample has independently reviewed numeric anchors.

### Phase 2: Executable surfaces

4. Implement CLI analyze/check commands and terminal/JSON/Markdown reporters.
5. Implement the static workbench using the same core, including import, sample, plots, route evidence, and downloads.
6. Build and verify browser runtime, accessibility, responsive layouts, and clean console.

Checkpoint: the same fixture produces equivalent CLI and browser values; the failing fixture exits 1.

### Phase 3: Delivery

7. Complete English/Chinese docs, equation notes, troubleshooting, changelog, contribution/security policies, and assets.
8. Add CI, Pages workflow, deterministic build checks, package dry run, and release checklist.
9. Review all files against the spec, fix findings, run the complete gate, and commit the release candidate.
10. Create public remote, push, wait for CI/Pages, tag `v0.1.0`, publish assets, verify contributors, then email the final links.

Checkpoint: local and remote acceptance are both green; Gmail is sent only afterward.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Physically plausible but incorrect math | High | Source equations from NIST FDS; use hand-calculated anchors and curve-intersection tests |
| False safety confidence | High | Require explicit inputs; label estimates; exclude certification and purchasing claims |
| UI becomes a shell around fake output | High | Browser imports the tested core directly and exposes segment evidence |
| Browser/CLI drift | Medium | Run parity integration tests on the same fixture |
| GitHub CLI token remains invalid | Medium | Use existing Git credentials or authenticated GitHub connector where supported; retry HTTPS/HTTP1.1 paths; never claim publication until remotely verified |
| Pages first-run configuration fails | Medium | Use GitHub's official Pages workflow contract and enable the Actions source through the available authenticated route |

## Rollback

Before release, local Git commits are independent save points. After release, do not move `v0.1.0`; fix release defects on a new patch tag. Pages rollback uses a revert commit or a redeployment of the prior tagged static artifact.

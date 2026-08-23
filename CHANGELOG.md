# Changelog

All notable changes to DustRoute are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and releases use semantic versioning.

## [0.1.0] - 2026-08-23

### Added

- Versioned v1 project JSON with path-addressed boundary errors.
- Explicit non-finite calculation failure instead of `NaN`, infinity, or JSON `null` output.
- Darcy–Weisbach round-duct loss calculation, explicit fitting K values, fan interpolation, and deterministic operating-point solver.
- Per-route verdicts, margins, curve samples, and per-segment loss evidence.
- `analyze` and `check` CLI commands with terminal, JSON, and Markdown formats and stable 0/1/2 exit codes.
- Local-first static browser workbench with JSON import/edit, accessible route tabs, SVG curves, and report downloads.
- Passing and deliberately failing examples, numeric anchors, child-process tests, browser/build/server tests, CI, Pages deployment, and package artifact.
- English and Chinese quick starts, acceptance commands, formula documentation, and failure-repair guidance.

[0.1.0]: https://github.com/KanadeK/dustroute/releases/tag/v0.1.0

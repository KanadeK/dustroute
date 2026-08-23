# ADR-0001: Use one zero-dependency calculation core for CLI and browser

## Status

Accepted

## Date

2026-08-22

## Context

DustRoute must provide real calculations, a public live demo, reproducible CLI output, and a small trustworthy installation surface. The project has no need for a server, database, account, or framework-specific state layer. The highest technical risk is disagreement between two implementations of the physics, not UI scale.

## Decision

Use ECMAScript modules that run on Node.js 22/24 and in modern browsers. Put validation, unit conversion, fan interpolation, duct loss, operating-point analysis, and report generation in `src/core/`. Both the CLI and static browser app import those modules directly. Use only platform APIs and Node's stable built-in test runner.

The public JSON contract uses familiar woodshop imperial units while calculations convert to SI. All domain assumptions that can materially change a result remain explicit in the JSON.

## Alternatives considered

### React/Vite application plus a separate CLI package

- Pros: mature component ecosystem and fast UI authoring
- Cons: dependencies, bundling, duplicated package boundaries, and more supply-chain/runtime surface than the MVP needs
- Rejected: the interface is small and does not justify a framework.

### Python scientific stack

- Pros: NumPy/SciPy provide established numerical tools
- Cons: a browser demo would require a second runtime or WebAssembly layer, increasing packaging and parity risk
- Rejected: the solver only needs interpolation, Darcy-Weisbach calculations, and bisection.

### Hosted backend

- Pros: centralized project storage and analytics
- Cons: privacy, operations, auth, cost, telemetry questions, and no benefit to deterministic local calculations
- Rejected: violates the simplest useful architecture.

## Consequences

- Installation and audit surface stays small; `npm install` has no third-party packages.
- CLI/browser parity is testable against the same exported functions.
- UI components remain plain DOM code and must stay deliberately small.
- Advanced charts, PDF generation, and simultaneous-network solvers are not available unless later evidence justifies new scope.
- GitHub Pages can host the complete app and rollback is selecting a prior tagged artifact/commit.

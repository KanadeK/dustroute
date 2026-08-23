# DustRoute agent guide

## Product boundary

DustRoute is a local-first planning aid for one-open-gate-at-a-time woodshop dust-collection routes. It calculates transparent operating-point estimates from user-supplied fan curves and route parameters. It is not a certified engineering design, exposure assessment, or equipment recommendation system.

## Stack

- Node.js 22 or 24, ECMAScript modules
- Browser-native HTML, CSS, SVG, and JavaScript
- Node's built-in test runner
- Zero runtime and development dependencies

## Commands

- Test: `npm test`
- Coverage: `npm run test:coverage`
- Syntax check: `npm run lint`
- Build the static app: `npm run build`
- Run the acceptance gate: `npm run check`
- Start the local app: `npm start`

## Conventions

- Keep calculations pure and deterministic in `src/core/`.
- Validate JSON only at CLI/browser input boundaries; internal functions trust validated models.
- Use SI units inside calculations and domain-friendly imperial units at the public JSON boundary.
- Render imported text with `textContent`, never `innerHTML`.
- Keep CLI and browser behavior on the same core modules.
- Add a failing test before changing behavior.

## Boundaries

- Never invent fan curves, target airflow, transport velocity, roughness, or fitting-loss values for a user's real shop.
- Never describe a passing result as regulatory, industrial-hygiene, fire-code, or professional approval.
- Do not add dependencies unless the standard platform cannot meet a written requirement.
- Do not add multi-gate network balancing, CFD, cloud storage, accounts, telemetry, or purchasing recommendations to v0.1.
- Keep generated `dist/`, package artifacts, and local reports out of Git.

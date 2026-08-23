# Contributing

Thanks for improving DustRoute. Keep contributions inside its explicit scope: transparent one-open-gate route analysis from user-supplied values.

## Before opening a change

- For a bug, include the smallest project JSON that reproduces it, the command, actual output, expected output, Node version, and operating system.
- For a physics change, cite a primary technical source and state the numeric behavior that changes.
- For a schema or public-output change, open an issue first. Released v1 fields and exit codes are compatibility contracts.
- Simultaneous multi-gate balancing, CFD/particle modeling, built-in universal thresholds, equipment recommendations, accounts, and telemetry are outside v0.1 scope.

## Local workflow

```bash
git clone https://github.com/KanadeK/dustroute.git
cd dustroute
npm ci
npm test
npm run lint
npm run build
npm run check
```

Logic and behavior changes must start with a failing focused test, then pass the full suite. Do not add dependencies unless the need cannot be met by the supported Node/browser platforms and the tradeoff is documented.

Before submitting:

```bash
npm run test:coverage
npm audit --audit-level=high
npm pack --dry-run
git diff --check
```

## Style

- Two-space indentation, semicolons, and single quotes in JavaScript.
- Named exports in the calculation core.
- Validate only at untrusted JSON/file/network boundaries; trusted core functions consume validated values.
- Fail explicitly. Do not catch broad errors, silently default physical data, or add fallback calculations.
- Keep user-visible statements inside the planning-estimate boundary.

## Pull requests

Explain the user problem, the smallest chosen change, evidence, limitations, and exact verification commands. Keep unrelated cleanup out of the pull request. By contributing, you agree that your contribution is licensed under the repository's MIT license.

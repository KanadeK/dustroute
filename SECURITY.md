# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| `0.1.x` | Yes |
| Earlier/unreleased snapshots | No |

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not open a public issue containing exploit details, private project data, credentials, or a working payload.

Include:

- affected version or commit;
- entry point (CLI file, imported JSON, static browser, package, or workflow);
- minimal reproduction and impact;
- whether user interaction is required;
- any suggested mitigation.

You should receive an acknowledgement within seven days. Timing of a fix depends on severity and reproducibility; no private reward program is promised.

## Trust boundary

DustRoute validates imported JSON, limits browser file import to 1 MiB, rejects control characters in display strings, renders browser project text through text nodes, uses no remote scripts, and ships no dependencies. The local server applies a restrictive content-security policy and returns 404 for unknown paths.

The physics model is not a safety control. Incorrect, incomplete, or malicious project values can produce incorrect planning estimates without compromising the application. Treat result integrity and software security as separate concerns.

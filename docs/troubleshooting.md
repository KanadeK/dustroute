# Troubleshooting and repair flow

Start with the smallest failing command. The CLI prints deterministic field paths and constraint names so a repair can be tied to evidence.

## `dustroute` command is not found

Use the repository-local entry point:

```bash
node bin/dustroute.js analyze examples/garage-shop.json
```

Or install the generated artifact:

```bash
npm pack
npm install --global ./dustroute-0.1.0.tgz
```

## Exit code 2: file cannot be read

The message begins with `Input error: could not read project`.

1. Confirm the path is relative to the current directory or use an absolute path.
2. Confirm the file exists and the current user can read it.
3. Re-run the same command; do not change project physics values for a filesystem failure.

## Exit code 2: JSON cannot be parsed

The message begins with `Input error: could not parse JSON`.

Use an editor with JSON syntax support and fix the location named by Node. Common causes are comments, trailing commas, missing quotes, or a truncated file. DustRoute accepts JSON, not JSON5 or YAML.

## Exit code 2: project validation

Every issue includes a path such as:

```text
- routes[0].segmentIds[2]: references unknown segment "missing-segment"
```

Fix the named boundary:

| Message | Repair |
| --- | --- |
| `must equal 1` | Use the documented v1 format; do not relabel an incompatible document |
| `must be unique` | Give the duplicated segment/route a new lowercase-hyphen ID and update its references |
| `references unknown segment` | Correct the ID or add the actually missing segment |
| `must be greater than the previous point` | Sort/correct fan points so CFM strictly increases |
| `must not exceed the previous point` | Verify the entered fan data; pressure cannot rise in the v1 curve contract |
| `must equal 0 at the final point` | Include the fan curve's zero-pressure endpoint rather than extrapolating |
| `must be greater than 0` | Correct a zero/negative physical input from its source |

## Exit code 1: route constraint failure

This is a successful calculation and a failed user-defined condition, not a parser bug.

### Airflow below target

1. Read the route's per-segment pressure losses.
2. Verify the entered fan curve against the exact collector/configuration.
3. Verify length, inside diameter, roughness, fitting K/quantity, and multiplier for the largest-loss segments.
4. Change only values for which the real planned/measured system is different.
5. Re-run `check` and keep the before/after report if the change informs a real design decision.

### Segment velocity below minimum

1. Use the segment ID named in the issue.
2. Verify its diameter and the route's explicitly chosen minimum.
3. Do not lower the minimum only to make the test pass.
4. If the physical consequence matters, compare the result with equipment documentation, measurements, and qualified guidance.

The supplied failure fixture intentionally demonstrates both paths:

```bash
node bin/dustroute.js check examples/undersized-route.json
```

## Browser import rejected

- Imports are limited to 1 MiB. Remove unrelated data or use the CLI for investigation; do not split a single route across inconsistent project files.
- Imported control characters are rejected. Replace terminal escape/control bytes with normal display text.
- Browser and CLI validation use the same core, so reproduce a browser boundary error with the CLI to get one path per line.

## Local server will not start

Default address: `127.0.0.1:4173`.

If the port is already used, choose another for that process:

```powershell
$env:PORT = 4174
npm start
```

```bash
PORT=4174 npm start
```

The server returns a real 404 for unknown files; it does not silently serve the app shell.

## Build or test failure

```bash
node --version
npm ci
npm test
npm run lint
npm run build
```

Supported Node lines are 22 and 24. `dist/` is generated and ignored by Git. If an interrupted build left it stale, remove **only `dist/`**, then run `npm run build`. Do not delete the repository, examples, or source tree.

## Suspect numerical result

Run the shipped numeric anchors first:

```bash
node --test tests/physics.test.js
node --test tests/analyze.test.js
```

If they pass, the discrepancy is more likely in project inputs or model scope than a changed core. Check units, fan configuration, filter/duct state, and whether the one-open-gate assumption actually matches the system. Stop and seek qualified review rather than extending this small model into an unsupported use.

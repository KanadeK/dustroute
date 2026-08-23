# Usage and v1 project format

## Commands

```text
dustroute analyze <project.json> [--format terminal|json|markdown]
dustroute check <project.json> [--format terminal|json|markdown]
```

`analyze` returns a result whenever the input can be calculated; failed route constraints do not change its exit code. `check` is the CI form and exits `1` when any route fails. Input and usage failures exit `2`.

Run from the repository without installation:

```bash
node bin/dustroute.js analyze examples/garage-shop.json
```

Or create and install the package artifact:

```bash
npm pack
npm install --global ./dustroute-0.1.0.tgz
dustroute check examples/garage-shop.json
```

## Project object

The public format is versioned with `schemaVersion: 1`. Unknown versions fail instead of being guessed.

### `project`

| Field | Type | Rule |
| --- | --- | --- |
| `name` | string | Non-empty display name |
| `notes` | string | Optional; non-empty when present |

User-visible strings cannot contain terminal control characters.

### `air`

| Field | Unit | Rule |
| --- | --- | --- |
| `densityKgM3` | kg/m³ | finite and greater than zero |
| `kinematicViscosityM2S` | m²/s | finite and greater than zero |

DustRoute does not infer these values from location, temperature, or altitude.

### `fanCurve`

An array of at least two `{ cfm, pressureInWg }` points.

- first point: `cfm` must equal `0`;
- CFM must strictly increase;
- pressure must be finite, non-negative, and non-increasing;
- final point: `pressureInWg` must equal `0`.

DustRoute interpolates only inside this supplied domain and never extrapolates it.

### `segments`

Reusable round-duct segments:

| Field | Unit/type | Rule |
| --- | --- | --- |
| `id` | ID | unique lowercase letters, numbers, and hyphens |
| `label` | string | non-empty display label |
| `lengthFt` | ft | greater than zero |
| `diameterIn` | in | greater than zero |
| `roughnessIn` | in | zero or greater |
| `lossMultiplier` | ratio | `1` or greater |
| `fittings` | array | explicit fitting objects; may be empty |

A fitting has a non-empty `label`, a non-negative `lossCoefficient`, and a positive integer `quantity`. DustRoute sums `lossCoefficient × quantity` for the segment.

`lossMultiplier` applies to the combined wall-plus-fitting coefficient. It exists so the user can explicitly represent evidence such as a separately determined flex-hose multiplier; DustRoute does not assign it automatically.

### `routes`

| Field | Unit/type | Rule |
| --- | --- | --- |
| `id` | ID | unique lowercase letters, numbers, and hyphens |
| `label` | string | non-empty display label |
| `targetCfm` | CFM | greater than zero |
| `minTransportFpm` | FPM | greater than zero |
| `segmentIds` | ID array | ordered, non-empty, no repeats, every ID must exist |

Routes are evaluated independently under the v0.1 assumption that only that route's blast gate is open.

## Analysis output

The JSON form contains:

- `summary`: route counts and overall `pass`;
- `routes[]`: operating CFM/pressure, margins, verdict, and issues;
- `routes[].segments[]`: velocity, Reynolds number, friction factor, wall/fitting/effective K, and pressure loss;
- `routes[].curve[]`: 41 deterministic fan/system samples for visualization.

Constraint issues use stable codes:

- `AIRFLOW_BELOW_TARGET`
- `VELOCITY_BELOW_MINIMUM`

Boundary validation uses:

```json
{
  "code": "INVALID_PROJECT",
  "issues": [
    {
      "path": "fanCurve[1].cfm",
      "message": "must be greater than the previous point"
    }
  ]
}
```

If validated finite inputs still overflow or underflow during unit conversion or physics, DustRoute fails with `CALCULATION_ERROR`, the segment ID, and candidate CFM instead of emitting `NaN`, infinity, or JSON `null`.

## Browser import

The workbench accepts local `.json` files up to 1 MiB or pasted/edited text. It parses and validates in the browser, renders imported text using DOM text nodes, and makes no API request. The passing example is generated into the build from `examples/garage-shop.json`, preventing a separate browser fixture from drifting.

## Public JavaScript surface

```js
import { analyzeProject } from './src/core/analyze.js';
import { renderMarkdownReport } from './src/core/report.js';
import { validateProject } from './src/core/validate.js';

const project = validateProject(JSON.parse(source));
const analysis = analyzeProject(project);
const markdown = renderMarkdownReport(analysis);
```

Call `validateProject` at the untrusted JSON boundary. The calculation functions then trust the validated v1 object.

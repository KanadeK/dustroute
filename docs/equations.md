# Calculation method and numeric anchors

DustRoute v0.1 evaluates one route at a time. All public CFM/inch/foot inputs are converted to SI for the calculation, then display values are converted back.

Primary technical basis: the [NIST Fire Dynamics Simulator HVAC technical chapter](https://github.com/firemodels/fds/blob/master/Manuals/FDS_Technical_Reference_Guide/HVAC_Chapter.tex), which describes duct wall and minor losses, friction-factor treatment, and fan/system curve operating points. DustRoute implements a deliberately smaller round-duct subset; it is not an FDS wrapper or CFD model.

## Constants

```text
1 CFM       = 0.00047194745 m³/s
1 ft        = 0.3048 m
1 in        = 0.0254 m
1 Pa        = 1 / 249.08891 in. wg
1 m/s       = 196.8503937007874 FPM
```

## Velocity and Reynolds number

For volume flow `Q` and round-duct diameter `D`:

```text
A  = π (D / 2)²
v  = Q / A
Re = v D / ν
```

where `ν` is kinematic viscosity.

Numeric anchor used by the test suite: `500 CFM` through a `6 in` round duct is `12.9361139609 m/s`, or `2546.479126 FPM`. With `ν = 0.00001506 m²/s`, `Re = 130907.288688`.

## Darcy friction factor

For `Re ≤ 2300`, DustRoute uses the laminar relation:

```text
f = 64 / Re
```

For `Re > 2300`, it uses the explicit Zigrang–Sylvester approximation documented in the NIST FDS chapter:

```text
1 / √f = -2 log10(
  (ε/D)/3.7
  - (4.518/Re) log10(6.9/Re + ((ε/D)/3.7)^1.11)
)
```

`ε` is absolute roughness. v0.1 uses a hard boundary at `Re = 2300`; it does not blend a transitional regime. Woodshop route inputs should be reviewed if they unexpectedly operate near that boundary.

The turbulent numeric anchor at `Re = 130907.288688` and `ε/D = 0.0001` is `f = 0.0176516927373`.

## Segment pressure loss

Wall and fitting coefficients are combined before the explicit segment multiplier:

```text
K_wall      = f L / D
K_fittings  = Σ(K_i × quantity_i)
K_effective = (K_wall + K_fittings) × lossMultiplier
ΔP          = ½ ρ K_effective v²
```

For the tested 18 ft, 6 in smooth segment at 500 CFM with two `K = 0.2` elbows, `ρ = 1.204 kg/m³`, and multiplier `1`:

```text
K_wall      = 0.635460938543
K_fittings  = 0.4
K_effective = 1.035460938543
ΔP          = 104.3128658653 Pa
            = 0.418777639941 in. wg
```

Route system pressure is the sum of its ordered segment losses at the same candidate flow.

## Fan pressure and operating point

DustRoute linearly interpolates between adjacent supplied fan points. It does not extrapolate below `0 CFM` or beyond the final zero-pressure point.

The solver evaluates:

```text
residual(Q) = fanPressure(Q) - routeSystemPressure(Q)
```

The validated fan and positive-loss route bound the intersection between zero and the final fan-curve CFM. Deterministic bisection continues until the interval is below `0.000001 CFM` (maximum 60 iterations).

For the test fan `10 - 0.01Q` and system curve `0.00001Q²`, the expected intersection is:

```text
Q        = 618.03398875 CFM
pressure = 3.8196601125 in. wg
```

## Constraint verdict

At the operating point:

- airflow margin = operating CFM − route target CFM;
- per-segment velocity margin = segment FPM − route minimum FPM;
- a route passes only when airflow margin and every segment velocity margin are non-negative.

Targets are user inputs, not embedded recommendations.

## Limits of interpretation

The equations estimate steady incompressible duct pressure loss from the supplied data. They do not model leaks, filter loading changes, particle trajectories, hood capture, turbulence detail, simultaneous branch balancing, motor/electrical limits, noise, fire/explosion hazards, or regulatory compliance.

The [OSHA woodworking hazards publication](https://www.osha.gov/sites/default/files/publications/osha3157.pdf) identifies local exhaust ventilation at or near the source as a primary wood-dust control, but DustRoute does not turn that general guidance into a compliance or safety claim.

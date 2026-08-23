# DustRoute

## Problem statement

How might we help hobbyist and small-shop woodworkers turn a collector's real fan curve and a proposed duct layout into route-by-route evidence, without uploading shop data or pretending a quick calculator is a professional dust-control design?

## Recommended direction

Build a transparent operating-point workbench for the common one-open-blast-gate workflow. The user supplies the collector curve, air properties, duct dimensions, roughness, fitting loss coefficients, and the target airflow/transport velocity for each machine. DustRoute intersects the piecewise fan curve with each route's Darcy-Weisbach system curve, then reports airflow, velocity, pressure loss, constraint margins, and the segments responsible for the loss.

The wedge is not generic HVAC simulation and not another single-number CFM calculator. It is a small, auditable loop: model one shop, see which routes miss their stated targets, change one parameter, and compare the result in the browser or CLI using the exact same calculation core.

## Key assumptions to validate

- [x] Woodworkers repeatedly need to reason about route length, fittings, flex hose, and collector performance; public calculators and forum questions show the workflow exists.
- [x] Mature open-source results found during research are generic HVAC libraries or vendor-specific calibration tools, not a polished one-gate woodshop route workbench.
- [ ] Users can obtain a usable fan curve and route inputs from manufacturer data or measurements; the sample project proves the workflow but cannot validate real-world data availability.
- [ ] A transparent loss breakdown is more useful than a black-box equipment recommendation; future feedback after release must validate this bet.

## MVP scope

- Versioned JSON project format with explicit air properties, fan curve, reusable segments, and tool routes
- Boundary validation with actionable paths for invalid fields
- Piecewise fan-curve interpolation and deterministic route operating-point solver
- Per-segment pressure-loss breakdown and route constraint verdicts
- CLI `analyze` and CI-oriented `check` commands with terminal, JSON, and Markdown output
- Offline browser workbench that loads/pastes JSON, visualizes curves and route status, and exports reports
- Passing and failing deterministic fixtures, automated tests, CI, package artifact, Pages demo, and GitHub Release

## Not doing (and why)

- **Simultaneous multi-gate balancing** — requires a nonlinear branched-network solver and stronger validation evidence than v0.1 can responsibly provide.
- **CFD or particle capture simulation** — far beyond a small auditable tool and likely to create false confidence.
- **Built-in universal safety thresholds** — equipment manuals, materials, jurisdictions, and professional guidance take precedence; user inputs stay explicit.
- **Equipment shopping recommendations** — would mix engineering evidence with affiliate-like opinion and become stale.
- **Cloud accounts, telemetry, or stored projects** — local files are sufficient for the core job and preserve privacy.
- **Automatic CAD floor-plan design** — visually attractive but does not prove airflow performance.

## Open questions

- Whether a later version should accept measured fan-curve CSV in addition to the v1 JSON points.
- Whether user feedback supports a carefully scoped, separately validated simultaneous-gate solver.

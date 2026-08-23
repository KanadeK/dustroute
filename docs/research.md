# Research and differentiation notes

Research date: 2026-08-22

## Existing-project boundary

The surrounding workspace already contains many local-first developer, document, migration, printing, game, construction-cost, household, craft, hardware, and media preflight tools. DustRoute deliberately changes both domain and core mechanism: it is a physical airflow operating-point solver for woodshop duct routes, not another repository/document linter, migration checker, UI shell, or generic checklist.

## Directions considered

| Direction | User value | Feasibility | Differentiation | Decision |
| --- | --- | --- | --- | --- |
| Room-acoustics placement workbench | High | Medium | Low: AudioBro, Room Correction Helper, SiC Audio Room, and browser FEM tools already cover the space | Reject |
| N-of-1 experiment planner | High | Medium | Medium, but existing `nof1kit` and medical interpretation risk raise the bar | Reject |
| Packaging dieline preflight | High | Low | Medium, but overlaps existing print-preflight work and mature commercial tools | Reject |
| Manuscript continuity graph | Medium | Medium | Low: several new continuity engines and writing assistants are active | Reject |
| FFT moire diagnosis | Medium | Medium | Medium, but narrower pull and older GIMP/OpenCV workflows already exist | Hold |
| Wiring-harness validator | High | Medium | Medium, but too close to existing cable and PC-wiring planners | Reject |
| Garden seed-start planner | Medium | High | Low: many calendars and garden planners exist | Reject |
| Woodshop dust-route operating-point solver | High | Medium | High enough: public results skew toward one-off calculators, commercial layout/quote tools, or generic HVAC libraries | Build |

## Closest public alternatives

- [MyShopLayout](https://myshoplayout.org/) draws shop layouts and duct runs, but its public surface focuses on geometry rather than fan/system operating points.
- [The Wood Nerd](https://www.thewoodnerd.com/) exposes a dust-collection planner and calculators, but is not presented as a reusable open-source calculation core.
- [pyduct](https://github.com/TunaLobster/pyduct) provides generic HVAC duct calculations rather than a woodshop route workflow.
- [KanalKalk](https://github.com/SchildCode/KanalKalk) is a Norwegian ventilation workbook with a non-modifiable license, not an open browser/CLI project.
- Public CFM calculators commonly collapse length and bends into one heuristic. DustRoute instead accepts the user's fan curve and calculates a route system curve segment by segment.

This is evidence of a gap, not proof that no similar project exists anywhere. Repository search is name/description dependent, and commercial tools may keep their implementation private.

## Technical sources

- The [NIST Fire Dynamics Simulator HVAC technical chapter](https://github.com/firemodels/fds/blob/master/Manuals/FDS_Technical_Reference_Guide/HVAC_Chapter.tex) documents duct wall/minor-loss composition, friction-factor treatment, and the fan/system-curve operating-point concept used as the physics basis.
- The [OSHA woodworking hazards publication](https://www.osha.gov/sites/default/files/publications/osha3157.pdf) identifies local exhaust ventilation at or near the source as the primary wood-dust control method. DustRoute does not convert that statement into a compliance claim.
- [Node.js release status](https://nodejs.org/en/about/previous-releases) shows Node 22 and 24 are supported LTS lines on the research date; Node 20 is EOL.
- The [Node 24 test-runner documentation](https://nodejs.org/download/release/v24.13.1/docs/api/test.html) documents the stable built-in `node:test` runner and `node --test` command.
- [GitHub Pages custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) defines the artifact/deployment job permissions and environment used by this repository.

## Product claim boundary

Star or traffic outcomes cannot be guaranteed. The release is optimized for discoverability through a memorable name, a live no-login demo, a real sample, transparent equations, bilingual documentation, zero dependencies, and copy-paste acceptance commands. Adoption remains a market outcome after publication.

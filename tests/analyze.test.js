import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { analyzeProject } from '../src/core/analyze.js';
import { validateProject } from '../src/core/validate.js';

async function analyzeExample(name) {
  const source = await readFile(new URL(`../examples/${name}`, import.meta.url));
  return analyzeProject(validateProject(JSON.parse(source)));
}

function closeTo(actual, expected, tolerance) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test('analyzes every garage route with stable operating-point evidence', async () => {
  const analysis = await analyzeExample('garage-shop.json');

  assert.deepEqual(analysis.summary, {
    totalRoutes: 3,
    passingRoutes: 3,
    failingRoutes: 0,
    pass: true,
  });
  assert.deepEqual(
    analysis.routes.map((route) => route.id),
    ['table-saw', 'planer', 'miter-saw'],
  );
  closeTo(analysis.routes[0].operatingCfm, 619.064348564, 1e-6);
  closeTo(analysis.routes[1].operatingCfm, 629.022594169, 1e-6);
  closeTo(analysis.routes[2].operatingCfm, 428.128085658, 1e-6);

  for (const route of analysis.routes) {
    assert.equal(route.pass, true);
    assert.deepEqual(route.issues, []);
    closeTo(
      route.operatingPressureInWg,
      route.segments.reduce(
        (total, segment) => total + segment.pressureLossInWg,
        0,
      ),
      1e-8,
    );
    assert.equal(route.curve[0].cfm, 0);
    assert.equal(route.curve[0].systemPressureInWg, 0);
    assert.equal(route.curve.at(-1).fanPressureInWg, 0);
    assert.equal(route.curve.length, 41);
  }
});

test('names both governing constraints for the deliberately failing route', async () => {
  const analysis = await analyzeExample('undersized-route.json');
  const route = analysis.routes[0];

  assert.deepEqual(analysis.summary, {
    totalRoutes: 1,
    passingRoutes: 0,
    failingRoutes: 1,
    pass: false,
  });
  assert.equal(route.pass, false);
  assert.deepEqual(
    route.issues.map((issue) => issue.code),
    ['AIRFLOW_BELOW_TARGET', 'VELOCITY_BELOW_MINIMUM'],
  );
  assert.equal(route.issues[1].segmentId, 'long-flex');
  closeTo(route.operatingCfm, 244.584536878, 1e-6);
  closeTo(route.operatingPressureInWg, 4.130326593, 1e-8);
  assert.ok(route.airflowMarginCfm < 0);
  assert.ok(route.minimumVelocityMarginFpm < 0);
});

test('analysis is deterministic for the same validated project', async () => {
  const first = await analyzeExample('garage-shop.json');
  const second = await analyzeExample('garage-shop.json');

  assert.deepEqual(second, first);
});

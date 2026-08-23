import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cfmToM3s,
  ftToM,
  inchesToM,
  mpsToFpm,
  paToInWg,
} from '../src/core/units.js';
import {
  analyzeSegmentAtCfm,
  CalculationError,
  darcyFrictionFactor,
  reynoldsNumber,
  velocityMps,
} from '../src/core/physics.js';
import {
  fanPressureAtCfm,
  findOperatingPoint,
} from '../src/core/fan.js';

function closeTo(actual, expected, tolerance) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test('converts the public US customary units to SI and back to display units', () => {
  closeTo(cfmToM3s(500), 0.235973725, 1e-12);
  closeTo(ftToM(18), 5.4864, 1e-12);
  closeTo(inchesToM(6), 0.1524, 1e-12);
  closeTo(mpsToFpm(1), 196.8503937008, 1e-10);
  closeTo(paToInWg(249.08891), 1, 1e-12);
});

test('calculates velocity, Reynolds number, and both friction regimes', () => {
  const velocity = velocityMps(cfmToM3s(500), inchesToM(6));
  closeTo(velocity, 12.9361139609, 1e-10);
  closeTo(
    reynoldsNumber(velocity, inchesToM(6), 0.00001506),
    130907.288688,
    1e-6,
  );
  closeTo(darcyFrictionFactor(1600, 0.0001), 0.04, 1e-12);
  closeTo(
    darcyFrictionFactor(130907.288688, 0.0001),
    0.0176516927373,
    1e-12,
  );
});

test('calculates a segment loss from wall friction and explicit fitting K', () => {
  const segment = {
    id: 'main-trunk',
    label: 'Six-inch smooth main trunk',
    lengthFt: 18,
    diameterIn: 6,
    roughnessIn: 0.0006,
    lossMultiplier: 1,
    fittings: [
      { label: 'Long-radius elbow', lossCoefficient: 0.2, quantity: 2 },
    ],
  };
  const result = analyzeSegmentAtCfm(
    segment,
    { densityKgM3: 1.204, kinematicViscosityM2S: 0.00001506 },
    500,
  );

  closeTo(result.velocityFpm, 2546.479126161, 1e-9);
  closeTo(result.frictionFactor, 0.0176516927373, 1e-12);
  closeTo(result.wallLossCoefficient, 0.635460938543, 1e-12);
  closeTo(result.fittingLossCoefficient, 0.4, 1e-12);
  closeTo(result.effectiveLossCoefficient, 1.035460938543, 1e-12);
  closeTo(result.pressureLossPa, 104.3128658653, 1e-9);
  closeTo(result.pressureLossInWg, 0.418777639941, 1e-12);
});

test('returns zero segment loss at the zero-flow fan boundary', () => {
  const result = analyzeSegmentAtCfm(
    {
      id: 'straight',
      label: 'Straight duct',
      lengthFt: 1,
      diameterIn: 4,
      roughnessIn: 0.0006,
      lossMultiplier: 1,
      fittings: [],
    },
    { densityKgM3: 1.204, kinematicViscosityM2S: 0.00001506 },
    0,
  );

  assert.equal(result.velocityFpm, 0);
  assert.equal(result.pressureLossInWg, 0);
  assert.equal(result.frictionFactor, 0);
});

test('fails explicitly when finite boundary inputs overflow the calculation', () => {
  assert.throws(
    () =>
      analyzeSegmentAtCfm(
        {
          id: 'too-small',
          label: 'Underflowing diameter',
          lengthFt: 1,
          diameterIn: Number.MIN_VALUE,
          roughnessIn: 0,
          lossMultiplier: 1,
          fittings: [],
        },
        { densityKgM3: 1.204, kinematicViscosityM2S: 0.00001506 },
        500,
      ),
    (error) => {
      assert.ok(error instanceof CalculationError);
      assert.equal(error.code, 'CALCULATION_ERROR');
      assert.equal(error.segmentId, 'too-small');
      assert.equal(error.cfm, 500);
      assert.match(error.message, /did not produce finite values/);
      return true;
    },
  );
});

test('interpolates the supplied fan curve without inventing extrapolation', () => {
  const curve = [
    { cfm: 0, pressureInWg: 11.5 },
    { cfm: 400, pressureInWg: 10.7 },
    { cfm: 800, pressureInWg: 8.6 },
    { cfm: 1600, pressureInWg: 0 },
  ];

  assert.equal(fanPressureAtCfm(curve, 0), 11.5);
  closeTo(fanPressureAtCfm(curve, 600), 9.65, 1e-12);
  assert.equal(fanPressureAtCfm(curve, 1600), 0);
  assert.throws(
    () => fanPressureAtCfm(curve, 1601),
    /outside the supplied fan curve/,
  );
});

test('finds the deterministic fan/system operating point', () => {
  const result = findOperatingPoint(
    [
      { cfm: 0, pressureInWg: 10 },
      { cfm: 1000, pressureInWg: 0 },
    ],
    (cfm) => 0.00001 * cfm ** 2,
  );

  closeTo(result.cfm, 618.03398875, 0.000001);
  closeTo(result.pressureInWg, 3.8196601125, 0.00000002);
  assert.ok(result.iterations <= 60);
});

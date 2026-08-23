import {
  cfmToM3s,
  ftToM,
  inchesToM,
  mpsToFpm,
  paToInWg,
} from './units.js';

export function velocityMps(flowM3s, diameterM) {
  const areaM2 = Math.PI * (diameterM / 2) ** 2;
  return flowM3s / areaM2;
}

export function reynoldsNumber(velocity, diameterM, kinematicViscosityM2S) {
  return (velocity * diameterM) / kinematicViscosityM2S;
}

/**
 * Darcy friction factor. Laminar flow uses 64/Re; turbulent flow uses the
 * Zigrang-Sylvester explicit Colebrook approximation documented by NIST FDS.
 */
export function darcyFrictionFactor(reynolds, relativeRoughness) {
  if (reynolds <= 2300) return 64 / reynolds;

  const roughnessTerm = relativeRoughness / 3.7;
  const inverseRoot = -2 * Math.log10(
    roughnessTerm -
      (4.518 / reynolds) *
        Math.log10(6.9 / reynolds + roughnessTerm ** 1.11),
  );
  return 1 / inverseRoot ** 2;
}

/**
 * Calculates one trusted, validated round-duct segment at a candidate flow.
 */
export function analyzeSegmentAtCfm(segment, air, cfm) {
  const diameterM = inchesToM(segment.diameterIn);
  const lengthM = ftToM(segment.lengthFt);
  const flowM3s = cfmToM3s(cfm);
  const velocity = velocityMps(flowM3s, diameterM);
  const fittingLossCoefficient = segment.fittings.reduce(
    (total, fitting) =>
      total + fitting.lossCoefficient * fitting.quantity,
    0,
  );

  if (cfm === 0) {
    return {
      segmentId: segment.id,
      cfm,
      velocityMps: 0,
      velocityFpm: 0,
      reynoldsNumber: 0,
      frictionFactor: 0,
      wallLossCoefficient: 0,
      fittingLossCoefficient,
      effectiveLossCoefficient:
        fittingLossCoefficient * segment.lossMultiplier,
      pressureLossPa: 0,
      pressureLossInWg: 0,
    };
  }

  const reynolds = reynoldsNumber(
    velocity,
    diameterM,
    air.kinematicViscosityM2S,
  );
  const frictionFactor = darcyFrictionFactor(
    reynolds,
    inchesToM(segment.roughnessIn) / diameterM,
  );
  const wallLossCoefficient = frictionFactor * (lengthM / diameterM);
  const effectiveLossCoefficient =
    (wallLossCoefficient + fittingLossCoefficient) * segment.lossMultiplier;
  const pressureLossPa =
    0.5 * air.densityKgM3 * effectiveLossCoefficient * velocity ** 2;

  return {
    segmentId: segment.id,
    cfm,
    velocityMps: velocity,
    velocityFpm: mpsToFpm(velocity),
    reynoldsNumber: reynolds,
    frictionFactor,
    wallLossCoefficient,
    fittingLossCoefficient,
    effectiveLossCoefficient,
    pressureLossPa,
    pressureLossInWg: paToInWg(pressureLossPa),
  };
}

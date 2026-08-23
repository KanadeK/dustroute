export const CFM_TO_M3S = 0.00047194745;
export const FT_TO_M = 0.3048;
export const IN_TO_M = 0.0254;
export const PA_PER_IN_WG = 249.08891;
export const MPS_TO_FPM = 196.8503937007874;

export function cfmToM3s(cfm) {
  return cfm * CFM_TO_M3S;
}

export function ftToM(feet) {
  return feet * FT_TO_M;
}

export function inchesToM(inches) {
  return inches * IN_TO_M;
}

export function mpsToFpm(metersPerSecond) {
  return metersPerSecond * MPS_TO_FPM;
}

export function paToInWg(pascals) {
  return pascals / PA_PER_IN_WG;
}

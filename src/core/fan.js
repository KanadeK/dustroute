/**
 * Piecewise-linear interpolation within a validated fan curve.
 */
export function fanPressureAtCfm(fanCurve, cfm) {
  const maximumCfm = fanCurve.at(-1).cfm;
  if (cfm < 0 || cfm > maximumCfm) {
    throw new RangeError(`CFM ${cfm} is outside the supplied fan curve`);
  }

  for (let index = 1; index < fanCurve.length; index += 1) {
    const left = fanCurve[index - 1];
    const right = fanCurve[index];
    if (cfm <= right.cfm) {
      const fraction = (cfm - left.cfm) / (right.cfm - left.cfm);
      return (
        left.pressureInWg +
        fraction * (right.pressureInWg - left.pressureInWg)
      );
    }
  }

  return fanCurve.at(-1).pressureInWg;
}

/**
 * Finds the unique intersection of a non-increasing fan curve and increasing
 * system-loss curve by bisection. The returned tolerance is below 1e-6 CFM.
 */
export function findOperatingPoint(fanCurve, systemPressureAtCfm) {
  let lowerCfm = 0;
  let upperCfm = fanCurve.at(-1).cfm;
  const lowerResidual =
    fanPressureAtCfm(fanCurve, lowerCfm) - systemPressureAtCfm(lowerCfm);
  const upperResidual =
    fanPressureAtCfm(fanCurve, upperCfm) - systemPressureAtCfm(upperCfm);

  if (lowerResidual === 0) {
    return {
      cfm: lowerCfm,
      pressureInWg: fanPressureAtCfm(fanCurve, lowerCfm),
      iterations: 0,
    };
  }
  if (upperResidual === 0) {
    return {
      cfm: upperCfm,
      pressureInWg: fanPressureAtCfm(fanCurve, upperCfm),
      iterations: 0,
    };
  }
  if (lowerResidual < 0 || upperResidual > 0) {
    throw new Error('Fan and system curves do not intersect within the supplied range');
  }

  let iterations = 0;
  while (upperCfm - lowerCfm > 0.000001 && iterations < 60) {
    const middleCfm = (lowerCfm + upperCfm) / 2;
    const residual =
      fanPressureAtCfm(fanCurve, middleCfm) -
      systemPressureAtCfm(middleCfm);
    if (residual > 0) {
      lowerCfm = middleCfm;
    } else {
      upperCfm = middleCfm;
    }
    iterations += 1;
  }

  const cfm = (lowerCfm + upperCfm) / 2;
  return {
    cfm,
    pressureInWg: fanPressureAtCfm(fanCurve, cfm),
    iterations,
  };
}

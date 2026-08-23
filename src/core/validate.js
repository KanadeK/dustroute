const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class ProjectValidationError extends Error {
  constructor(issues) {
    super(`Invalid DustRoute project (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
    this.name = 'ProjectValidationError';
    this.code = 'INVALID_PROJECT';
    this.issues = issues;
  }

  toJSON() {
    return { code: this.code, issues: this.issues };
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateString(value, path, issues, { optional = false } = {}) {
  if (optional && value === undefined) return;
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({ path, message: 'must be a non-empty string' });
  } else if (CONTROL_CHARACTER_PATTERN.test(value)) {
    issues.push({ path, message: 'must not contain control characters' });
  }
}

function validateId(value, path, issues, seen) {
  validateString(value, path, issues);
  if (typeof value !== 'string' || value.trim() === '') return;
  if (!ID_PATTERN.test(value)) {
    issues.push({
      path,
      message: 'must use lowercase letters, numbers, and hyphens',
    });
  }
  if (seen.has(value)) {
    issues.push({ path, message: 'must be unique' });
  }
  seen.add(value);
}

function validateNumber(value, path, issues, minimum, inclusive = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: 'must be a finite number' });
    return false;
  }
  const valid = inclusive ? value >= minimum : value > minimum;
  if (!valid) {
    issues.push({
      path,
      message: inclusive
        ? `must be greater than or equal to ${minimum}`
        : `must be greater than ${minimum}`,
    });
    return false;
  }
  return true;
}

function validateFanCurve(fanCurve, issues) {
  if (!Array.isArray(fanCurve) || fanCurve.length < 2) {
    issues.push({
      path: 'fanCurve',
      message: 'must contain at least 2 points',
    });
    return;
  }

  let previousCfm;
  let previousPressure;
  for (const [index, point] of fanCurve.entries()) {
    const path = `fanCurve[${index}]`;
    if (!isRecord(point)) {
      issues.push({ path, message: 'must be an object' });
      continue;
    }

    const cfmValid = validateNumber(point.cfm, `${path}.cfm`, issues, 0, true);
    const pressureValid = validateNumber(
      point.pressureInWg,
      `${path}.pressureInWg`,
      issues,
      0,
      true,
    );

    if (index === 0 && cfmValid && point.cfm !== 0) {
      issues.push({ path: `${path}.cfm`, message: 'must equal 0' });
    }
    if (cfmValid && previousCfm !== undefined && point.cfm <= previousCfm) {
      issues.push({
        path: `${path}.cfm`,
        message: 'must be greater than the previous point',
      });
    }
    if (
      pressureValid &&
      previousPressure !== undefined &&
      point.pressureInWg > previousPressure
    ) {
      issues.push({
        path: `${path}.pressureInWg`,
        message: 'must not exceed the previous point',
      });
    }

    if (cfmValid) previousCfm = point.cfm;
    if (pressureValid) previousPressure = point.pressureInWg;
  }

  const finalIndex = fanCurve.length - 1;
  const finalPoint = fanCurve[finalIndex];
  if (
    isRecord(finalPoint) &&
    typeof finalPoint.pressureInWg === 'number' &&
    Number.isFinite(finalPoint.pressureInWg) &&
    finalPoint.pressureInWg !== 0
  ) {
    issues.push({
      path: `fanCurve[${finalIndex}].pressureInWg`,
      message: 'must equal 0 at the final point',
    });
  }
}

function validateSegments(segments, issues) {
  const segmentIds = new Set();
  if (!Array.isArray(segments) || segments.length === 0) {
    issues.push({ path: 'segments', message: 'must contain at least 1 segment' });
    return segmentIds;
  }

  for (const [index, segment] of segments.entries()) {
    const path = `segments[${index}]`;
    if (!isRecord(segment)) {
      issues.push({ path, message: 'must be an object' });
      continue;
    }

    validateId(segment.id, `${path}.id`, issues, segmentIds);
    validateString(segment.label, `${path}.label`, issues);
    validateNumber(segment.lengthFt, `${path}.lengthFt`, issues, 0);
    validateNumber(segment.diameterIn, `${path}.diameterIn`, issues, 0);
    validateNumber(
      segment.roughnessIn,
      `${path}.roughnessIn`,
      issues,
      0,
      true,
    );
    validateNumber(
      segment.lossMultiplier,
      `${path}.lossMultiplier`,
      issues,
      1,
      true,
    );

    if (!Array.isArray(segment.fittings)) {
      issues.push({ path: `${path}.fittings`, message: 'must be an array' });
      continue;
    }
    for (const [fittingIndex, fitting] of segment.fittings.entries()) {
      const fittingPath = `${path}.fittings[${fittingIndex}]`;
      if (!isRecord(fitting)) {
        issues.push({ path: fittingPath, message: 'must be an object' });
        continue;
      }
      validateString(fitting.label, `${fittingPath}.label`, issues);
      validateNumber(
        fitting.lossCoefficient,
        `${fittingPath}.lossCoefficient`,
        issues,
        0,
        true,
      );
      if (!Number.isInteger(fitting.quantity) || fitting.quantity <= 0) {
        issues.push({
          path: `${fittingPath}.quantity`,
          message: 'must be a positive integer',
        });
      }
    }
  }
  return segmentIds;
}

function validateRoutes(routes, segmentIds, issues) {
  const routeIds = new Set();
  if (!Array.isArray(routes) || routes.length === 0) {
    issues.push({ path: 'routes', message: 'must contain at least 1 route' });
    return;
  }

  for (const [index, route] of routes.entries()) {
    const path = `routes[${index}]`;
    if (!isRecord(route)) {
      issues.push({ path, message: 'must be an object' });
      continue;
    }

    validateId(route.id, `${path}.id`, issues, routeIds);
    validateString(route.label, `${path}.label`, issues);
    validateNumber(route.targetCfm, `${path}.targetCfm`, issues, 0);
    validateNumber(
      route.minTransportFpm,
      `${path}.minTransportFpm`,
      issues,
      0,
    );

    if (!Array.isArray(route.segmentIds) || route.segmentIds.length === 0) {
      issues.push({
        path: `${path}.segmentIds`,
        message: 'must contain at least 1 segment ID',
      });
      continue;
    }

    const routeSegments = new Set();
    for (const [segmentIndex, segmentId] of route.segmentIds.entries()) {
      const segmentPath = `${path}.segmentIds[${segmentIndex}]`;
      if (typeof segmentId !== 'string' || segmentId.trim() === '') {
        issues.push({ path: segmentPath, message: 'must be a segment ID string' });
        continue;
      }
      if (routeSegments.has(segmentId)) {
        issues.push({
          path: segmentPath,
          message: 'must not repeat a segment in one route',
        });
      }
      routeSegments.add(segmentId);
      if (!segmentIds.has(segmentId)) {
        issues.push({
          path: segmentPath,
          message: `references unknown segment "${segmentId}"`,
        });
      }
    }
  }
}

/**
 * Validates untrusted v1 project data at the CLI/browser boundary.
 *
 * @param {unknown} input
 * @returns {object} The same object after successful validation.
 * @throws {ProjectValidationError} With stable, path-addressed issues.
 */
export function validateProject(input) {
  const issues = [];
  if (!isRecord(input)) {
    throw new ProjectValidationError([
      { path: '$', message: 'must be a JSON object' },
    ]);
  }

  if (input.schemaVersion !== 1) {
    issues.push({ path: 'schemaVersion', message: 'must equal 1' });
  }

  if (!isRecord(input.project)) {
    issues.push({ path: 'project', message: 'must be an object' });
  } else {
    validateString(input.project.name, 'project.name', issues);
    validateString(input.project.notes, 'project.notes', issues, {
      optional: true,
    });
  }

  if (!isRecord(input.air)) {
    issues.push({ path: 'air', message: 'must be an object' });
  } else {
    validateNumber(input.air.densityKgM3, 'air.densityKgM3', issues, 0);
    validateNumber(
      input.air.kinematicViscosityM2S,
      'air.kinematicViscosityM2S',
      issues,
      0,
    );
  }

  validateFanCurve(input.fanCurve, issues);
  const segmentIds = validateSegments(input.segments, issues);
  validateRoutes(input.routes, segmentIds, issues);

  if (issues.length > 0) throw new ProjectValidationError(issues);
  return input;
}

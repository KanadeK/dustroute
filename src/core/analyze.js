import { findOperatingPoint, fanPressureAtCfm } from './fan.js';
import { analyzeSegmentAtCfm } from './physics.js';

function analyzeRouteSegments(segments, air, cfm) {
  return segments.map((segment) => ({
    ...analyzeSegmentAtCfm(segment, air, cfm),
    label: segment.label,
  }));
}

function totalPressureInWg(segmentResults) {
  return segmentResults.reduce(
    (total, segment) => total + segment.pressureLossInWg,
    0,
  );
}

function sampleCurve(fanCurve, segments, air) {
  const maximumCfm = fanCurve.at(-1).cfm;
  return Array.from({ length: 41 }, (_, index) => {
    const cfm = (maximumCfm * index) / 40;
    return {
      cfm,
      fanPressureInWg: fanPressureAtCfm(fanCurve, cfm),
      systemPressureInWg: totalPressureInWg(
        analyzeRouteSegments(segments, air, cfm),
      ),
    };
  });
}

function analyzeRoute(route, project, segmentById) {
  const segments = route.segmentIds.map((id) => segmentById.get(id));
  const operatingPoint = findOperatingPoint(project.fanCurve, (cfm) =>
    totalPressureInWg(analyzeRouteSegments(segments, project.air, cfm)),
  );
  const segmentResults = analyzeRouteSegments(
    segments,
    project.air,
    operatingPoint.cfm,
  );
  const airflowMarginCfm = operatingPoint.cfm - route.targetCfm;
  const velocityMargins = segmentResults.map(
    (segment) => segment.velocityFpm - route.minTransportFpm,
  );
  const issues = [];

  if (airflowMarginCfm < 0) {
    issues.push({
      code: 'AIRFLOW_BELOW_TARGET',
      actualCfm: operatingPoint.cfm,
      requiredCfm: route.targetCfm,
      marginCfm: airflowMarginCfm,
    });
  }
  for (const [index, marginFpm] of velocityMargins.entries()) {
    if (marginFpm < 0) {
      issues.push({
        code: 'VELOCITY_BELOW_MINIMUM',
        segmentId: segmentResults[index].segmentId,
        actualFpm: segmentResults[index].velocityFpm,
        requiredFpm: route.minTransportFpm,
        marginFpm,
      });
    }
  }

  return {
    id: route.id,
    label: route.label,
    targetCfm: route.targetCfm,
    minTransportFpm: route.minTransportFpm,
    operatingCfm: operatingPoint.cfm,
    operatingPressureInWg: operatingPoint.pressureInWg,
    airflowMarginCfm,
    minimumVelocityMarginFpm: Math.min(...velocityMargins),
    pass: issues.length === 0,
    issues,
    segments: segmentResults,
    curve: sampleCurve(project.fanCurve, segments, project.air),
  };
}

/**
 * Analyzes a project previously accepted by validateProject.
 */
export function analyzeProject(project) {
  const segmentById = new Map(
    project.segments.map((segment) => [segment.id, segment]),
  );
  const routes = project.routes.map((route) =>
    analyzeRoute(route, project, segmentById),
  );
  const passingRoutes = routes.filter((route) => route.pass).length;

  return {
    schemaVersion: project.schemaVersion,
    project: { ...project.project },
    summary: {
      totalRoutes: routes.length,
      passingRoutes,
      failingRoutes: routes.length - passingRoutes,
      pass: passingRoutes === routes.length,
    },
    routes,
  };
}

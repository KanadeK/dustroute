function oneDecimal(value) {
  return value.toFixed(1);
}

function twoDecimals(value) {
  return value.toFixed(2);
}

function issueText(issue) {
  if (issue.code === 'AIRFLOW_BELOW_TARGET') {
    return `airflow ${oneDecimal(Math.abs(issue.marginCfm))} CFM below target (${oneDecimal(issue.actualCfm)} vs ${oneDecimal(issue.requiredCfm)} CFM)`;
  }
  return `${issue.segmentId} velocity ${oneDecimal(issue.actualFpm)} FPM below minimum ${oneDecimal(issue.requiredFpm)} FPM`;
}

function markdownText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(/\r?\n/g, ' ');
}

function tableCell(value) {
  return markdownText(value).replaceAll('|', '\\|');
}

export function renderTerminalReport(analysis) {
  const status = analysis.summary.pass ? 'PASS' : 'FAIL';
  const lines = [
    `DustRoute — ${analysis.project.name}`,
    `${status} ${analysis.summary.passingRoutes}/${analysis.summary.totalRoutes} routes`,
    '',
  ];

  for (const route of analysis.routes) {
    lines.push(
      `${route.pass ? 'PASS' : 'FAIL'} ${route.label}  ${oneDecimal(route.operatingCfm)} CFM @ ${twoDecimals(route.operatingPressureInWg)} in. wg`,
      `  airflow margin ${route.airflowMarginCfm >= 0 ? '+' : ''}${oneDecimal(route.airflowMarginCfm)} CFM; minimum velocity margin ${route.minimumVelocityMarginFpm >= 0 ? '+' : ''}${oneDecimal(route.minimumVelocityMarginFpm)} FPM`,
    );
    for (const issue of route.issues) {
      lines.push(`  - ${issueText(issue)}`);
    }
    for (const segment of route.segments) {
      lines.push(
        `    ${segment.segmentId}: ${oneDecimal(segment.velocityFpm)} FPM, ${twoDecimals(segment.pressureLossInWg)} in. wg loss`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderMarkdownReport(analysis) {
  const status = analysis.summary.pass ? 'PASS' : 'FAIL';
  const lines = [
    '# DustRoute report',
    '',
    `**Project:** ${markdownText(analysis.project.name)}`,
    '',
    `**Result:** ${status} — ${analysis.summary.passingRoutes}/${analysis.summary.totalRoutes} routes pass their explicit constraints.`,
    '',
    '| Route | Result | Operating point | Airflow margin | Minimum velocity margin |',
    '| --- | --- | ---: | ---: | ---: |',
  ];

  for (const route of analysis.routes) {
    lines.push(
      `| ${tableCell(route.label)} | ${route.pass ? 'PASS' : 'FAIL'} | ${oneDecimal(route.operatingCfm)} CFM @ ${twoDecimals(route.operatingPressureInWg)} in. wg | ${oneDecimal(route.airflowMarginCfm)} CFM | ${oneDecimal(route.minimumVelocityMarginFpm)} FPM |`,
    );
  }

  for (const route of analysis.routes) {
    lines.push(
      '',
      `## ${markdownText(route.label)}`,
      '',
      `Operating point: **${oneDecimal(route.operatingCfm)} CFM @ ${twoDecimals(route.operatingPressureInWg)} in. wg**`,
      '',
    );
    if (route.issues.length > 0) {
      lines.push('Constraints:', '');
      for (const issue of route.issues) lines.push(`- ${issueText(issue)}`);
      lines.push('');
    }
    lines.push(
      '| Segment | Velocity | Pressure loss | Wall K | Fitting K | Effective K |',
      '| --- | ---: | ---: | ---: | ---: | ---: |',
    );
    for (const segment of route.segments) {
      lines.push(
        `| ${tableCell(segment.label)} | ${oneDecimal(segment.velocityFpm)} FPM | ${twoDecimals(segment.pressureLossInWg)} in. wg | ${segment.wallLossCoefficient.toFixed(3)} | ${segment.fittingLossCoefficient.toFixed(3)} | ${segment.effectiveLossCoefficient.toFixed(3)} |`,
      );
    }
  }

  lines.push(
    '',
    '> Planning estimate from user-supplied values; not certification or professional acceptance.',
    '',
  );
  return lines.join('\n');
}

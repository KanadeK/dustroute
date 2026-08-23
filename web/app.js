import { analyzeProject } from './core/analyze.js';
import { renderMarkdownReport } from './core/report.js';
import {
  ProjectValidationError,
  validateProject,
} from './core/validate.js';
import { SAMPLE_PROJECT } from './sample.js';

const MAX_IMPORT_BYTES = 1024 * 1024;
const SVG_NS = 'http://www.w3.org/2000/svg';
const state = { analysis: null, activeRouteId: null };

const elements = {
  editor: document.querySelector('#project-editor'),
  file: document.querySelector('#project-file'),
  loadSample: document.querySelector('#load-sample'),
  analyze: document.querySelector('#analyze-project'),
  inputStatus: document.querySelector('#input-status'),
  summaryBadge: document.querySelector('#summary-badge'),
  summaryCopy: document.querySelector('#summary-copy'),
  routeTabs: document.querySelector('#route-tabs'),
  routeDetail: document.querySelector('#route-detail'),
  routeName: document.querySelector('#route-name'),
  routeConstraint: document.querySelector('#route-constraint'),
  routeVerdict: document.querySelector('#route-verdict'),
  metrics: document.querySelector('#metrics'),
  plot: document.querySelector('#curve-plot'),
  issues: document.querySelector('#route-issues'),
  segmentBody: document.querySelector('#segment-body'),
  downloadJson: document.querySelector('#download-json'),
  downloadMarkdown: document.querySelector('#download-markdown'),
};

function format(value, digits = 1) {
  return value.toFixed(digits);
}

function signed(value, digits = 1) {
  return `${value >= 0 ? '+' : ''}${format(value, digits)}`;
}

function svgElement(name, attributes = {}, text = '') {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  if (text) node.textContent = text;
  return node;
}

function setInputStatus(message, error = false) {
  elements.inputStatus.textContent = message;
  elements.inputStatus.classList.toggle('error', error);
}

function metric(label, value, unit) {
  const wrapper = document.createElement('div');
  wrapper.className = 'metric';
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  const unitNode = document.createElement('span');
  term.textContent = label;
  description.textContent = value;
  unitNode.textContent = ` ${unit}`;
  description.append(unitNode);
  wrapper.append(term, description);
  return wrapper;
}

function issueText(issue) {
  if (issue.code === 'AIRFLOW_BELOW_TARGET') {
    return `Airflow is ${format(Math.abs(issue.marginCfm))} CFM below the ${format(issue.requiredCfm)} CFM target.`;
  }
  return `${issue.segmentId} velocity is ${format(issue.actualFpm)} FPM, below the ${format(issue.requiredFpm)} FPM minimum.`;
}

function drawCurve(route) {
  const width = 720;
  const height = 330;
  const margin = { top: 24, right: 20, bottom: 45, left: 58 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maximumCfm = route.curve.at(-1).cfm;
  const maximumPressure = Math.max(
    route.curve[0].fanPressureInWg * 1.18,
    route.operatingPressureInWg * 1.4,
  );
  const x = (cfm) => margin.left + (cfm / maximumCfm) * plotWidth;
  const y = (pressure) =>
    margin.top + plotHeight - (pressure / maximumPressure) * plotHeight;
  const path = (key) =>
    route.curve
      .map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(point.cfm).toFixed(2)} ${y(point[key]).toFixed(2)}`,
      )
      .join(' ');

  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-labelledby': 'runtime-plot-title runtime-plot-desc',
  });
  svg.append(
    svgElement('title', { id: 'runtime-plot-title' }, `${route.label} fan and system curves`),
    svgElement(
      'desc',
      { id: 'runtime-plot-desc' },
      `The curves intersect at ${format(route.operatingCfm)} CFM and ${format(route.operatingPressureInWg, 2)} inches water gauge.`,
    ),
  );

  const definitions = svgElement('defs');
  const clip = svgElement('clipPath', { id: 'plot-clip' });
  clip.append(
    svgElement('rect', {
      x: margin.left,
      y: margin.top,
      width: plotWidth,
      height: plotHeight,
    }),
  );
  definitions.append(clip);
  svg.append(definitions);

  for (let index = 0; index <= 4; index += 1) {
    const pressure = (maximumPressure * index) / 4;
    const yPosition = y(pressure);
    svg.append(
      svgElement('line', {
        x1: margin.left,
        x2: width - margin.right,
        y1: yPosition,
        y2: yPosition,
        stroke: 'rgba(247, 241, 229, 0.15)',
      }),
      svgElement(
        'text',
        {
          x: margin.left - 10,
          y: yPosition + 4,
          fill: '#b9cbc5',
          'font-size': 11,
          'text-anchor': 'end',
        },
        format(pressure, 1),
      ),
    );
  }

  for (let index = 0; index <= 2; index += 1) {
    const cfm = (maximumCfm * index) / 2;
    svg.append(
      svgElement(
        'text',
        {
          x: x(cfm),
          y: height - 17,
          fill: '#b9cbc5',
          'font-size': 11,
          'text-anchor': index === 0 ? 'start' : index === 2 ? 'end' : 'middle',
        },
        format(cfm, 0),
      ),
    );
  }

  svg.append(
    svgElement('path', {
      d: path('fanPressureInWg'),
      fill: 'none',
      stroke: '#6dd0c4',
      'stroke-width': 4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'clip-path': 'url(#plot-clip)',
    }),
    svgElement('path', {
      d: path('systemPressureInWg'),
      fill: 'none',
      stroke: '#ff7841',
      'stroke-width': 4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'clip-path': 'url(#plot-clip)',
    }),
    svgElement('line', {
      x1: x(route.operatingCfm),
      x2: x(route.operatingCfm),
      y1: y(route.operatingPressureInWg),
      y2: margin.top + plotHeight,
      stroke: '#f7f1e5',
      'stroke-dasharray': '5 5',
      opacity: 0.6,
    }),
    svgElement('circle', {
      cx: x(route.operatingCfm),
      cy: y(route.operatingPressureInWg),
      r: 9,
      fill: '#112d30',
      stroke: '#f7f1e5',
      'stroke-width': 4,
    }),
    svgElement(
      'text',
      {
        x: margin.left + plotWidth / 2,
        y: height - 1,
        fill: '#b9cbc5',
        'font-size': 11,
        'text-anchor': 'middle',
      },
      'AIRFLOW (CFM)',
    ),
    svgElement(
      'text',
      {
        x: 14,
        y: margin.top + plotHeight / 2,
        fill: '#b9cbc5',
        'font-size': 11,
        'text-anchor': 'middle',
        transform: `rotate(-90 14 ${margin.top + plotHeight / 2})`,
      },
      'PRESSURE (IN. WG)',
    ),
  );

  elements.plot.replaceChildren(svg);
}

function renderRoute(route) {
  elements.routeName.textContent = route.label;
  elements.routeConstraint.textContent = `${format(route.targetCfm, 0)} CFM target · ${format(route.minTransportFpm, 0)} FPM minimum in every segment`;
  elements.routeVerdict.textContent = route.pass ? 'Pass' : 'Needs work';
  elements.routeVerdict.className = `route-verdict ${route.pass ? 'pass' : 'fail'}`;

  elements.metrics.replaceChildren(
    metric('Operating airflow', format(route.operatingCfm), 'CFM'),
    metric('Static pressure', format(route.operatingPressureInWg, 2), 'in. wg'),
    metric('Velocity margin', signed(route.minimumVelocityMarginFpm), 'FPM'),
  );

  drawCurve(route);

  if (route.issues.length > 0) {
    const heading = document.createElement('strong');
    const list = document.createElement('ul');
    heading.textContent = 'Failed constraints';
    for (const issue of route.issues) {
      const item = document.createElement('li');
      item.textContent = issueText(issue);
      list.append(item);
    }
    elements.issues.replaceChildren(heading, list);
    elements.issues.hidden = false;
  } else {
    elements.issues.replaceChildren();
    elements.issues.hidden = true;
  }

  const rows = route.segments.map((segment) => {
    const row = document.createElement('tr');
    for (const value of [
      segment.label,
      `${format(segment.velocityFpm)} FPM`,
      `${format(segment.pressureLossInWg, 2)} in. wg`,
      format(segment.effectiveLossCoefficient, 3),
    ]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  });
  elements.segmentBody.replaceChildren(...rows);
  elements.routeDetail.hidden = false;
}

function activateRoute(routeId, focusTab = false) {
  state.activeRouteId = routeId;
  renderAnalysis(state.analysis);
  if (focusTab) document.querySelector(`#route-tab-${routeId}`).focus();
}

function renderAnalysis(analysis) {
  const status = analysis.summary.pass ? 'pass' : 'fail';
  elements.summaryBadge.textContent = analysis.summary.pass ? 'All pass' : 'Review';
  elements.summaryBadge.className = `summary-badge ${status}`;
  elements.summaryCopy.textContent = `${analysis.summary.passingRoutes} of ${analysis.summary.totalRoutes} routes pass their stated airflow and transport-velocity constraints.`;

  if (!analysis.routes.some((route) => route.id === state.activeRouteId)) {
    state.activeRouteId = analysis.routes[0].id;
  }
  const tabs = analysis.routes.map((route, index) => {
    const button = document.createElement('button');
    const selected = route.id === state.activeRouteId;
    button.className = 'route-tab';
    button.type = 'button';
    button.id = `route-tab-${route.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'route-detail');
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.textContent = `${route.pass ? '✓' : '!'} ${route.label}`;
    button.addEventListener('click', () => activateRoute(route.id));
    button.addEventListener('keydown', (event) => {
      const lastIndex = analysis.routes.length - 1;
      const destination = {
        ArrowLeft: index === 0 ? lastIndex : index - 1,
        ArrowRight: index === lastIndex ? 0 : index + 1,
        Home: 0,
        End: lastIndex,
      }[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      activateRoute(analysis.routes[destination].id, true);
    });
    return button;
  });
  elements.routeTabs.replaceChildren(...tabs);
  elements.routeDetail.setAttribute(
    'aria-labelledby',
    `route-tab-${state.activeRouteId}`,
  );
  renderRoute(analysis.routes.find((route) => route.id === state.activeRouteId));
  elements.downloadJson.disabled = false;
  elements.downloadMarkdown.disabled = false;
}

function analyzeEditor() {
  try {
    const project = validateProject(JSON.parse(elements.editor.value));
    state.analysis = analyzeProject(project);
    renderAnalysis(state.analysis);
    setInputStatus(
      `Analyzed ${state.analysis.summary.totalRoutes} routes locally.`,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      setInputStatus(`JSON parse error: ${error.message}`, true);
      return;
    }
    if (error instanceof ProjectValidationError) {
      const details = error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join(' · ');
      const remainder = error.issues.length > 4
        ? ` · ${error.issues.length - 4} more`
        : '';
      setInputStatus(`${details}${remainder}`, true);
      return;
    }
    throw error;
  }
}

function loadSample() {
  elements.editor.value = JSON.stringify(SAMPLE_PROJECT, null, 2);
  state.activeRouteId = null;
  analyzeEditor();
}

function download(filename, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

elements.loadSample.addEventListener('click', loadSample);
elements.analyze.addEventListener('click', analyzeEditor);
elements.file.addEventListener('change', async () => {
  const [file] = elements.file.files;
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    setInputStatus('Import rejected: file exceeds the 1 MiB limit.', true);
    elements.file.value = '';
    return;
  }
  try {
    elements.editor.value = await file.text();
  } catch (error) {
    if (error instanceof DOMException) {
      setInputStatus(`Could not read file: ${error.message}`, true);
      elements.file.value = '';
      return;
    }
    throw error;
  }
  elements.file.value = '';
  state.activeRouteId = null;
  analyzeEditor();
});
elements.downloadJson.addEventListener('click', () => {
  download(
    'dustroute-analysis.json',
    'application/json',
    `${JSON.stringify(state.analysis, null, 2)}\n`,
  );
});
elements.downloadMarkdown.addEventListener('click', () => {
  download(
    'dustroute-report.md',
    'text/markdown',
    renderMarkdownReport(state.analysis),
  );
});

loadSample();

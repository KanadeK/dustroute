#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

import { analyzeProject } from '../src/core/analyze.js';
import {
  renderMarkdownReport,
  renderTerminalReport,
} from '../src/core/report.js';
import {
  ProjectValidationError,
  validateProject,
} from '../src/core/validate.js';

const USAGE = `Usage:
  dustroute analyze <project.json> [--format terminal|json|markdown]
  dustroute check <project.json> [--format terminal|json|markdown]
`;

class CliUsageError extends Error {}
class CliInputError extends Error {}

function parseArguments(arguments_) {
  const [command, projectPath, ...options] = arguments_;
  if (!['analyze', 'check'].includes(command) || !projectPath) {
    throw new CliUsageError();
  }
  if (options.length === 0) return { command, projectPath, format: 'terminal' };
  if (options.length !== 2 || options[0] !== '--format') {
    throw new CliUsageError();
  }
  const format = options[1];
  if (!['terminal', 'json', 'markdown'].includes(format)) {
    throw new CliUsageError('format must be terminal, json, or markdown');
  }
  return { command, projectPath, format };
}

async function readProject(projectPath) {
  let source;
  try {
    source = await readFile(projectPath, 'utf8');
  } catch (error) {
    throw new CliInputError(`could not read project: ${error.message}`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new CliInputError(`could not parse JSON: ${error.message}`);
  }
}

function render(analysis, format) {
  if (format === 'json') return `${JSON.stringify(analysis, null, 2)}\n`;
  if (format === 'markdown') return renderMarkdownReport(analysis);
  return renderTerminalReport(analysis);
}

async function run() {
  const { command, projectPath, format } = parseArguments(
    process.argv.slice(2),
  );
  const project = validateProject(await readProject(projectPath));
  const analysis = analyzeProject(project);
  process.stdout.write(render(analysis, format));
  return command === 'check' && !analysis.summary.pass ? 1 : 0;
}

try {
  process.exitCode = await run();
} catch (error) {
  if (error instanceof CliUsageError) {
    if (error.message) process.stderr.write(`${error.message}\n\n`);
    process.stderr.write(USAGE);
    process.exitCode = 2;
  } else if (error instanceof CliInputError) {
    process.stderr.write(`Input error: ${error.message}\n`);
    process.exitCode = 2;
  } else if (error instanceof ProjectValidationError) {
    process.stderr.write('Invalid DustRoute project:\n');
    for (const issue of error.issues) {
      process.stderr.write(`- ${issue.path}: ${issue.message}\n`);
    }
    process.exitCode = 2;
  } else {
    throw error;
  }
}

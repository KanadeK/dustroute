import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, 'bin', 'dustroute.js');

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: ROOT,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('analyze prints a human report and exits zero for the passing fixture', async () => {
  const result = await runCli(['analyze', 'examples/garage-shop.json']);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /PASS 3\/3 routes/);
  assert.match(result.stdout, /Table saw\s+619\.1 CFM @ 9\.55 in\. wg/);
  assert.match(result.stdout, /Miter saw\s+428\.1 CFM @ 10\.55 in\. wg/);
});

test('JSON and Markdown formats come from the same complete analysis', async () => {
  const jsonResult = await runCli([
    'analyze',
    'examples/garage-shop.json',
    '--format',
    'json',
  ]);
  const markdownResult = await runCli([
    'analyze',
    'examples/garage-shop.json',
    '--format',
    'markdown',
  ]);

  assert.equal(jsonResult.code, 0);
  assert.equal(JSON.parse(jsonResult.stdout).summary.pass, true);
  assert.equal(markdownResult.code, 0);
  assert.match(markdownResult.stdout, /^# DustRoute report/m);
  assert.match(markdownResult.stdout, /\| Route \| Result \| Operating point \|/);
  assert.match(markdownResult.stdout, /## Table saw/);
});

test('check exits one and names each failed constraint', async () => {
  const result = await runCli(['check', 'examples/undersized-route.json']);

  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /FAIL 0\/1 routes/);
  assert.match(result.stdout, /Demanding sander/);
  assert.match(result.stdout, /airflow .* below target/i);
  assert.match(result.stdout, /long-flex velocity .* below minimum/i);
});

test('check exits zero for a project whose explicit constraints pass', async () => {
  const result = await runCli(['check', 'examples/garage-shop.json']);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /PASS 3\/3 routes/);
});

test('malformed JSON and validation failures exit two with repairable paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dustroute-cli-'));
  try {
    const malformed = join(directory, 'malformed.json');
    const invalid = join(directory, 'invalid.json');
    await writeFile(malformed, '{not json', 'utf8');
    await writeFile(invalid, JSON.stringify({ schemaVersion: 2 }), 'utf8');

    const malformedResult = await runCli(['analyze', malformed]);
    const invalidResult = await runCli(['analyze', invalid]);

    assert.equal(malformedResult.code, 2);
    assert.match(malformedResult.stderr, /could not parse JSON/i);
    assert.equal(invalidResult.code, 2);
    assert.match(invalidResult.stderr, /schemaVersion: must equal 1/);
    assert.match(invalidResult.stderr, /project: must be an object/);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('usage mistakes exit two without reading a project', async () => {
  const missing = await runCli([]);
  const badFormat = await runCli([
    'analyze',
    'examples/garage-shop.json',
    '--format',
    'yaml',
  ]);

  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /Usage:/);
  assert.equal(badFormat.code, 2);
  assert.match(badFormat.stderr, /format must be terminal, json, or markdown/i);
});

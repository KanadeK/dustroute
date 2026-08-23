import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(ROOT, 'scripts', 'serve.mjs')], {
      cwd: ROOT,
      env: { ...process.env, PORT: '0' },
      windowsHide: true,
    });
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Timed out waiting for the DustRoute server'));
    }, 5000);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      const match = chunk.match(/127\.0\.0\.1:(\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve({ child, port: Number(match[1]), stderr: () => stderr });
    });
    child.on('error', reject);
  });
}

test('build creates a repository-relative static application', async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [join(ROOT, 'scripts', 'build.mjs')],
    { cwd: ROOT, windowsHide: true },
  );

  assert.match(stdout, /Built DustRoute static app/);
  assert.equal(stderr, '');
  for (const path of [
    'index.html',
    'app.js',
    'styles.css',
    'favicon.svg',
    'sample.js',
    'core/analyze.js',
    'core/fan.js',
    'core/physics.js',
    'core/report.js',
    'core/units.js',
    'core/validate.js',
    'examples/garage-shop.json',
    'examples/undersized-route.json',
  ]) {
    await access(join(DIST, path));
  }

  const html = await readFile(join(DIST, 'index.html'), 'utf8');
  const app = await readFile(join(DIST, 'app.js'), 'utf8');
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(app, /\.\.\/src|from ['"]https?:|fetch\(['"]https?:/);
  assert.match(app, /from '\.\/core\/analyze\.js'/);
  assert.match(app, /from '\.\/sample\.js'/);
});

test('the generated browser sample produces the same core result', async () => {
  const sampleUrl = `${pathToFileURL(join(DIST, 'sample.js')).href}?test=${Date.now()}`;
  const validateUrl = pathToFileURL(join(DIST, 'core', 'validate.js')).href;
  const analyzeUrl = pathToFileURL(join(DIST, 'core', 'analyze.js')).href;
  const [{ SAMPLE_PROJECT }, { validateProject }, { analyzeProject }] =
    await Promise.all([
      import(sampleUrl),
      import(validateUrl),
      import(analyzeUrl),
    ]);
  const analysis = analyzeProject(validateProject(SAMPLE_PROJECT));

  assert.equal(analysis.summary.pass, true);
  assert.equal(analysis.routes.length, 3);
  assert.ok(Math.abs(analysis.routes[0].operatingCfm - 619.064348564) < 1e-6);
});

test('local server sets a strict boundary and returns a real 404', async () => {
  const running = await startServer();
  try {
    const indexResponse = await fetch(`http://127.0.0.1:${running.port}/`);
    const missingResponse = await fetch(
      `http://127.0.0.1:${running.port}/not-a-real-file`,
    );

    assert.equal(indexResponse.status, 200);
    assert.match(
      indexResponse.headers.get('content-security-policy'),
      /connect-src 'none'/,
    );
    assert.equal(missingResponse.status, 404);
    assert.equal(await missingResponse.text(), 'Not found');
    assert.equal(running.stderr(), '');
  } finally {
    running.child.kill();
    await once(running.child, 'close');
  }
});

import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function markdownFiles() {
  const rootFiles = [
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'README.md',
    'README.zh-CN.md',
    'SECURITY.md',
  ];
  const docs = await readdir(join(ROOT, 'docs'), { recursive: true });
  return [
    ...rootFiles,
    ...docs
      .filter((path) => path.endsWith('.md'))
      .map((path) => join('docs', path)),
  ];
}

test('every local Markdown link resolves inside the repository', async () => {
  const failures = [];
  for (const relativeFile of await markdownFiles()) {
    const absoluteFile = join(ROOT, relativeFile);
    const source = await readFile(absoluteFile, 'utf8');
    for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      try {
        await access(join(dirname(absoluteFile), decodeURIComponent(target)));
      } catch {
        failures.push(`${relativeFile} -> ${target}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});

test('both quick starts include the executable acceptance and failure path', async () => {
  for (const file of ['README.md', 'README.zh-CN.md']) {
    const source = await readFile(join(ROOT, file), 'utf8');
    for (const command of [
      'npm test',
      'npm run test:coverage',
      'npm run lint',
      'npm run build',
      'npm run check',
      'npm pack --dry-run',
      'node bin/dustroute.js check examples/undersized-route.json',
    ]) {
      assert.match(source, new RegExp(command.replaceAll(' ', '\\s+')));
    }
  }
});

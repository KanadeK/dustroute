import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, 'core'), { recursive: true });
await mkdir(join(DIST, 'examples'), { recursive: true });

for (const file of ['index.html', 'app.js', 'styles.css', 'favicon.svg']) {
  await copyFile(join(ROOT, 'web', file), join(DIST, file));
}

for (const file of await readdir(join(ROOT, 'src', 'core'))) {
  if (file.endsWith('.js')) {
    await copyFile(join(ROOT, 'src', 'core', file), join(DIST, 'core', file));
  }
}

for (const file of await readdir(join(ROOT, 'examples'))) {
  if (file.endsWith('.json')) {
    await copyFile(join(ROOT, 'examples', file), join(DIST, 'examples', file));
  }
}

const sampleSource = await readFile(
  join(ROOT, 'examples', 'garage-shop.json'),
  'utf8',
);
const sampleProject = JSON.parse(sampleSource);
await writeFile(
  join(DIST, 'sample.js'),
  `export const SAMPLE_PROJECT = ${JSON.stringify(sampleProject, null, 2)};\n`,
  'utf8',
);

console.log(`Built DustRoute static app at ${DIST}`);

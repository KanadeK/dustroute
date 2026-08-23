import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  ProjectValidationError,
  validateProject,
} from '../src/core/validate.js';

async function readExample(name) {
  const url = new URL(`../examples/${name}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

test('accepts the complete v1 garage-shop project', async () => {
  const input = await readExample('garage-shop.json');

  assert.equal(validateProject(input), input);
});

test('rejects unsupported schema versions with a stable issue path', async () => {
  const input = await readExample('garage-shop.json');
  input.schemaVersion = 2;

  assert.throws(
    () => validateProject(input),
    (error) => {
      assert.ok(error instanceof ProjectValidationError);
      assert.equal(error.code, 'INVALID_PROJECT');
      assert.deepEqual(error.issues, [
        { path: 'schemaVersion', message: 'must equal 1' },
      ]);
      return true;
    },
  );
});

test('reports duplicate IDs, broken references, repeated path segments, and non-physical values', async () => {
  const input = await readExample('garage-shop.json');
  input.fanCurve[2].cfm = 300;
  input.segments.push(structuredClone(input.segments[0]));
  input.segments[2].lengthFt = -1;
  input.routes[0].segmentIds = [
    'collector-inlet',
    'collector-inlet',
    'missing-segment',
  ];

  assert.throws(
    () => validateProject(input),
    (error) => {
      assert.ok(error instanceof ProjectValidationError);
      assert.deepEqual(error.issues, [
        {
          path: 'fanCurve[2].cfm',
          message: 'must be greater than the previous point',
        },
        { path: 'segments[2].lengthFt', message: 'must be greater than 0' },
        { path: 'segments[5].id', message: 'must be unique' },
        {
          path: 'routes[0].segmentIds[1]',
          message: 'must not repeat a segment in one route',
        },
        {
          path: 'routes[0].segmentIds[2]',
          message: 'references unknown segment "missing-segment"',
        },
      ]);
      return true;
    },
  );
});

test('rejects a fan curve that rises in pressure or lacks boundary endpoints', async () => {
  const input = await readExample('garage-shop.json');
  input.fanCurve[0].cfm = 10;
  input.fanCurve[2].pressureInWg = 11;
  input.fanCurve.at(-1).pressureInWg = 1;

  assert.throws(
    () => validateProject(input),
    (error) => {
      assert.ok(error instanceof ProjectValidationError);
      assert.deepEqual(error.issues, [
        { path: 'fanCurve[0].cfm', message: 'must equal 0' },
        {
          path: 'fanCurve[2].pressureInWg',
          message: 'must not exceed the previous point',
        },
        {
          path: 'fanCurve[4].pressureInWg',
          message: 'must equal 0 at the final point',
        },
      ]);
      return true;
    },
  );
});

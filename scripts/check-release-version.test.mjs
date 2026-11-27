import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mismatches, releaseVersion } from './check-release-version.mjs';

test('accepts release and prerelease tags', () => {
  assert.equal(releaseVersion('v1.0.0'), '1.0.0');
  assert.equal(releaseVersion('v1.1.0-beta.2'), '1.1.0-beta.2');
});

test('rejects tags that are not v-prefixed semver', () => {
  for (const tag of ['1.0.0', 'v1.0', 'release-1.0.0', '', undefined]) {
    assert.throws(() => releaseVersion(tag), /Tag must look like/);
  }
});

test('reports every package whose version differs from the tag', () => {
  const packages = [
    { name: '@waitkit/core', version: '1.0.0' },
    { name: '@waitkit/cli', version: '0.9.0' },
  ];
  assert.deepEqual(mismatches(packages, '1.0.0'), [{ name: '@waitkit/cli', version: '0.9.0' }]);
  assert.deepEqual(mismatches(packages.slice(0, 1), '1.0.0'), []);
});

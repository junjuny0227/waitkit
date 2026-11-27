#!/usr/bin/env node
// Fails unless every publishable package under packages/ has the version named by the tag.
// Usage: node scripts/check-release-version.mjs v1.2.3
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function releaseVersion(tag) {
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? '');
  if (match === null) throw new Error(`Tag must look like v1.2.3 or v1.2.3-beta.1, got "${tag}".`);
  return match[1];
}

export function readPublishablePackages(root) {
  const dir = join(root, 'packages');
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => JSON.parse(readFileSync(join(dir, entry.name, 'package.json'), 'utf8')))
    .filter((manifest) => manifest.private !== true)
    .map(({ name, version }) => ({ name, version }));
}

export function mismatches(packages, version) {
  return packages.filter((pkg) => pkg.version !== version);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const version = releaseVersion(process.argv[2]);
    const packages = readPublishablePackages(process.cwd());
    const wrong = mismatches(packages, version);
    if (packages.length === 0) throw new Error('No publishable packages found under packages/.');
    if (wrong.length > 0) {
      throw new Error(
        `Tag v${version} does not match: ${wrong.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')}.`,
      );
    }
    console.log(`v${version} matches ${packages.map((pkg) => pkg.name).join(', ')}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

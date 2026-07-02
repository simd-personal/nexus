import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mobileEnvPath = path.join(root, 'apps/mobile/.env');

if (!fs.existsSync(mobileEnvPath)) {
  console.error('Missing apps/mobile/.env — run npm run mobile:env first.');
  process.exit(1);
}

const apiUrl = fs
  .readFileSync(mobileEnvPath, 'utf8')
  .split('\n')
  .find((line) => line.startsWith('EXPO_PUBLIC_API_URL='))
  ?.slice('EXPO_PUBLIC_API_URL='.length)
  .trim();

if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
  console.error(
    'EXPO_PUBLIC_API_URL must point at your deployed API before an EAS preview build.\n' +
      'Set NEXT_PUBLIC_SITE_URL in .env.local (e.g. https://upperdeck.dev), then run npm run mobile:env again.'
  );
  process.exit(1);
}

for (const environment of ['preview', 'production'] as const) {
  console.log(`Pushing ${environment} env to EAS (API: ${apiUrl})…`);

  const result = spawnSync(
    'npx',
    ['eas-cli', 'env:push', environment, '--path', mobileEnvPath, '--force'],
    {
      cwd: path.join(root, 'apps/mobile'),
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`EAS ${environment} environment updated.`);
}

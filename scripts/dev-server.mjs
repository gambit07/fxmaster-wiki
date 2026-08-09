import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const astroPackagePath = require.resolve('astro/package.json');
const astroPackage = JSON.parse(fs.readFileSync(astroPackagePath, 'utf8'));
const astroBin = typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin?.astro;

if (!astroBin) {
  throw new Error('Unable to locate the Astro CLI. Run npm install before starting the preview.');
}

const astroCliPath = path.resolve(path.dirname(astroPackagePath), astroBin);
const env = {
  ...process.env,
  ASTRO_DEV_BACKGROUND: '0',
};

spawnSync(process.execPath, [astroCliPath, 'dev', 'stop'], {
  env,
  stdio: 'ignore',
});

const forwardedDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const codespaceName = process.env.CODESPACE_NAME;

if (process.env.CODESPACES === 'true' && codespaceName) {
  console.log(`Codespaces preview: https://${codespaceName}-4321.${forwardedDomain}/`);
  console.log('Open port 4321 from the Codespace Ports panel after Astro reports that it is ready.');
}

const child = spawn(
  process.execPath,
  [astroCliPath, 'dev', '--host', '0.0.0.0', '--port', '4321', ...process.argv.slice(2)],
  {
    env,
    stdio: 'inherit',
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 0;
});

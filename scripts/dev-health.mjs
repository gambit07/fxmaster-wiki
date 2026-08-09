const localUrl = 'http://127.0.0.1:4321/_astro/status';
const forwardedDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const codespaceName = process.env.CODESPACE_NAME;

try {
  const response = await fetch(localUrl, { signal: AbortSignal.timeout(5000) });
  const body = await response.text();

  if (!response.ok) {
    console.error(`Astro responded at ${localUrl}, but returned HTTP ${response.status}.`);
    console.error(body);
    process.exit(1);
  }

  console.log(`Astro is responding locally: ${body}`);
  if (process.env.CODESPACES === 'true' && codespaceName) {
    console.log(`Codespaces preview: https://${codespaceName}-4321.${forwardedDomain}/`);
  }
} catch (error) {
  console.error(`No Astro development server is responding at ${localUrl}.`);
  console.error('Start it with npm run dev and leave that terminal open.');
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
}

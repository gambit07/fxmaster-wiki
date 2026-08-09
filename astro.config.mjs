import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const repository = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const owner = repository[0] || 'gambit07';
const repositoryName = repository[1] || 'fxmaster-wiki';
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const isCodespaces = process.env.CODESPACES === 'true';
const codespaceName = process.env.CODESPACE_NAME || '';
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
const codespacesHost = codespaceName ? `${codespaceName}-4321.${forwardingDomain}` : '';
const repositoryIsUserSite = repositoryName.toLowerCase() === `${owner}.github.io`.toLowerCase();
const cnamePath = fileURLToPath(new URL('./public/CNAME', import.meta.url));
const customDomain = fs.existsSync(cnamePath) ? fs.readFileSync(cnamePath, 'utf8').trim() : '';

const inferredSite = customDomain
  ? `https://${customDomain}`
  : isCodespaces && codespacesHost
    ? `https://${codespacesHost}`
    : isGitHubPagesBuild
      ? `https://${owner}.github.io`
      : 'http://localhost:4321';
const inferredBase = customDomain || isCodespaces || repositoryIsUserSite || !isGitHubPagesBuild ? '/' : `/${repositoryName}`;
const site = isCodespaces ? inferredSite : process.env.SITE_URL || inferredSite;
const base = isCodespaces ? '/' : process.env.BASE_PATH || inferredBase;
const repositoryUrl = `https://github.com/${owner}/${repositoryName}`;
const basePrefix = base === '/' ? '' : base.replace(/\/$/, '');
const faviconPath = `${basePrefix}/favicon.svg`;
const ogImageUrl = new URL(`${basePrefix}/og-image.png`, site).href;
const soundEffectsManagerLabel = 'Sound Effects Manager';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  server: {
    host: isCodespaces ? '0.0.0.0' : false,
    port: 4321,
    allowedHosts: codespacesHost ? [codespacesHost] : [],
  },
  vite: {
    server: {
      strictPort: true,
    },
  },
  integrations: [
    starlight({
      title: 'FXMaster Wiki',
      description: 'Documentation for Gambit’s FXMaster and FXMaster+ for Foundry Virtual Tabletop.',
      logo: {
        src: './src/assets/fxmaster-mark.svg',
        alt: 'FXMaster',
        replacesTitle: false,
      },
      favicon: faviconPath,
      customCss: ['./src/styles/custom.css'],
      routeMiddleware: './src/routeData.ts',
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
      lastUpdated: true,
      social: [
        { icon: 'github', label: 'FXMaster Wiki on GitHub', href: repositoryUrl },
      ],
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#12131c' } },
        { tag: 'meta', attrs: { name: 'color-scheme', content: 'dark light' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'FXMaster Wiki' } },
        { tag: 'meta', attrs: { property: 'og:image', content: ogImageUrl } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      sidebar: [
        { label: 'FXMaster', link: '/' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'FXMaster vs. FXMaster+', link: '/getting-started/fxmaster-vs-plus/' },
            { label: 'Scene Controls', link: '/getting-started/scene-controls/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Particles and Filters', link: '/concepts/particles-and-filters/' },
            { label: 'Layers and Ordering', link: '/concepts/layers-and-ordering/' },
            { label: 'Direction and Movement', link: '/concepts/direction-and-movement/' },
            { label: 'Top-Down and Backgrounds', link: '/concepts/top-down-and-backgrounds/' },
          ],
        },
        {
          label: 'Particle Effects',
          items: [
            { label: 'Overview', link: '/particles/' },
            { label: 'Weather Effects', link: '/particles/weather/' },
            { label: 'Ambient and Foliage', link: '/particles/ambient-and-foliage/' },
            { label: 'Animals', link: '/particles/creatures/' },
          ],
        },
        {
          label: 'Filter Effects',
          items: [
            { label: 'Overview', link: '/filters/' },
            { label: 'Visual Filters', link: '/filters/visual/' },
            { label: 'Environmental Filters', link: '/filters/environmental/' },
          ],
        },
        {
          label: 'Regions and Layers',
          items: [
            { label: 'Region Effects', link: '/regions/' },
            { label: 'Suppression and Restrictions', link: '/regions/suppression/' },
            { label: 'Overhead Levels', link: '/regions/overhead-levels/' },
            { label: 'Manage Layers', link: '/regions/manage-layers/' },
          ],
        },
        {
          label: 'FXMaster+',
          items: [
            { label: 'Overview', link: '/plus/' },
            { label: 'Accessing FXMaster+', link: '/plus/access/' },
            { label: soundEffectsManagerLabel, link: '/plus/soundfx/' },
            { label: 'Custom Particle Effects', link: '/plus/custom-particles/' },
            { label: 'Water Module Settings', link: '/plus/water-module-settings/' },
            { label: 'Wind Painting', link: '/plus/wind-painting/' },
          ],
        },
        {
          label: 'Presets',
          items: [
            { label: 'Using Presets', link: '/presets/' },
            { label: 'Preset Catalog', link: '/presets/catalog/' },
          ],
        },
        {
          label: 'Automation',
          items: [
            { label: 'Overview', link: '/automation/' },
            { label: 'Preset API', link: '/automation/preset-api/' },
            { label: 'Direct Effect API', link: '/automation/effect-api/' },
            { label: 'Macro Recipes', link: '/automation/macros/' },
            { label: 'Hooks and Integrations', link: '/automation/hooks/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Effect Catalog', link: '/reference/effects/' },
            { label: 'Parameter Glossary', link: '/reference/parameters/' },
            { label: 'Settings', link: '/reference/settings/' },
            { label: 'Compatibility', link: '/reference/compatibility/' },
            { label: 'Troubleshooting', link: '/reference/troubleshooting/' },
            { label: 'FAQ', link: '/reference/faq/' },
            {
              label: 'All Effect Pages',
              collapsed: true,
              items: [{ autogenerate: { directory: 'reference/effects/details', collapsed: true } }],
            },
          ],
        },
      ],
    }),
  ],
});

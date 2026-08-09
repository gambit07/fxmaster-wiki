import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getParameterDescription } from '../src/data/parameter-info.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'src/content/docs');
const referencePath = path.join(root, 'src/data/reference.json');
const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
const errors = [];
const warnings = [];

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const relative = (filePath) => path.relative(root, filePath).replaceAll(path.sep, '/');
const read = (filePath) => fs.readFileSync(filePath, 'utf8');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const docFiles = walk(docsRoot).filter((filePath) => /\.mdx?$/.test(filePath));
const removedRepositoryFiles = ['README.md', 'CONTRIBUTING.md', '.env.example', 'public/CNAME.example'];
for (const fileName of removedRepositoryFiles) {
  if (fs.existsSync(path.join(root, fileName))) fail(`Removed repository scaffold is still present: ${fileName}`);
}

const astroConfig = read(path.join(root, 'astro.config.mjs'));
if (astroConfig.includes('editLink:') || astroConfig.includes('EDIT_URL')) {
  fail('Repository edit-link configuration is still present.');
}
const settingsMarkdownPath = path.join(docsRoot, 'reference/settings.md');
const obsoleteSettingsMdxPath = path.join(docsRoot, 'reference/settings.mdx');
if (!fs.existsSync(settingsMarkdownPath)) fail('Reference Settings page must exist as reference/settings.md.');
if (fs.existsSync(obsoleteSettingsMdxPath)) fail('Obsolete reference/settings.mdx must be removed to avoid a duplicate Settings route.');
for (const filePath of docFiles.filter((entry) => entry.endsWith('.md'))) {
  const source = read(filePath);
  if (/^import\s/m.test(source) || /<[A-Z][A-Za-z0-9]*(?:\s|\/>)/.test(source)) {
    fail(`${relative(filePath)} contains Astro/MDX component syntax but uses a .md extension.`);
  }
}

function routeFor(filePath) {
  const stem = relative(filePath)
    .replace(/^src\/content\/docs\//, '')
    .replace(/\.(md|mdx)$/, '')
    .replace(/(^|\/)index$/, '');
  return `/${stem}`.replace(/\/{2,}/g, '/').replace(/\/?$/, '/');
}

function normalizeRoute(value) {
  const decoded = decodeURI(value).replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
  return decoded.replace(/\/{2,}/g, '/').replace(/\/?$/, '/');
}

function inspectValue(value, location) {
  if (typeof value === 'string') {
    const unresolved = [
      '[object Object]',
      'localizeKeyOrFallback',
      'normalizedRangeDefault',
      'defaults[',
      'undefined',
      'NaN',
    ];
    for (const marker of unresolved) if (value.includes(marker)) fail(`${location} contains unresolved value: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectValue(entry, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) inspectValue(entry, `${location}.${key}`);
  }
}

function conditionKeys(value) {
  if (!value) return [];
  if (Array.isArray(value)) return [...new Set(value.flatMap(conditionKeys))];
  if (typeof value === 'object') return Object.keys(value);
  return [];
}

if (!Array.isArray(reference.effects) || reference.effects.length === 0) fail('Reference data has no effects.');
if (!Array.isArray(reference.customParticleBases) || reference.customParticleBases.length === 0) fail('Reference data has no custom particle bases.');
if (!Array.isArray(reference.presets) || reference.presets.length === 0) fail('Reference data has no presets.');
if (reference.referenceFormat !== 3) fail(`Expected reference format 3; found ${reference.referenceFormat ?? 'none'}.`);
if (!reference.sourceVersions?.core || !reference.sourceVersions?.plus) fail('Reference data is missing source version metadata.');

const expectedCounts = {
  effects: 43,
  coreParticles: 16,
  coreFilters: 8,
  plusParticles: 10,
  plusFilters: 9,
  customParticleBases: 4,
  presetFamilies: 42,
  presetVariants: 63,
};
const actualCounts = {
  effects: reference.effects.length,
  coreParticles: reference.effects.filter((effect) => effect.package === 'core' && effect.kind === 'particle').length,
  coreFilters: reference.effects.filter((effect) => effect.package === 'core' && effect.kind === 'filter').length,
  plusParticles: reference.effects.filter((effect) => effect.package === 'plus' && effect.kind === 'particle').length,
  plusFilters: reference.effects.filter((effect) => effect.package === 'plus' && effect.kind === 'filter').length,
  customParticleBases: reference.customParticleBases?.length ?? 0,
  presetFamilies: new Set(reference.presets.map((preset) => preset.id)).size,
  presetVariants: reference.presets.length,
};
for (const [key, expected] of Object.entries(expectedCounts)) {
  if (actualCounts[key] !== expected) fail(`Expected ${expected} ${key}; found ${actualCounts[key]}.`);
}

const effectIds = new Set();
const customBaseIds = new Set();
const parameterDefinitionIds = new Set();
let parameterCount = 0;
let customBaseParameterCount = 0;
const effectRuntimeIds = new Set();
const validGroups = new Set(['ambient', 'creatures', 'environmental', 'foliage', 'visual', 'weather']);
const manualSoundAvailabilityDetail = 'the matching enabled SoundFX rule uses Multi-Sound Mode = Manual with at least two configured sounds';
const expectedTokenAvoidanceEffects = new Set(['rats', 'spiders', 'fireflies', 'fish', 'ghosts']);
const expectedWaterRegionOnlyParameters = new Set(['followRegionPath', 'pathInfluence', 'fadePercent']);
const expectedParticleManagementGroups = new Map([
  ['bats', 'creatures'], ['birds', 'creatures'], ['crows', 'creatures'], ['eagles', 'creatures'],
  ['rats', 'creatures'], ['spiders', 'creatures'], ['fireflies', 'creatures'], ['fish', 'creatures'],
  ['bubbles', 'ambient'], ['embers', 'ambient'], ['stars', 'ambient'], ['autumnleaves', 'ambient'],
  ['sakurabloom', 'ambient'], ['sakurablossoms', 'ambient'], ['summerleaves', 'ambient'], ['ghosts', 'ambient'],
  ['magiccrystals', 'ambient'], ['clouds', 'weather'], ['fog', 'weather'], ['rain', 'weather'],
  ['hail', 'weather'], ['snow', 'weather'], ['snowstorm', 'weather'], ['fireparticles', 'weather'],
  ['sandstorm', 'weather'], ['windwisps', 'weather'],
]);
const effectLabelCounts = new Map();
for (const effect of reference.effects ?? []) effectLabelCounts.set(effect.label, (effectLabelCounts.get(effect.label) ?? 0) + 1);

const integratedOverviewMarkers = {
  rain: '## Rain presentation',
  snow: '## Airborne and settled snow',
  snowstorm: '## Snowstorm layers',
  autumnleaves: '## Airborne and background leaves',
  summerleaves: '## Summer leaf layers',
  sakurabloom: '## Airborne petals and accumulation',
  sakurablossoms: '## Blossom ambience and ground coverage',
  water: '## Major systems',
  wind: '## Procedural and painted Wind',
  fire: '## Fire filter overview',
  fireparticles: '## Manual Placement',
  ghosts: '## Manual Placement',
  auroraborealis: '## Presentation modes',
};
for (const effect of reference.effects ?? []) {
  const location = `effect ${effect.id || '(missing id)'}`;
  if (!effect.id) fail('An effect is missing its id.');
  if (effectIds.has(effect.id)) fail(`Duplicate effect id: ${effect.id}`);
  effectIds.add(effect.id);
  parameterDefinitionIds.add(effect.id);
  effectRuntimeIds.add(effect.id === 'fog-filter' ? 'fog' : effect.id);
  if (!['particle', 'filter'].includes(effect.kind)) fail(`Invalid kind for ${effect.id}: ${effect.kind}`);
  if (!['core', 'plus'].includes(effect.package)) fail(`Invalid package for ${effect.id}: ${effect.package}`);
  if (!validGroups.has(effect.group)) fail(`Invalid group for ${effect.id}: ${effect.group}`);
  const expectedGroup = expectedParticleManagementGroups.get(effect.id);
  if (effect.kind === 'particle' && expectedGroup && effect.group !== expectedGroup) {
    fail(`${effect.id} is assigned to ${effect.group}; expected ${expectedGroup} from Particle Effects Management.`);
  }
  for (const privateField of ['className', 'source', 'icon']) {
    if (privateField in effect) fail(`${location} exposes private extraction field ${privateField}.`);
  }
  if (!effect.label?.trim()) fail(`${location} has no label.`);
  if (!effect.description?.trim()) fail(`${location} has no description.`);
  if (!Array.isArray(effect.parameters)) fail(`Parameters are not an array for ${effect.id}.`);
  if (effect.parameterCount !== effect.parameters?.length) fail(`${location} parameterCount is ${effect.parameterCount}; expected ${effect.parameters?.length}.`);

  const parameterIds = new Set();
  for (const parameter of effect.parameters ?? []) {
    parameterCount += 1;
    const parameterLocation = `${effect.id}.${parameter.id || '(missing id)'}`;
    if (!parameter.id) fail(`Unnamed parameter on ${effect.id}.`);
    if (parameterIds.has(parameter.id)) fail(`Duplicate parameter ${parameterLocation}.`);
    parameterIds.add(parameter.id);
    if (!parameter.label?.trim()) fail(`${parameterLocation} has no label.`);
    if (!parameter.type?.trim()) fail(`${parameterLocation} has no control type.`);
    if (!parameter.description?.trim()) fail(`${parameterLocation} has no canvas description.`);
    const parameterDescription = parameter.description?.trim();
    if (!parameterDescription || parameterDescription.length < 24) fail(`${parameterLocation} has an incomplete canvas description.`);
    if (parameterDescription === parameter.label.trim()) fail(`${parameterLocation} repeats its label instead of explaining its canvas behavior.`);
    const generatedDescription = getParameterDescription(effect, parameter).trim();
    if (parameterDescription !== generatedDescription) fail(`${parameterLocation} has a stale generated description.`);
    for (const artifact of ['individual the ', 'how many the ', 'of the the ', 'the the ']) {
      if (parameterDescription.toLowerCase().includes(artifact)) fail(`${parameterLocation} contains a grammar artifact: ${artifact.trim()}`);
    }
    if ('internalRange' in parameter) fail(`${parameterLocation} exposes an internal normalization range.`);
    if (parameter.min !== undefined && parameter.max !== undefined && Number(parameter.min) > Number(parameter.max)) {
      fail(`${parameterLocation} has min ${parameter.min} greater than max ${parameter.max}.`);
    }
    if (parameter.default !== undefined && typeof parameter.default === 'number') {
      if (parameter.min !== undefined && parameter.default < parameter.min) fail(`${parameterLocation} default is below its minimum.`);
      if (parameter.max !== undefined && parameter.default > parameter.max) fail(`${parameterLocation} default is above its maximum.`);
    }
    if (parameter.options !== undefined && (parameter.options === null || Array.isArray(parameter.options) || typeof parameter.options !== 'object')) {
      fail(`${parameterLocation} options must be an object.`);
    }
    for (const conditionName of ['showWhen', 'hideWhen']) {
      if (typeof parameter[conditionName] === 'string') {
        fail(`${parameterLocation} uses a generic ${conditionName} string instead of an explicit parameter condition.`);
      }
    }
    if (parameter.id === 'soundFxManualSoundIds') {
      if (parameter.availabilityDetail !== manualSoundAvailabilityDetail) {
        fail(`${parameterLocation} is missing the Manual Multi-Sound availability requirement.`);
      }
      if (parameter.showWhen?.soundFxEnabled !== true) fail(`${parameterLocation} must also require Sound FX = On.`);
    }
    if (parameter.sceneOnly && parameter.regionOnly) fail(`${parameterLocation} cannot be both Scene-only and Region-only.`);
    if (parameter.id === 'levels' && parameter.sceneOnly !== true) fail(`${parameterLocation} must be marked Scene-only.`);
    inspectValue(parameter, parameterLocation);
  }

  for (const parameter of effect.parameters ?? []) {
    for (const conditionName of ['showWhen', 'hideWhen']) {
      for (const key of conditionKeys(parameter[conditionName])) {
        if (!parameterIds.has(key)) fail(`${effect.id}.${parameter.id} ${conditionName} references unknown parameter ${key}.`);
      }
    }
  }
  const hasTokenAvoidance = parameterIds.has('tokenAvoidance');
  if (hasTokenAvoidance !== expectedTokenAvoidanceEffects.has(effect.id)) {
    fail(`${effect.id} Token Avoidance availability does not match the reviewed effect definition.`);
  }

  const actualRegionOnly = new Set((effect.parameters ?? []).filter((parameter) => parameter.regionOnly).map((parameter) => parameter.id));
  const expectedRegionOnly = new Set(effect.kind === 'filter' ? ['fadePercent'] : []);
  if (effect.id === 'water') {
    expectedWaterRegionOnlyParameters.forEach((parameterId) => expectedRegionOnly.add(parameterId));
  }
  for (const parameterId of expectedRegionOnly) {
    if (!actualRegionOnly.has(parameterId)) fail(`${effect.id}.${parameterId} must be included and marked Region-only.`);
  }
  if (effect.id === 'water') {
    for (const parameterId of ['followRegionPath', 'pathInfluence']) {
      const parameter = effect.parameters.find((entry) => entry.id === parameterId);
      if (parameter?.availabilityDetail !== 'the Follow Region Path feature is enabled in Water Module Settings') {
        fail(`water.${parameterId} is missing the Water Module Settings availability requirement.`);
      }
    }
  }
  for (const parameterId of actualRegionOnly) {
    if (!expectedRegionOnly.has(parameterId)) fail(`${effect.id}.${parameterId} is unexpectedly marked Region-only.`);
  }
  if (effect.id === 'lightningbolts') {
    const parameterMap = new Map(effect.parameters.map((parameter) => [parameter.id, parameter]));
    const topDownCondition = JSON.stringify([
      { mode: { operator: 'contains', value: 'topDown' } },
      { mode: { operator: 'contains', value: 'mixed' } },
    ]);
    for (const parameterId of ['topDownBoltsVariable', 'topDownScale', 'topDownBolts']) {
      if (JSON.stringify(parameterMap.get(parameterId)?.showWhen) !== topDownCondition) {
        fail(`lightningbolts.${parameterId} must require Lightning Mode to include Top Down or Mixed.`);
      }
    }
    const triggerChance = parameterMap.get('triggerChance')?.showWhen;
    if (JSON.stringify(triggerChance) !== JSON.stringify([{ syncFlash: true }, { audioAware: true }])) {
      fail('lightningbolts.triggerChance must require Sync Flash or Audio Aware.');
    }
  }

  const fadePercent = effect.parameters.find((parameter) => parameter.id === 'fadePercent');
  if (effect.kind === 'filter') {
    if (!fadePercent) fail(`${effect.id} is missing the Region-only Edge Fade % parameter.`);
    else {
      if (fadePercent.label !== 'Edge Fade %') fail(`${effect.id}.fadePercent has the wrong displayed label.`);
      if (fadePercent.type !== 'range' || fadePercent.default !== 0 || fadePercent.min !== 0 || fadePercent.max !== 1 || fadePercent.step !== 0.01) {
        fail(`${effect.id}.fadePercent has stale Region filter range metadata.`);
      }
    }
  } else if (fadePercent) {
    fail(`${effect.id} incorrectly exposes the shared particle Region Edge Fade % as an effect parameter.`);
  }

  const detailPage = path.join(docsRoot, 'reference/effects/details', `${effect.id}.mdx`);
  if (!fs.existsSync(detailPage)) {
    fail(`Missing generated detail page: ${effect.id}`);
  } else {
    const page = read(detailPage);
    if (!page.includes(`<ParameterTable effectId="${effect.id}" />`)) fail(`Detail page ${effect.id} does not load its parameter table.`);
    if (!page.includes(`| Exposed parameters | ${effect.parameterCount} |`)) fail(`Detail page ${effect.id} has a stale parameter count.`);
    const packageBadge = effect.package === 'plus' ? 'FXMaster+' : 'FXMaster';
    const kindBadge = effect.kind === 'particle' ? 'Particle' : 'Filter';
    const expectedSidebarBadge = effectLabelCounts.get(effect.label) > 1 ? `${packageBadge} · ${kindBadge}` : packageBadge;
    if (!page.includes(`text: ${JSON.stringify(expectedSidebarBadge)}`)) {
      fail(`Detail page ${effect.id} has incorrect sidebar badge text; expected ${expectedSidebarBadge}.`);
    }
    if (/\|\s*Core(?:\s*,|\s*\|)/.test(page)) fail(`Detail page ${effect.id} still labels bundled preset availability as Core.`);
    const referenceTablePosition = page.indexOf('| Reference | Value |');
    const firstMainHeadingPosition = page.indexOf('\n## ');
    if (referenceTablePosition < 0) fail(`Detail page ${effect.id} is missing its Reference table.`);
    if (firstMainHeadingPosition >= 0 && referenceTablePosition > firstMainHeadingPosition) {
      fail(`Detail page ${effect.id} places its Reference table below a main section.`);
    }
    if (!hasTokenAvoidance && page.includes('Token Avoidance')) {
      fail(`Detail page ${effect.id} references Token Avoidance even though the effect does not expose it.`);
    }

    const importantSection = page.match(/## Important controls\s+([\s\S]*?)(?=\n## )/);
    if (!importantSection) {
      fail(`Detail page ${effect.id} has no Important controls section.`);
    } else {
      const controls = [...importantSection[1].matchAll(/^- \*\*(.+?):\*\*/gm)].map((match) => match[1]);
      if (controls.length < 2) fail(`Detail page ${effect.id} lists fewer than two important controls.`);
      if (importantSection[1].includes('Primary controls:')) fail(`Detail page ${effect.id} contains the generic Primary controls fallback.`);
      if (importantSection[1].includes('**Sound FX:**')) fail(`Detail page ${effect.id} uses Sound FX as a generic important control.`);
      for (const label of controls) {
        if (!effect.parameters.some((parameter) => parameter.label === label)) {
          fail(`Detail page ${effect.id} lists unknown important control label: ${label}`);
        }
      }
    }

    if (page.includes(':::tip[Setup order]')) fail(`Detail page ${effect.id} still contains the generic Setup order callout.`);
    if (page.includes('## Related effects')) fail(`Detail page ${effect.id} still contains a Related effects section.`);
    const parameterTablePosition = page.indexOf(`<ParameterTable effectId="${effect.id}" />`);
    const directApiPosition = page.indexOf('## Direct-effect API example');
    if (directApiPosition < 0) fail(`Detail page ${effect.id} has no Direct-effect API example.`);
    if (directApiPosition >= 0 && directApiPosition < parameterTablePosition) fail(`Detail page ${effect.id} places the Direct-effect API example before its parameter table.`);
    if (directApiPosition >= 0 && page.slice(directApiPosition + 1).includes('\n## ')) fail(`Detail page ${effect.id} has another main section after the Direct-effect API example.`);
    const overviewMarker = integratedOverviewMarkers[effect.id];
    if (overviewMarker && !page.includes(overviewMarker)) fail(`Detail page ${effect.id} is missing its integrated overview content.`);
  }
}

const expectedCustomBaseParameters = new Map([
  ['custom-directional-drift', 35],
  ['custom-ambient-float', 31],
  ['custom-manual-placement', 35],
  ['custom-sound-only', 2],
]);
for (const customBase of reference.customParticleBases ?? []) {
  const location = `custom particle base ${customBase.id || '(missing id)'}`;
  if (!customBase.id) fail('A custom particle base is missing its id.');
  if (customBaseIds.has(customBase.id)) fail(`Duplicate custom particle base id: ${customBase.id}`);
  if (effectIds.has(customBase.id)) fail(`Custom particle base conflicts with an effect id: ${customBase.id}`);
  customBaseIds.add(customBase.id);
  parameterDefinitionIds.add(customBase.id);
  if (!expectedCustomBaseParameters.has(customBase.id)) fail(`Unexpected custom particle base id: ${customBase.id}`);
  if (customBase.referenceType !== 'custom-base') fail(`${location} has invalid referenceType ${customBase.referenceType}.`);
  if (customBase.kind !== 'particle') fail(`${location} must use particle kind.`);
  if (customBase.package !== 'plus') fail(`${location} must use the plus package.`);
  if (!customBase.label?.trim()) fail(`${location} has no label.`);
  if (!customBase.description?.trim()) fail(`${location} has no description.`);
  if (!Array.isArray(customBase.parameters)) fail(`Parameters are not an array for ${customBase.id}.`);
  if (customBase.parameterCount !== customBase.parameters?.length) fail(`${location} parameterCount is ${customBase.parameterCount}; expected ${customBase.parameters?.length}.`);
  if (customBase.parameterCount !== expectedCustomBaseParameters.get(customBase.id)) {
    fail(`${location} has ${customBase.parameterCount} parameters; expected ${expectedCustomBaseParameters.get(customBase.id)}.`);
  }

  const parameterIds = new Set();
  for (const parameter of customBase.parameters ?? []) {
    customBaseParameterCount += 1;
    const parameterLocation = `${customBase.id}.${parameter.id || '(missing id)'}`;
    if (!parameter.id) fail(`Unnamed parameter on ${customBase.id}.`);
    if (parameterIds.has(parameter.id)) fail(`Duplicate parameter ${parameterLocation}.`);
    parameterIds.add(parameter.id);
    if (!parameter.label?.trim()) fail(`${parameterLocation} has no label.`);
    if (!parameter.type?.trim()) fail(`${parameterLocation} has no control type.`);
    if (!parameter.description?.trim() || parameter.description.trim().length < 24) fail(`${parameterLocation} has an incomplete canvas description.`);
    const generatedDescription = getParameterDescription(customBase, parameter).trim();
    if (parameter.description.trim() !== generatedDescription) fail(`${parameterLocation} has a stale generated description.`);
    if ('internalRange' in parameter) fail(`${parameterLocation} exposes an internal normalization range.`);
    if (parameter.min !== undefined && parameter.max !== undefined && Number(parameter.min) > Number(parameter.max)) {
      fail(`${parameterLocation} has min ${parameter.min} greater than max ${parameter.max}.`);
    }
    if (parameter.default !== undefined && typeof parameter.default === 'number') {
      if (parameter.min !== undefined && parameter.default < parameter.min) fail(`${parameterLocation} default is below its minimum.`);
      if (parameter.max !== undefined && parameter.default > parameter.max) fail(`${parameterLocation} default is above its maximum.`);
    }
    if (parameter.options !== undefined && (parameter.options === null || Array.isArray(parameter.options) || typeof parameter.options !== 'object')) {
      fail(`${parameterLocation} options must be an object.`);
    }
    for (const conditionName of ['showWhen', 'hideWhen']) {
      if (typeof parameter[conditionName] === 'string') {
        fail(`${parameterLocation} uses a generic ${conditionName} string instead of an explicit parameter condition.`);
      }
    }
    if (parameter.id === 'soundFxManualSoundIds') {
      if (parameter.availabilityDetail !== manualSoundAvailabilityDetail) {
        fail(`${parameterLocation} is missing the Manual Multi-Sound availability requirement.`);
      }
      if (parameter.showWhen?.soundFxEnabled !== true) fail(`${parameterLocation} must also require Sound FX = On.`);
    }
    if (parameter.sceneOnly && parameter.regionOnly) fail(`${parameterLocation} cannot be both Scene-only and Region-only.`);
    if (parameter.id === 'levels' && parameter.sceneOnly !== true) fail(`${parameterLocation} must be marked Scene-only.`);
    inspectValue(parameter, parameterLocation);
  }
  for (const parameter of customBase.parameters ?? []) {
    for (const conditionName of ['showWhen', 'hideWhen']) {
      for (const key of conditionKeys(parameter[conditionName])) {
        if (!parameterIds.has(key)) fail(`${customBase.id}.${parameter.id} ${conditionName} references unknown parameter ${key}.`);
      }
    }
  }

  const detailPage = path.join(docsRoot, 'reference/effects/details', `${customBase.id}.mdx`);
  if (!fs.existsSync(detailPage)) {
    fail(`Missing custom particle base detail page: ${customBase.id}`);
  } else {
    const page = read(detailPage);
    if (!page.includes(`<ParameterTable effectId="${customBase.id}" />`)) fail(`Custom base page ${customBase.id} does not load its parameter table.`);
    if (!page.includes(`| Exposed parameters | ${customBase.parameterCount} |`)) fail(`Custom base page ${customBase.id} has a stale parameter count.`);
    if (!page.includes('text: FXMaster+')) fail(`Custom base page ${customBase.id} does not use the FXMaster+ sidebar badge.`);
    if (page.includes('text: Custom base')) fail(`Custom base page ${customBase.id} still uses the retired Custom base sidebar badge.`);
    const importantSection = page.match(/## Important controls\s+([\s\S]*?)(?=\n## )/);
    if (!importantSection) {
      fail(`Custom base page ${customBase.id} has no Important controls section.`);
    } else {
      const controls = [...importantSection[1].matchAll(/^- \*\*(.+?):\*\*/gm)].map((match) => match[1]);
      if (controls.length < 2) fail(`Custom base page ${customBase.id} lists fewer than two important controls.`);
      for (const label of controls) {
        if (!customBase.parameters.some((parameter) => parameter.label === label)) {
          fail(`Custom base page ${customBase.id} lists unknown important control label: ${label}`);
        }
      }
    }
    if (page.includes('## Related effects')) fail(`Custom base page ${customBase.id} contains a Related effects section.`);
    const parameterTablePosition = page.indexOf(`<ParameterTable effectId="${customBase.id}" />`);
    const directApiPosition = page.indexOf('## Direct-effect API example');
    if (directApiPosition < 0) fail(`Custom base page ${customBase.id} has no Direct-effect API example.`);
    if (directApiPosition >= 0 && directApiPosition < parameterTablePosition) fail(`Custom base page ${customBase.id} places the Direct-effect API example before its parameter table.`);
    if (directApiPosition >= 0 && page.slice(directApiPosition + 1).includes('\n## ')) fail(`Custom base page ${customBase.id} has another main section after the Direct-effect API example.`);
  }
}
for (const [customBaseId] of expectedCustomBaseParameters) {
  if (!customBaseIds.has(customBaseId)) fail(`Missing custom particle base reference: ${customBaseId}`);
}

const presetKeys = new Set();
for (const preset of reference.presets ?? []) {
  const key = `${preset.id}:${preset.tier}:${preset.variant}`;
  if (!preset.id || !preset.tier || !preset.variant) fail(`Preset variant ${key} is missing required metadata.`);
  if (presetKeys.has(key)) fail(`Duplicate preset variant: ${key}`);
  presetKeys.add(key);
  if (!['free', 'plus'].includes(preset.tier)) fail(`Invalid preset tier for ${key}: ${preset.tier}`);
  if (!['normal', 'topDown'].includes(preset.variant)) fail(`Invalid preset variant for ${key}: ${preset.variant}`);
  const listedEffects = [...(preset.particles ?? []), ...(preset.filters ?? [])];
  if (preset.effectCount !== listedEffects.length) fail(`${key} effectCount is ${preset.effectCount}; expected ${listedEffects.length}.`);
  for (const effectId of listedEffects) if (!effectRuntimeIds.has(effectId)) fail(`${key} references unknown effect: ${effectId}`);
}

const detailPages = docFiles.filter((filePath) => relative(filePath).startsWith('src/content/docs/reference/effects/details/'));
for (const detailPage of detailPages) {
  const id = path.basename(detailPage, path.extname(detailPage));
  if (!parameterDefinitionIds.has(id)) fail(`Stale effect detail page has no reference entry: ${relative(detailPage)}`);
}

const routes = new Map();
for (const filePath of docFiles) {
  const route = routeFor(filePath);
  if (routes.has(route)) fail(`Duplicate documentation route ${route}: ${relative(routes.get(route))} and ${relative(filePath)}`);
  routes.set(route, filePath);
  const source = read(filePath);
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter || !/^title:\s*.+$/m.test(frontmatter[1])) fail(`${relative(filePath)} is missing a frontmatter title.`);
  if (!frontmatter || !/^description:\s*.+$/m.test(frontmatter[1])) warn(`${relative(filePath)} is missing a frontmatter description.`);

  for (const match of source.matchAll(/^import\s+.+?\s+from\s+['"]([^'"]+)['"];?$/gm)) {
    const imported = match[1];
    if (!imported.startsWith('.')) continue;
    const target = path.resolve(path.dirname(filePath), imported);
    const candidates = [target, `${target}.ts`, `${target}.js`, `${target}.mjs`, `${target}.astro`, path.join(target, 'index.ts'), path.join(target, 'index.js')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) fail(`${relative(filePath)} imports missing file ${imported}.`);
  }

  for (const match of source.matchAll(/<ParameterTable\s+effectId="([^"]+)"\s*\/>/g)) {
    if (!parameterDefinitionIds.has(match[1])) fail(`${relative(filePath)} references unknown ParameterTable effect ${match[1]}.`);
  }

  for (const match of source.matchAll(/<EffectCatalog\b([^>]*)\/>/g)) {
    const props = match[1];
    const scalarGroup = props.match(/\bgroup="([^"]+)"/);
    if (scalarGroup && !validGroups.has(scalarGroup[1])) fail(`${relative(filePath)} uses unknown EffectCatalog group ${scalarGroup[1]}.`);
    const arrayGroup = props.match(/\bgroup=\{\[([^\]]+)\]\}/);
    if (arrayGroup) {
      for (const group of [...arrayGroup[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1])) {
        if (!validGroups.has(group)) fail(`${relative(filePath)} uses unknown EffectCatalog group ${group}.`);
      }
    }
    const idArray = props.match(/\bids=\{\[([^\]]+)\]\}/);
    if (idArray) {
      const listedIds = [...idArray[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]);
      if (new Set(listedIds).size !== listedIds.length) fail(`${relative(filePath)} contains duplicate EffectCatalog ids.`);
      for (const id of listedIds) if (!effectIds.has(id)) fail(`${relative(filePath)} uses unknown EffectCatalog id ${id}.`);
    }
  }

  if (/href="\//.test(source) || /\]\(\//.test(source)) {
    warn(`${relative(filePath)} contains a root-absolute content link; prefer withBase() or a relative Markdown link for repository Pages builds.`);
  }
}

const removedStandaloneGuides = [
  'src/content/docs/filters/water.mdx',
  'src/content/docs/filters/wind.mdx',
  'src/content/docs/filters/fire.mdx',
  'src/content/docs/filters/aurora-borealis.mdx',
  'src/content/docs/particles/rain.mdx',
  'src/content/docs/particles/snow-and-snowstorm.mdx',
  'src/content/docs/particles/leaves-and-backgrounds.mdx',
  'src/content/docs/plus/manual-placement.mdx',
  'src/content/docs/plus/sound-only.mdx',
  'src/content/docs/plus/water-options.mdx',
];
for (const guide of removedStandaloneGuides) {
  if (fs.existsSync(path.join(root, guide))) fail(`Removed or duplicate standalone guide still exists: ${guide}`);
}

const regionSource = read(path.join(docsRoot, 'regions/index.mdx'));
const expectedEdgeFade = 'A value of `0` creates a hard edge; higher values soften the transition between the affected and unaffected portions of the Scene.';
if (!regionSource.includes(expectedEdgeFade)) fail('The Region Filter Edge Fade explanation is missing or stale.');
for (const phrase of ['fog, water, light', 'magical fields']) {
  if (regionSource.toLowerCase().includes(phrase)) fail(`The Region guide contains ambiguous Edge Fade example text: ${phrase}`);
}

const troubleshootingSource = read(path.join(docsRoot, 'reference/troubleshooting.md'));
for (const phrase of ['open the same Scene in a different browser', 'stale cached module code or assets', 'clear the browser cache or site data']) {
  if (!troubleshootingSource.includes(phrase)) fail(`Troubleshooting is missing browser-cache guidance: ${phrase}`);
}
for (const phrase of [
  'overhead Level behaviors;',
  'masking layers such as **Below Tokens**, **Below Tiles**, **Below Foreground**, suppression Regions, and other Region or tile restrictions;',
  'particle effect density;',
  'Windows display scale, browser display scale, Foundry version, System version',
  'if you may have removed a default rule or would like to reset them to their default state.',
  'deleted manually from <span class="fxm-control-label" data-control="api-effects">Manage API Effects</span>',
]) {
  if (!troubleshootingSource.includes(phrase)) fail(`Troubleshooting is missing requested guidance: ${phrase}`);
}
for (const phrase of [
  '## A custom asset cannot be browsed',
  'full-scene transparency and compositing',
  'several high-opacity effect layers',
  'GPU, projection mode',
]) {
  if (troubleshootingSource.includes(phrase)) fail(`Troubleshooting still contains removed wording: ${phrase}`);
}
const performanceSection = troubleshootingSource.match(/## Performance drops([\s\S]*?)(?=\n## |$)/)?.[1] ?? '';
const performanceOrder = [
  'overhead Level behaviors;',
  'masking layers such as',
  'particle effect density;',
];
let performanceIndex = -1;
for (const phrase of performanceOrder) {
  const nextIndex = performanceSection.indexOf(phrase);
  if (nextIndex <= performanceIndex) fail(`Troubleshooting Performance drops has the wrong order near: ${phrase}`);
  performanceIndex = nextIndex;
}

const faqSource = read(path.join(docsRoot, 'reference/faq.md'));
for (const heading of [
  '## Do players install FXMaster separately?',
  '## Can several effects follow Wind?',
  '## Does Sound Only create an invisible particle runtime?',
  '## Why does a parameter page show 0–1 when the source values are larger?',
  '## Can the wiki launch without a custom domain?',
  '## Can macros target an inactive Scene?',
  '## Do presets overwrite manually configured Scene effects?',
]) {
  if (faqSource.includes(heading)) fail(`FAQ still contains removed section: ${heading}`);
}
for (const phrase of [
  '## How do I activate FXMaster+?',
  '[Accessing FXMaster+](../../plus/access/)',
  '## Should both FXMaster and FXMaster+ be enabled in my world?',
  'Add a Region for the room dimensions and then add the effect with a Region behavior.',
  "FXMaster contains many conditionally visible parameters to make sure you're only seeing parameters relevant to the mode you're in.",
  "## Why don't I see the Animation Effects controls button?",
  'https://foundryvtt.com/packages/gambitsAssetPreviewer',
  "## I have an effect active that I can't get rid of. What should I do?",
  'FXMASTER.api.stopSceneEffects',
  "## I'd like to change how an FXMaster preset looks while using the Calendaria module",
  'https://wiki.3deathsaves.com/calendaria/weather-editor/',
]) {
  if (!faqSource.includes(phrase)) fail(`FAQ is missing requested guidance: ${phrase}`);
}
const firstFaqHeading = faqSource.match(/^## .+$/m)?.[0];
if (firstFaqHeading !== '## How do I activate FXMaster+?') fail('How do I activate FXMaster+? is not the first FAQ section.');

const retiredSoundManagerLabel = ['SoundFX', 'Manager'].join(' ');
for (const filePath of [...docFiles, path.join(root, 'src/components/FeatureMatrix.astro'), path.join(root, 'astro.config.mjs')]) {
  if (read(filePath).includes(retiredSoundManagerLabel)) fail(`${relative(filePath)} still uses the retired Sound Effects Manager label.`);
}

const automationOverviewSource = read(path.join(docsRoot, 'automation/index.md'));
for (const phrase of [
  'The easiest way to generate an FXMaster macro is to select',
  'data-control="save">Save Particle and Filter Effects as Macro</span>',
  '| Macro Name |',
  '| Macro Action |',
  '| Skip Fading |',
]) {
  if (!automationOverviewSource.includes(phrase)) fail(`Automation overview is missing macro-generation guidance: ${phrase}`);
}

if (troubleshootingSource.includes('Test at the scene size and zoom level used during play.')) {
  fail('Troubleshooting still contains the removed scene-size performance sentence.');
}

if (!faqSource.includes('[Calendaria Weather Wiki](https://wiki.3deathsaves.com/calendaria/weather-editor/)')) {
  fail('FAQ is missing the Calendaria Weather Wiki link text.');
}
if (faqSource.includes('Calendaria Weather Editor')) fail('FAQ still uses the retired Calendaria Weather Editor link text.');

const plusAccessPath = path.join(docsRoot, 'plus/access.mdx');
if (!fs.existsSync(plusAccessPath)) {
  fail('The Accessing FXMaster+ page is missing.');
} else {
  const plusAccessContent = read(plusAccessPath);
  for (const phrase of [
    'https://www.patreon.com/cw/GambitsLounge',
    'Queen of Hearts',
    'King of Diamonds',
    'Ace of Spades',
    'OMEGA LEVEL',
    'https://foundryvtt.com/me/edit',
    'https://foundryvtt.com/me/subscriptions',
    'Restart the Foundry server',
    'Gambit’s FXMaster+',
    'Gambit’s Asset Previewer',
    'Gambit’s Image Viewer',
    'Hosted service installation problems',
    'The Forge',
  ]) {
    if (!plusAccessContent.includes(phrase)) fail(`Accessing FXMaster+ is missing: ${phrase}`);
  }
}

const plusIndexContent = read(path.join(docsRoot, 'plus/index.mdx'));
if (!plusIndexContent.includes('./access/')) fail('The FXMaster+ overview does not link to Accessing FXMaster+.');
if (!plusIndexContent.includes('https://www.patreon.com/cw/GambitsLounge')) fail('The FXMaster+ overview does not link to Patreon.');
const expectedPlusOverview = 'FXMaster+ is an expansion module installed on top of FXMaster. It adds more particle effects, filter effects, and features, including custom user-selected particles and Sound Effect automation rules.';
if (!plusIndexContent.includes(expectedPlusOverview)) fail('The FXMaster+ overview is missing the requested introductory copy.');
for (const [moduleName, packageUrl] of [
  ['Gambit’s FXMaster+', 'https://foundryvtt.com/packages/fxmaster-plus'],
  ['Gambit’s Games', 'https://foundryvtt.com/packages/gambitsGames'],
  ['Gambit’s Asset Previewer', 'https://foundryvtt.com/packages/gambitsAssetPreviewer'],
  ['Gambit’s Image Viewer', 'https://foundryvtt.com/packages/gambitsImageViewer'],
]) {
  if (!plusIndexContent.includes(packageUrl) || !plusIndexContent.includes(`<strong>${moduleName}</strong>`)) fail(`The Patreon access card is missing the official ${moduleName} link.`);
}
for (const customBaseId of expectedCustomBaseParameters.keys()) {
  if (!plusIndexContent.includes(`/reference/effects/details/${customBaseId}/`)) fail(`The FXMaster+ overview does not link to ${customBaseId}.`);
}

const installationContent = read(path.join(docsRoot, 'getting-started/installation.mdx'));
if (!installationContent.includes('../../plus/access/')) fail('Installation does not link to Accessing FXMaster+.');

const compatibilitySource = read(path.join(docsRoot, 'reference/compatibility.md'));
const expectedCompatibility = 'FXMaster+ 1.1.11 supports Foundry VTT 13 and 14. FXMaster 8.3.2 or newer is required.';
if (!compatibilitySource.includes(expectedCompatibility)) fail('Compatibility is missing the direct FXMaster+ version requirement.');
const expectedLevelsCompatibility = "FXMaster supports Foundry's core Levels functionality in Foundry VTT V14. The Levels module used with Foundry VTT V13 is not supported.";
if (!compatibilitySource.includes(expectedLevelsCompatibility)) fail('Compatibility is missing the Foundry VTT 14 core Levels support note.');

const settingsPath = path.join(docsRoot, 'reference/settings.md');
if (!fs.existsSync(settingsPath)) fail('Settings must use reference/settings.md.');
if (fs.existsSync(path.join(docsRoot, 'reference/settings.mdx'))) fail('The retired reference/settings.mdx file is still present.');
const settingsSource = read(settingsPath);
const settingsMarkdownContentSource = read(path.join(root, 'src/components/MarkdownContent.astro'));
for (const marker of ['isSettingsPage', 'attachToHeadingId="configurable-settings"', 'fxmaster-module-settings.webp']) {
  if (!settingsMarkdownContentSource.includes(marker)) fail(`MarkdownContent is missing the Settings screenshot integration marker: ${marker}`);
}
for (const marker of [
  'isAutomationOverviewPage',
  'attachToHeadingId="generate-a-macro-from-the-scene-controls"',
  'save-effects-as-macro.webp',
  'isPresetApiPage',
  'attachToHeadingId="manage-api-created-effects"',
  'manage-api-effects.webp',
]) {
  if (!settingsMarkdownContentSource.includes(marker)) fail(`MarkdownContent is missing an Automation screenshot integration marker: ${marker}`);
}
for (const phrase of [
  '| Disable Grid Movement Highlighting | World | Off |',
  '## Grid movement highlighting',
  'Token movement, ruler paths, waypoints, and measurement remain available',
]) {
  if (!settingsSource.includes(phrase)) fail(`Settings is missing Disable Grid Movement Highlighting guidance: ${phrase}`);
}

const particleOverviewSource = read(path.join(docsRoot, 'particles/index.mdx'));
for (const phrase of [
  '## Foundry Scene weather effects',
  'right-click a Scene, select **Edit**',
  '**Weather Effects**',
  '**(FXMaster)**',
  'data-control="particle-effects">Particle Effects</span>',
  '**Particle Effects Management**',
  'without FXMaster customization',
]) {
  if (!particleOverviewSource.includes(phrase)) fail(`Particle Effects overview is missing Foundry Scene weather guidance: ${phrase}`);
}

const parameterGlossarySource = read(path.join(docsRoot, 'reference/parameters.mdx'));
if (parameterGlossarySource.includes('## Displayed ranges')) fail('Parameter Glossary still contains the removed internal-range section.');
const effectCatalogPageSource = read(path.join(docsRoot, 'reference/effects/index.mdx'));
for (const customBaseId of expectedCustomBaseParameters.keys()) {
  if (!effectCatalogPageSource.includes(`./details/${customBaseId}/`)) fail(`Effect Catalog does not link to custom particle base ${customBaseId}.`);
}

const sceneControlsSource = read(path.join(docsRoot, 'getting-started/scene-controls.mdx'));
const foundryControlLabels = new Map([
  ['effects', 'FXMaster Controls'],
  ['activation', 'FXMaster Tools Overview'],
  ['particle-effects', 'Particle Effects'],
  ['filters', 'Filter Effects'],
  ['layers', 'Manage Layers'],
  ['api-effects', 'Manage API Effects'],
  ['save', 'Save Particle and Filter Effects as Macro'],
  ['clearfx', 'Clear Scene Particle and Filter Effects (Right-click: Disable Region Effects)'],
  ['user-particles', 'Manage User Particle Effects'],
  ['soundfx-manager', 'Manage Sound Effects'],
]);
for (const [control, label] of foundryControlLabels) {
  const marker = `<span class="fxm-control-label" data-control="${control}">${label}</span>`;
  if (!sceneControlsSource.includes(marker)) fail(`Scene Controls is missing the Foundry control label and icon marker: ${label}`);
}
if (!sceneControlsSource.includes('Opens the module overview with descriptions and videos for common tasks.')) {
  fail('Scene Controls is missing the requested FXMaster Tools Overview description.');
}
if (!sceneControlsSource.includes('The controls can indicate that Scene, Region, API, or SoundFX content is active. A control highlight means that the related runtime has an active effect.')) {
  fail('Scene Controls is missing the revised active-effect indicator wording.');
}
if (sceneControlsSource.includes('active data; it does not necessarily mean that the management window is open')) {
  fail('Scene Controls still contains the removed runtime-data wording.');
}
if ((sceneControlsSource.match(/class="fxm-plus-only"/g) ?? []).length < 2) {
  fail('Scene Controls does not visually identify both FXMaster+ only tools.');
}


const canonicalControlPages = [
  path.join(docsRoot, 'getting-started/installation.mdx'),
  path.join(docsRoot, 'getting-started/quick-start.mdx'),
  path.join(docsRoot, 'getting-started/scene-controls.mdx'),
];
for (const controlPage of canonicalControlPages) {
  const source = read(controlPage);
  for (const shorthand of ['**Clear FX**', '**Save Macro**', '**API Effects**', '**Custom Particles**']) {
    if (source.includes(shorthand)) fail(`${relative(controlPage)} uses shorthand instead of the Foundry control name: ${shorthand}`);
  }
}

for (const filePath of docFiles) {
  const source = read(filePath);
  for (const shorthand of ['**FX Layers**', '**Clear FX**', '**Save Macro**', '**API Effects**', '**Custom Particles**']) {
    if (source.includes(shorthand)) fail(`${relative(filePath)} uses obsolete or abbreviated interface wording: ${shorthand}`);
  }
  if (/the effect manager/i.test(source)) fail(`${relative(filePath)} uses a generic effect-manager reference instead of Particle Effects or Filter Effects.`);
  if (/Scene-manager effects/i.test(source)) fail(`${relative(filePath)} uses the obsolete Scene-manager wording.`);
}
for (const phrase of [
  'Save Particle and Filter Effects as Macro',
  'Clear Scene Particle and Filter Effects (Right-click: Disable Region Effects)',
]) {
  if (!read(path.join(docsRoot, 'getting-started/quick-start.mdx')).includes(phrase)) {
    fail(`Quick Start is missing the full Foundry control name: ${phrase}`);
  }
}

for (const phrase of [
  '## Elevation Constraints',
  '| None |',
  '| Tokens POV |',
  '| Specific Tokens POV |',
  '**Token UUID**',
  '**Always Visible for GM**',
]) {
  if (!regionSource.includes(phrase)) fail(`Region Effects is missing the Foundry-facing field or option: ${phrase}`);
}
if (!regionSource.includes('<span class="fxm-plus-only">FXMaster+ only</span>')) {
  fail('Region Effects does not visually identify the FXMaster+ only sound-suppression behavior.');
}
for (const stalePhrase of [
  '## Region behavior visibility',
  'Viewer point-of-view based visibility',
  'Selected target-token based visibility',
  'GM-always-visible authoring behavior',
]) {
  if (regionSource.includes(stalePhrase)) fail(`Region Effects still contains generic visibility wording: ${stalePhrase}`);
}

const manageLayersSource = read(path.join(docsRoot, 'regions/manage-layers.mdx'));
for (const column of ['Order', 'Effect', 'Source', 'Owner', 'Level', 'Actions']) {
  if (!manageLayersSource.includes(`| ${column} |`)) fail(`Manage Layers is missing its ${column} column description.`);
}
for (const phrase of ['Move up', 'Move down', 'Reset order', 'API - Macro', 'API - Preset', 'All Levels']) {
  if (!manageLayersSource.includes(phrase)) fail(`Manage Layers is missing the Foundry-facing label or value: ${phrase}`);
}
for (const phrase of ['## Include Foundry Grid in FX Stack', '**Include Foundry Grid in FX Stack**', '**Foundry Grid** row', 'Grid highlights and controls remain above FXMaster', '**Disable Grid Movement Highlighting** world setting']) {
  if (!manageLayersSource.includes(phrase)) fail(`Manage Layers is missing the Foundry Grid stack setting guidance: ${phrase}`);
}
if (!manageLayersSource.includes('Disable the suspected row through')) fail('Manage Layers is missing the revised Disable suspected row wording.');
if (manageLayersSource.includes('Hide the suspected row through')) fail('Manage Layers still uses Hide instead of Disable for suspected rows.');
for (const phrase of ['## Masking and performance', '**Below Tokens**', '**Below Tiles**', '**Below Foreground**', 'suppression Regions', 'added performance cost']) {
  if (!manageLayersSource.includes(phrase)) fail(`Manage Layers is missing masking performance guidance: ${phrase}`);
}
const manageLayersColumnsSection = manageLayersSource.split('## Columns\n')[1]?.split('\n## ')[0] ?? '';
const manageLayersReorderingSection = manageLayersSource.split('## Reordering\n')[1]?.split('\n## ')[0] ?? '';
const foundryGridCaption = 'Manage Layers shows the current FXMaster stack order and provides Move up and Move down actions for each row. When Include Foundry Grid in FX Stack is enabled, Foundry Grid appears as its own row and can be reordered like the other FXMaster rows.';
if (!manageLayersColumnsSection.includes("src: '/images/screenshots/manage-layers.webp'")) fail('The Manage Layers Columns section is missing the Layer rows screenshot.');
if (manageLayersColumnsSection.includes('manage-layers-grid-highlight.webp')) fail('The Foundry Grid highlighted screenshot must not remain attached to the Columns section.');
if (!manageLayersColumnsSection.includes(foundryGridCaption)) fail('The Layer rows screenshot is missing the Foundry Grid caption text.');
const reorderingScreenshotPosition = manageLayersReorderingSection.indexOf('manage-layers-grid-highlight.webp');
const reorderingInstructionsPosition = manageLayersReorderingSection.indexOf('Use **Move up**');
if (reorderingScreenshotPosition < 0) fail('The Reordering section is missing the Foundry Grid highlighted screenshot.');
if (reorderingInstructionsPosition < 0 || reorderingScreenshotPosition > reorderingInstructionsPosition) {
  fail('The Foundry Grid highlighted screenshot must appear before the Reordering instructions.');
}
const layersOrderingPerformanceSource = read(path.join(docsRoot, 'concepts/layers-and-ordering.mdx'));
for (const phrase of ['## Masking and performance', '**Below Tokens**', '**Below Tiles**', '**Below Foreground**', 'suppression Regions', 'added performance cost']) {
  if (!layersOrderingPerformanceSource.includes(phrase)) fail(`Layers and Ordering is missing masking performance guidance: ${phrase}`);
}

const sidebarConfigSource = read(path.join(root, 'astro.config.mjs'));
const fxmasterPlusSidebar = sidebarConfigSource.slice(sidebarConfigSource.indexOf("label: 'FXMaster+'"), sidebarConfigSource.indexOf("label: 'Presets'"));
const soundFxSidebarPosition = fxmasterPlusSidebar.indexOf('label: soundEffectsManagerLabel');
const customParticlesSidebarPosition = fxmasterPlusSidebar.indexOf("label: 'Custom Particle Effects'");
if (soundFxSidebarPosition < 0 || customParticlesSidebarPosition < 0 || soundFxSidebarPosition > customParticlesSidebarPosition) {
  fail('Sound Effects Manager must appear before Custom Particle Effects in the FXMaster+ sidebar.');
}
if (!sidebarConfigSource.includes("const soundEffectsManagerLabel = 'Sound Effects Manager';")) fail('The sidebar does not define the Sound Effects Manager label explicitly.');
if (!read(path.join(docsRoot, 'plus/soundfx.mdx')).includes('title: Sound Effects Manager')) fail('The Sound Effects Manager page title is incorrect.');
if (!fxmasterPlusSidebar.includes("label: 'Water Module Settings'")) fail('The FXMaster+ sidebar is missing Water Module Settings.');
for (const removedLabel of ["label: 'Manual Placement'", "label: 'Sound Only Effects'", "label: 'Water Options'"]) {
  if (fxmasterPlusSidebar.includes(removedLabel)) fail(`The FXMaster+ sidebar still contains removed item ${removedLabel}.`);
}

const manualPlacementSource = read(path.join(docsRoot, 'reference/effects/details/custom-manual-placement.mdx'));
for (const phrase of ['data-control="particle-effects">Particle Effects</span>', '**Manual Placement**', '**Place**', '**Delete**', '**Clear**']) {
  if (!manualPlacementSource.includes(phrase)) fail(`Manual Placement custom-base page is missing the Foundry-facing control: ${phrase}`);
}
for (const invalidControl of ['**Undo**', '**Save**']) {
  if (manualPlacementSource.includes(invalidControl)) fail(`Manual Placement custom-base page incorrectly lists unavailable control ${invalidControl}.`);
}
const fireParticleSource = read(path.join(docsRoot, 'reference/effects/details/fireparticles.mdx'));
for (const phrase of ['**Place**', '**Delete**', '**Clear**', 'via a Foundry light source']) {
  if (!fireParticleSource.includes(phrase)) fail(`Fire particle page is missing reviewed Manual Placement guidance: ${phrase}`);
}
for (const invalidControl of ['**Undo**', '**Save**']) {
  if (fireParticleSource.includes(invalidControl)) fail(`Fire particle page incorrectly lists unavailable control ${invalidControl}.`);
}
const ghostSource = read(path.join(docsRoot, 'reference/effects/details/ghosts.mdx'));
for (const phrase of ['**Place**', '**Undo**', '**Clear**']) {
  if (!ghostSource.includes(phrase)) fail(`Ghosts page is missing reviewed Manual Placement guidance: ${phrase}`);
}
for (const invalidControl of ['**Delete**', '**Save**']) {
  if (ghostSource.includes(invalidControl)) fail(`Ghosts page incorrectly lists unavailable control ${invalidControl}.`);
}
const soundOnlySource = read(path.join(docsRoot, 'reference/effects/details/custom-sound-only.mdx'));
for (const phrase of ['**Sound FX:**', '**Sound FX Sounds:**', 'does not create visible particles', 'SoundFX rule']) {
  if (!soundOnlySource.includes(phrase)) fail(`Sound Only custom-base page is missing required guidance: ${phrase}`);
}

const windPaintingSource = read(path.join(docsRoot, 'plus/wind-painting.mdx'));
for (const phrase of ['data-control="filters">Filter Effects</span>', '**FXMaster: Filter Effects**', '**Manual Painting**', '**Brush Radius (Grid Spaces)**', '**Painting**', '**Paint**', '**Erase**', '**Clear**']) {
  if (!windPaintingSource.includes(phrase)) fail(`Wind Painting is missing the Foundry-facing field or action: ${phrase}`);
}
if (windPaintingSource.includes('Enable **Manual Placement**')) fail('Wind Painting incorrectly refers to Manual Placement instead of Manual Painting.');

const customParticlesSource = read(path.join(docsRoot, 'plus/custom-particles.mdx'));
for (const phrase of ['data-control="user-particles">Manage User Particle Effects</span>', '**User Particle Effects**', '**Add Effect**', '| Custom Particle Name |', '| Base Effect |', '| Group |', '| Textures |', '| Icon |']) {
  if (!customParticlesSource.includes(phrase)) fail(`Custom Particle Effects is missing the Foundry-facing field or action: ${phrase}`);
}
for (const customBaseId of expectedCustomBaseParameters.keys()) {
  if (!customParticlesSource.includes(`/reference/effects/details/${customBaseId}/`)) fail(`Custom Particle Effects does not link to ${customBaseId}.`);
}
if (/spritesheets?/i.test(customParticlesSource)) fail('Custom Particle Effects still claims that users can create effects from spritesheets.');
if (!customParticlesSource.includes('After saving a revised definition, refresh the world')) {
  fail('Custom Particle Effects does not instruct users to refresh the world after revising a definition.');
}
for (const stalePhrase of ['refresh any open **User Particle Effects**', '**Particle Effects Management**, or Region behavior windows']) {
  if (customParticlesSource.includes(stalePhrase)) fail(`Custom Particle Effects still contains stale window-refresh guidance: ${stalePhrase}`);
}

const soundFxSource = read(path.join(docsRoot, 'plus/soundfx.mdx'));
for (const phrase of [
  'sounds produced by tokens moving through an active effect area.',
  'Select the **Effects** dropdown and choose one or more particle and filter effects.',
  '**AND** conditions, not **OR** alternatives',
  'more specific rule',
  '**Play within Region bounds**',
  '**Region Radius**',
  '**Sound FX**',
  'Scene and Region effect rows',
  '| Enable easing |',
  '| Enable muffling |',
  '| Muffled Effect |',
  '| Muffled Effect Intensity |',
]) {
  if (!soundFxSource.includes(phrase)) fail(`Sound Effects Manager is missing requested rule or suppression guidance: ${phrase}`);
}
for (const phrase of ['operating-system paths', 'operating system paths', 'module-relative or world-accessible asset paths', 'Local paths such as `C:\\...`']) {
  for (const filePath of docFiles) {
    if (read(filePath).includes(phrase)) fail(`${relative(filePath)} contains removed local-operating-system path guidance: ${phrase}`);
  }
}

const waterSettingsSource = read(path.join(docsRoot, 'plus/water-module-settings.mdx'));
for (const phrase of [
  '**Configure Settings → Module Settings**',
  '**Water Options**',
  '**Gambit’s FXMaster+**',
  '**Configure**',
  '**Save**',
  'lighter shader and load more quickly',
  '| Follow Region Path |',
  '| Caustics |',
  '| Waves |',
  '| Vortex |',
  '| Token Trails |',
  '| Heavy |',
  '| Medium-heavy |',
  '| Medium |',
  '| Low |',
]) {
  if (!waterSettingsSource.includes(phrase)) fail(`Water Module Settings is missing the Foundry-facing setting, impact, or explanation: ${phrase}`);
}
if (waterSettingsSource.includes('Token Trails default to disabled')) fail('Water Module Settings still contains the removed Token Trails default explanation.');

const presetApiSource = read(path.join(docsRoot, 'automation/preset-api.md'));
for (const phrase of [
  '## Manage API-created effects',
  '**API - Preset**',
  'Manage API Effects',
]) {
  if (!presetApiSource.includes(phrase)) fail(`Preset API is missing Manage API-created effects guidance: ${phrase}`);
}

const effectApiSource = read(path.join(docsRoot, 'automation/effect-api.mdx'));
for (const phrase of [
  "Leave `options` out entirely, or omit individual options, to use the effect's default values for anything not supplied.",
  'Set `skipFading: true` for an immediate effect on or effect off transition. This option will completely skip the default fade in/fade out time for an effect:',
]) {
  if (!effectApiSource.includes(phrase)) fail(`Direct Effect API is missing requested guidance: ${phrase}`);
}
if (effectApiSource.includes('Use immediate transitions sparingly')) fail('Direct Effect API still contains the removed immediate-transition recommendation.');

const hooksSource = read(path.join(docsRoot, 'automation/hooks.md'));
for (const removedPhrase of [
  '## Effect registration hooks',
  'fxmaster.preRegisterParticleEffects',
  'fxmaster.preRegisterFilterEffects',
  '## Why direct flag writes are fragile',
  '## Synchronized direction',
]) {
  if (hooksSource.includes(removedPhrase)) fail(`Hooks and Integrations still contains removed documentation: ${removedPhrase}`);
}
for (const requiredPhrase of ['## Availability checks', '## Preset list methods', 'FXMASTER.api.presets.list()', 'FXMASTER.api.presets.listValid()', 'FXMASTER.api.presets.listActive()', '## SoundFX state hooks']) {
  if (!hooksSource.includes(requiredPhrase)) fail(`Hooks and Integrations is missing retained guidance: ${requiredPhrase}`);
}

const presetsOverviewSource = read(path.join(docsRoot, 'presets/index.md'));
const expectedCalendariaCopy = "Calendaria](https://wiki.3deathsaves.com/calendaria/) uses the FXMaster Presets API to activate named FXMaster presets for its Weather system. It's a practical (and impressive) example of a module using the presets API directly instead of manually building FXMaster effects from scratch.";
if (!presetsOverviewSource.includes(expectedCalendariaCopy)) fail('Using Presets is missing the requested Calendaria integration description.');

const featureMatrixSource = read(path.join(root, 'src/components/FeatureMatrix.astro'));
for (const phrase of ['Custom Particle Effects', 'Sound Effects Manager']) {
  if (!featureMatrixSource.includes(phrase)) fail(`FeatureMatrix is missing: ${phrase}`);
}
if (!featureMatrixSource.includes('<tr><td>Preset and direct-effect APIs</td><td><span class="yes">Included</span></td><td><span class="yes">Expanded</span></td></tr>')) {
  fail('FeatureMatrix does not identify FXMaster+ Preset and direct-effect APIs as Expanded.');
}
for (const phrase of ['Custom particle definitions', 'Manual flame, ghost, and custom-particle placement', 'Wind painting and Water feature gates']) {
  if (featureMatrixSource.includes(phrase)) fail(`FeatureMatrix still contains removed comparison copy: ${phrase}`);
}
for (const phrase of ['Additional particle and filter effects', 'FXMaster+ effects available']) {
  if (featureMatrixSource.includes(phrase)) fail(`FeatureMatrix still contains removed or replaced comparison copy: ${phrase}`);
}

const particlesAndFiltersSource = read(path.join(docsRoot, 'concepts/particles-and-filters.mdx'));
for (const phrase of [
  'Avoid using multiple high-strength full-scene filters without testing the final stack.',
  'The same effect type may appear more than once with different options, positions, or Region scopes.',
]) {
  if (particlesAndFiltersSource.includes(phrase)) fail(`Particles and Filters still contains removed copy: ${phrase}`);
}

const topDownSource = read(path.join(docsRoot, 'concepts/top-down-and-backgrounds.mdx'));
if (!topDownSource.includes('Background** creates a persistent material or surface across the map.')) {
  fail('Top-Down and Backgrounds is missing the revised Background description.');
}
if (topDownSource.includes('persistent material or wet surface')) fail('Top-Down and Backgrounds still describes Background as a wet surface.');
for (const phrase of [
  '[Rain](../../reference/effects/details/rain/), [Hail](../../reference/effects/details/hail/), [Snow](../../reference/effects/details/snow/), [Snowstorm](../../reference/effects/details/snowstorm/), [Embers](../../reference/effects/details/embers/), and related effects expose overhead behavior.',
  'Token interaction parameters allow moving tokens to disturb a persistent background surface.',
  'Background surfaces add persistent state and interaction work. Enable only the features needed for a given scene.',
  '**Disable Grid Movement Highlighting** under **Configure Settings → Module Settings**',
]) {
  if (!topDownSource.includes(phrase)) fail(`Top-Down and Backgrounds is missing requested user-facing guidance: ${phrase}`);
}
for (const phrase of [
  'Top-down weather should retain a dead zone and camera-aware coverage',
  'Bubbles, Embers, Sakura Bloom, leaves, and related effects expose overhead behavior',
]) {
  if (topDownSource.includes(phrase)) fail(`Top-Down and Backgrounds still contains removed implementation-facing copy: ${phrase}`);
}

const directionMovementSource = read(path.join(docsRoot, 'concepts/direction-and-movement.mdx'));
if (directionMovementSource.includes('Orbit and directional movement communicate different intent.')) {
  fail('Direction and Movement still contains the redundant Orbit/directional-movement guidance.');
}
for (const linkedEffect of [
  '[Wind](../../reference/effects/details/wind/)',
  '[Duststorm](../../reference/effects/details/duststorm/)',
  '[Clouds](../../reference/effects/details/clouds/)',
  '[Fog particles](../../reference/effects/details/fog/)',
  '[Fog filter](../../reference/effects/details/fog-filter/)',
  '[Rain](../../reference/effects/details/rain/)',
  '[Snow](../../reference/effects/details/snow/)',
  '[Autumn Leaves](../../reference/effects/details/autumnleaves/)',
  '[Summer Leaves](../../reference/effects/details/summerleaves/)',
  '[Embers](../../reference/effects/details/embers/)',
]) {
  if (!directionMovementSource.includes(linkedEffect)) fail(`Direction and Movement is missing an effect-reference link: ${linkedEffect}`);
}

const layersOrderingSource = read(path.join(docsRoot, 'concepts/layers-and-ordering.mdx'));
for (const phrase of [
  'Particle rows follow the same stack order.',
  '**[Rain](../../reference/effects/details/rain/) above [Fog](../../reference/effects/details/fog-filter/):**',
  '**[Fog](../../reference/effects/details/fog-filter/) above [Rain](../../reference/effects/details/rain/):**',
]) {
  if (!layersOrderingSource.includes(phrase)) fail(`Layers and Ordering is missing the particle stack example: ${phrase}`);
}

const ambientFoliageSource = read(path.join(docsRoot, 'particles/ambient-and-foliage.mdx'));
if (!ambientFoliageSource.includes('## Water')) fail('Ambient and Foliage is missing the requested Water header.');
for (const phrase of ['## Water and spectral ambience', 'Ghosts provide drifting spectral movement.']) {
  if (ambientFoliageSource.includes(phrase)) fail(`Ambient and Foliage still contains removed spectral wording: ${phrase}`);
}
for (const misplacedEffectLink of [
  '../reference/effects/details/fireparticles/',
  '../reference/effects/details/windwisps/',
  '../reference/effects/details/fish/',
  '../reference/effects/details/fireflies/',
]) {
  if (ambientFoliageSource.includes(misplacedEffectLink)) {
    fail(`Ambient and Foliage links to an effect assigned to another Particle Effects Management group: ${misplacedEffectLink}`);
  }
}
const animalEffectsSource = read(path.join(docsRoot, 'particles/creatures.mdx'));
for (const requiredAnimalLink of [
  '../../reference/effects/details/fireflies/',
  '../../reference/effects/details/fish/',
]) {
  if (!animalEffectsSource.includes(requiredAnimalLink)) fail(`Animal Effects is missing assigned effect link: ${requiredAnimalLink}`);
}
if (animalEffectsSource.includes('../../reference/effects/details/ghosts/')) {
  fail('Animal Effects incorrectly includes Ghosts, which is assigned to Ambient.');
}

for (const phrase of [
  '## Region-specific effect controls',
  'Every filter includes **Edge Fade %**',
  '**Follow Region Path** and **Path Influence**',
  '**Edge Fade %** is a shared Region behavior field rather than an individual effect parameter',
]) {
  if (!regionSource.includes(phrase)) fail(`Region Effects is missing the revised Region-specific control guidance: ${phrase}`);
}
const suppressionSource = read(path.join(docsRoot, 'regions/suppression.mdx'));
for (const phrase of [
  '### Optional elevation constraints and edge fade',
  '**Elevation Constraints**',
  '**Edge Fade %**',
  'These options apply to particle and filter suppression.',
  '**FXMaster: Suppress Scene Sounds**',
  '| Environmental Sounds |',
  '| Token Movement Sounds |',
  'Both sound-type controls are enabled by default',
  '| Enable easing |',
  '| Enable muffling |',
  '| Muffled Effect |',
  '| Muffled Effect Intensity |',
  '## FXMaster-specific tile restrictions',
]) {
  if (!suppressionSource.includes(phrase)) fail(`Suppression and Restrictions is missing requested guidance: ${phrase}`);
}
if (suppressionSource.includes('## Pipeline-specific tile restrictions')) {
  fail('Suppression and Restrictions still uses Pipeline-specific tile restrictions.');
}

const soundEffectsManagerSource = read(path.join(docsRoot, 'plus/soundfx.mdx'));
for (const phrase of [
  '**Environmental Sounds** and **Token Movement Sounds** are independent controls',
  'both are enabled by default',
  '| Environmental Sounds |',
  '| Token Movement Sounds |',
  'only Environmental or only Token Movement rules',
]) {
  if (!soundEffectsManagerSource.includes(phrase)) fail(`Sound Effects Manager is missing independent suppression controls: ${phrase}`);
}

const layerStackComponent = path.join(root, 'src/components/LayerStack.astro');
if (fs.existsSync(layerStackComponent)) fail('The obsolete LayerStack component still exists.');
for (const layerGuide of [
  path.join(docsRoot, 'concepts/layers-and-ordering.mdx'),
  path.join(docsRoot, 'regions/manage-layers.mdx'),
]) {
  const source = read(layerGuide);
  if (source.includes('LayerStack')) fail(`${relative(layerGuide)} still imports or renders the obsolete LayerStack component.`);
  if (/\bdrag(?:ging)? (?:a |the )?rows?\b/i.test(source)) fail(`${relative(layerGuide)} incorrectly describes Manage Layers as drag-and-drop.`);
  if (!source.includes('Move up') || !source.includes('Move down')) fail(`${relative(layerGuide)} does not explain the actual Manage Layers arrow controls.`);
}

const customCssSource = read(path.join(root, 'src/styles/custom.css'));
const presetCatalogSource = read(path.join(root, 'src/components/PresetCatalog.astro'));
if (presetCatalogSource.includes("'Standard'") || presetCatalogSource.includes('>Standard<')) {
  fail('PresetCatalog still renders a Standard pill.');
}
for (const marker of ['data-tiers=', 'preset.versions.map', 'version.hasTopDown', 'Includes Top Down', "version.tier === 'plus' ? (", "modulePackagePage('plus')", '>Free</span>']) {
  if (!presetCatalogSource.includes(marker)) fail(`PresetCatalog is missing grouped version behavior: ${marker}`);
}

const presetLayoutMarkers = [
  '.fxm-preset-grid',
  'align-items: stretch',
  'height: 100%',
  'align-self: stretch',
  'min-height: 3.15rem',
  'align-content: start',
  'margin-top: auto',
];
for (const marker of presetLayoutMarkers) {
  if (!customCssSource.includes(marker)) fail(`Custom CSS is missing the equal-height preset-card alignment behavior: ${marker}`);
}
const presetGridBlocks = [...customCssSource.matchAll(/\.fxm-preset-grid\s*\{([\s\S]*?)\}/g)].map((match) => match[1]);
const presetGridBlock = presetGridBlocks.at(-1) ?? '';
if (!/align-items\s*:\s*stretch/.test(presetGridBlock)) fail('Preset cards are not configured to stretch to a common row height.');
const presetCardBlocks = [...customCssSource.matchAll(/\.fxm-preset-card\s*\{([\s\S]*?)\}/g)].map((match) => match[1]);
const presetCardBlock = presetCardBlocks.at(-1) ?? '';
if (/height\s*:\s*fit-content/.test(presetCardBlock) || /align-self\s*:\s*start/.test(presetCardBlock)) {
  fail('Preset cards still opt out of equal-height grid rows.');
}
const presetVersionsBlock = customCssSource.match(/\.fxm-preset-versions\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (/\bflex\s*:\s*1\b/.test(presetVersionsBlock)) fail('Preset version content still stretches inside the card.');
if (!/align-content\s*:\s*start/.test(presetVersionsBlock)) fail('Preset version content is not kept compact at the top of the card.');
const presetCommandBlock = customCssSource.match(/\.fxm-preset-command\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (!/margin-top\s*:\s*auto/.test(presetCommandBlock)) fail('Preset API commands are not aligned at the bottom of equal-height cards.');
if (presetCatalogSource.includes('fxm-preset-card__heading') && /fxm-preset-card__heading[\s\S]{0,300}data-tier=/.test(presetCatalogSource)) {
  fail('PresetCatalog still places the Free or FXMaster+ identifier in the card heading.');
}

const environmentalFiltersSource = read(path.join(docsRoot, 'filters/environmental.mdx'));
if (environmentalFiltersSource.includes('several high-strength filters are stacked together')) {
  fail('Environmental Filters still contains the removed generic filter-stacking warning.');
}

const homeSource = read(path.join(docsRoot, 'index.mdx'));
const expectedHeroActions = [
  'link: /getting-started/installation/',
  'link: /reference/effects/',
];
for (const actionLink of expectedHeroActions) {
  if (!homeSource.includes(actionLink)) fail(`The home-page hero is missing its internal action link: ${actionLink}`);
}
const routeDataPath = path.join(root, 'src/routeData.ts');
if (!fs.existsSync(routeDataPath)) fail('The Starlight route-data middleware used to prefix hero actions with the configured base path is missing.');
else {
  const routeDataSource = read(routeDataPath);
  for (const marker of ['defineRouteMiddleware', 'import.meta.env.BASE_URL', 'entry.data.hero?.actions', 'action.link = applyBasePath(action.link)']) {
    if (!routeDataSource.includes(marker)) fail(`The route-data middleware is missing its hero-action base-path marker: ${marker}`);
  }
}
const heroAstroConfigSource = read(path.join(root, 'astro.config.mjs'));
if (!heroAstroConfigSource.includes("routeMiddleware: './src/routeData.ts'")) {
  fail('Starlight is not configured to load the hero-action route-data middleware.');
}
const popularEffectOrder = "ids={['fireparticles', 'water', 'fish', 'clouds', 'fog-filter', 'snowstorm', 'lightning', 'screenshake']}";
if (!homeSource.includes(popularEffectOrder)) fail('The home page popular effects are missing or out of order.');
if (!homeSource.includes('Add FXMaster+ features')) fail('The home page is missing the Add FXMaster+ features section.');
if (homeSource.includes('Add FXMaster+ systems')) fail('The home page still uses Add FXMaster+ systems.');
const expectedHomeIntroduction = 'FXMaster is a real-time visual effects module within Foundry that includes Scene or Region based particle and filter effects. FXMaster+ is an expansion module that is installed in addition to FXMaster with additional effects and features. Use these guides to set up effects, understand how they behave, see what each parameter changes on the canvas, and more!';
if (!homeSource.includes(expectedHomeIntroduction)) fail('The home page is missing the requested FXMaster introduction.');
if (homeSource.includes('A useful first macro')) fail('The home page still contains the removed introductory macro section.');
if (homeSource.includes('Use macros and the API')) fail('The home page still presents the API as a primary introductory card.');
if (!homeSource.includes('Browse presets')) fail('The home page does not replace the introductory API card with Preset Catalog guidance.');

for (const phrase of [
  "Search for **Gambit’s FXMaster** and install the package published by me, Gambit!",
  "Enable both **Gambit’s FXMaster** and **Gambit’s FXMaster+** in the same world.",
  'Reload when Foundry requests it.',
  'data-control="effects">FXMaster Controls</span>',
]) {
  if (!installationContent.includes(phrase)) fail(`Installation is missing requested wording or icon treatment: ${phrase}`);
}
if (installationContent.includes('Reload the world after changing either module.')) fail('Installation still contains the removed reload instruction.');
for (const staleName of ["Gambit's **FXMaster**", 'Gambit’s **FXMaster**', "Gambit's **FXMaster+**", 'Gambit’s **FXMaster+**']) {
  if (installationContent.includes(staleName)) fail(`Installation does not bold the complete module friendly name: ${staleName}`);
}
for (const friendlyName of ['**Gambit’s FXMaster**', '**Gambit’s FXMaster+**']) {
  if (!installationContent.includes(friendlyName)) fail(`Installation is missing the fully bolded module name: ${friendlyName}`);
}

const quickStartSource = read(path.join(docsRoot, 'getting-started/quick-start.mdx'));
for (const phrase of [
  'add one particle effect and one filter effect',
  'For an overhead battle map, consider starting with **Top Down** enabled when the effect supports it.',
  'arrange the active Scene effects from top to bottom',
  '## 5. Clear all effects',
  "Use left-click on <span class=\"fxm-control-label\" data-control=\"clearfx\">Clear Scene Particle and Filter Effects (Right-click: Disable Region Effects)</span> to clear the effects you've placed on the canvas after confirmation.",
  '| Layer order | [Rain](../../reference/effects/details/rain/) above both [Color](../../reference/effects/details/color/) and [Fog](../../reference/effects/details/fog-filter/) |',
  "After the main result looks correct, try enabling [Rain](../../reference/effects/details/rain/)'s **Background** and **Token Interaction** parameters, or a suppression Region to prevent the effect in a specific area.",
]) {
  if (!quickStartSource.includes(phrase)) fail(`Quick Start is missing requested copy: ${phrase}`);
}
for (const phrase of [
  'Use the [Preset API]',
  'await FXMASTER.api.stopSceneEffects',
  'await FXMASTER.api.stopRegionEffects',
  'Region definitions stay on the Scene',
  'Color above Fog, with Rain in its intended position',
]) {
  if (quickStartSource.includes(phrase)) fail(`Quick Start still contains removed advanced or vague copy: ${phrase}`);
}

const moduleLinksSource = read(path.join(root, 'src/data/module-links.mjs'));
for (const link of ['https://foundryvtt.com/packages/fxmaster/', 'https://foundryvtt.com/packages/fxmaster-plus']) {
  if (!moduleLinksSource.includes(link)) fail(`Module package link data is missing ${link}`);
}
const effectCatalogSource = read(path.join(root, 'src/components/EffectCatalog.astro'));
for (const marker of ['modulePackagePage(effect.package)', 'modulePackageName(effect.package)', 'class="fxm-badge"']) {
  if (!effectCatalogSource.includes(marker)) fail(`EffectCatalog does not provide clickable module badges: ${marker}`);
}
if (!fs.existsSync(path.join(root, 'THIRD_PARTY_NOTICES.md'))) fail('The Font Awesome icon attribution notice is missing.');
for (const marker of ["a[href='https://www.patreon.com/cw/GambitsLounge']", '.fxm-lounge-card', 'var(--fxm-pink-strong)']) {
  if (!customCssSource.includes(marker)) fail(`Custom CSS is missing Gambit’s Lounge Patreon styling: ${marker}`);
}
if (!customCssSource.includes('mask: var(--fxm-control-icon) center / contain no-repeat')) {
  fail('Control labels are not configured to render their embedded SVG icons.');
}
for (const [control, label] of foundryControlLabels) {
  const cssMarker = `.fxm-control-label[data-control='${control}'] { --fxm-control-icon: url("data:image/svg+xml,`;
  if (!customCssSource.includes(cssMarker)) fail(`Custom CSS is missing the Font Awesome icon mapping for ${label}.`);
}
for (const filePath of walk(root)) {
  if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) fail(`The project must not package font files: ${relative(filePath)}`);
}

const prohibitedPublicMetaCopy = [
  'Documentation snapshot',
  'This repository was generated from',
  'in that snapshot',
  'Treat this wiki as versioned documentation',
  'The supplied documentation snapshot',
  'current FXMaster and FXMaster+ documentation snapshot',
  'This wiki covers',
  'The wiki shows',
  'Every effect page uses',
  'Preset pages identify',
  'version documented here',
];
for (const filePath of docFiles) {
  const source = read(filePath);
  for (const phrase of prohibitedPublicMetaCopy) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) fail(`${relative(filePath)} contains detached documentation wording: ${phrase}`);
  }
}

const prohibitedWikiCopy = [
  'Do not publish the protected package',
  'A public wiki repository should contain',
  'subscriber-only assets',
  'protected JavaScript',
  'manifest credentials',
];
for (const filePath of [...docFiles, path.join(root, 'README.md'), path.join(root, 'CONTRIBUTING.md')]) {
  if (!fs.existsSync(filePath)) continue;
  const source = read(filePath);
  for (const phrase of prohibitedWikiCopy) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) fail(`${relative(filePath)} contains removed repository-warning copy: ${phrase}`);
  }
}

const misleadingBackgroundLayerCopy = [
  'Foliage effects can use airborne particles, a persistent background surface, or both.',
  'Autumn Leaves can use airborne leaves, a persistent ground surface, or both.',
  'The two layers are configured independently.',
  'Airborne particles and the background leaf surface can be enabled independently.',
  'The airborne snow layer remains independent from persistent ground coverage.',
  'Airborne blossoms and persistent background accumulation can be enabled and tuned independently.',
  'The airborne particles and persistent sand background can be configured independently.',
  'Background adds a persistent wet surface independently from the airborne rain.',
  'Summer Leaves uses the same independent airborne and background systems',
];
for (const filePath of [...docFiles, path.join(root, 'scripts/generate-effect-pages.mjs')]) {
  const source = read(filePath);
  for (const phrase of misleadingBackgroundLayerCopy) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) {
      fail(`${relative(filePath)} implies that a background can run independently of its parent effect: ${phrase}`);
    }
  }
}

const backgroundRelationshipRequirements = new Map([
  ['autumnleaves', '**Background** is not a standalone effect; disabling Autumn Leaves disables both layers.'],
  ['summerleaves', '**Background** is not standalone; disabling Summer Leaves disables both layers.'],
  ['sakurabloom', 'Disabling Sakura Bloom disables both layers.'],
  ['sakurablossoms', '**Background** is not standalone; disabling Sakura Blossoms disables both layers.'],
  ['rain', 'Disabling Rain disables the Background as well.'],
  ['snow', 'disabling Snow disables both layers.'],
  ['snowstorm', 'Disabling Snowstorm disables all of them.'],
  ['sandstorm', 'Disabling Sandstorm disables both.'],
  ['duststorm', 'Disabling Duststorm disables both.'],
  ['custom-directional-drift', 'It is not a standalone effect; disabling the custom effect disables both layers.'],
  ['custom-ambient-float', 'It is not a standalone effect; disabling the custom effect disables both layers.'],
]);
const backgroundConceptPath = path.join(docsRoot, 'concepts/top-down-and-backgrounds.mdx');
if (!read(backgroundConceptPath).includes('**Background** is an optional layer of its parent effect, not a standalone effect.')) {
  fail('Top-Down and Backgrounds is missing the parent-effect Background clarification.');
}

for (const [effectId, phrase] of backgroundRelationshipRequirements) {
  const pagePath = path.join(docsRoot, 'reference/effects/details', `${effectId}.mdx`);
  if (!read(pagePath).includes(phrase)) fail(`Detail page ${effectId} is missing the parent-effect background clarification.`);
}

for (const marker of [
  '.sl-heading-wrapper.level-h2',
  '.sl-heading-wrapper.level-h3',
  '.sl-heading-wrapper.level-h4',
  'linear-gradient(90deg, rgba(147, 128, 255, 0.18), rgba(80, 215, 255, 0.06))',
  '.fxm-plus-only',
]) {
  if (!customCssSource.includes(marker)) fail(`Custom CSS is missing the rendered heading/sidebar selector: ${marker}`);
}
if (!/\.sl-markdown-content th\s*\{[\s\S]*?white-space:\s*nowrap;[\s\S]*?\}/.test(customCssSource)) {
  fail('Markdown table headers are not configured to remain on one line.');
}
if (!/\.sl-markdown-content :is\(ul, ol\):not\(:where\(\.not-content \*\)\)\s*\{[\s\S]*?margin-block:\s*1rem;[\s\S]*?\}/.test(customCssSource)) {
  fail('Top-level documentation lists do not use balanced spacing above and below.');
}
for (const marker of [
  '.sl-markdown-content .sl-heading-wrapper:not(:where(.not-content *)) > .sl-anchor-link',
  'margin-inline-start: auto;',
  ".fxm-screenshot-preview[data-fxm-attach-heading='true']",
  '.fxm-screenshot-preview[hidden]',
]) {
  if (!customCssSource.includes(marker)) fail(`Custom CSS is missing heading-link or screenshot-flow behavior: ${marker}`);
}
for (const obsoleteSelector of ['.sl-markdown-content > h2', '.sl-markdown-content > h3', '.sl-markdown-content > h4']) {
  if (customCssSource.includes(obsoleteSelector)) fail(`Custom CSS still uses a heading selector that cannot reach Starlight heading wrappers: ${obsoleteSelector}`);
}

const markdownContentPath = path.join(root, 'src/components/MarkdownContent.astro');
if (!fs.existsSync(markdownContentPath)) fail('The MarkdownContent override used to group subsection content is missing.');
const markdownContentSource = read(markdownContentPath);
for (const marker of [
  "@astrojs/starlight/components/MarkdownContent.astro",
  'fxm-subsection-group',
  'sectionBoundarySelector',
  "setAttribute('aria-labelledby'",
  "document.addEventListener('astro:page-load'",
  'initializeExternalLinks',
  "link.target = '_blank'",
  "relationship.add('noopener')",
  "relationship.add('noreferrer')",
]) {
  if (!markdownContentSource.includes(marker)) fail(`MarkdownContent.astro is missing subsection grouping behavior: ${marker}`);
}
const astroConfigSource = read(path.join(root, 'astro.config.mjs'));
if (!astroConfigSource.includes("MarkdownContent: './src/components/MarkdownContent.astro'")) {
  fail('Starlight is not configured to use the MarkdownContent subsection-grouping override.');
}
for (const marker of [
  '.fxm-subsection-group',
  'padding-inline-start: calc(0.78rem + 3px)',
  'margin-inline-start: calc(-0.78rem - 3px)',
]) {
  if (!customCssSource.includes(marker)) fail(`Custom CSS is missing subsection content alignment behavior: ${marker}`);
}

const parameterTableSource = read(path.join(root, 'src/components/ParameterTable.astro'));
if (!parameterTableSource.includes("effect.referenceType === 'custom-base'")) {
  fail('ParameterTable does not distinguish generated custom-effect IDs from fixed API effect types.');
}
for (const marker of [
  'data-fxm-description',
  'data-fxm-default',
  'data-fxm-range',
  'data-fxm-availability',
  'aria-haspopup="dialog"',
  "button.addEventListener('pointerenter'",
  "button.addEventListener('click'",
  'parameterLabel(parameterId)',
  'formatConditionValue',
  'data-fxm-condition-targets',
  'data-fxm-parameter-key',
  'data-fxm-condition-highlight',
  'initializeConditionHighlights',
  'formatDefault(parameter)',
  "effectId === 'fish' && parameter.id === 'fishType'",
  "parameter.id === 'levels'",
  "parameter.id === 'soundFxManualSoundIds'",
  "effectId === 'custom-manual-placement' && parameter.id === 'spritesheets'",
]) {
  if (!parameterTableSource.includes(marker)) fail(`ParameterTable.astro is missing interactive help marker: ${marker}`);
}

const screenshotComponentPath = path.join(root, 'src/components/ScreenshotPreview.astro');
if (!fs.existsSync(screenshotComponentPath)) {
  fail('ScreenshotPreview.astro is missing.');
} else {
  const screenshotComponentSource = read(screenshotComponentPath);
  for (const marker of [
    'data-fxm-screenshot-preview',
    'data-fxm-preview-trigger',
    'data-fxm-preview-panel',
    'data-fxm-preview-variant',
    'loading="lazy"',
    'aria-haspopup="dialog"',
    "variant?: 'default' | 'wide' | 'tall'",
    "label = 'Screenshot'",
    'initializeScreenshotPreviews',
    "document.addEventListener('astro:page-load'",
    "window.matchMedia('(hover: hover) and (pointer: fine)')",
    "document.addEventListener('astro:before-swap'",
    "event.key !== 'Escape'",
    'restoringTriggerFocus',
    'hidden={attachToHeading}',
  ]) {
    if (!screenshotComponentSource.includes(marker)) fail(`ScreenshotPreview.astro is missing interaction marker: ${marker}`);
  }
}

const screenshotAssets = [
  'filter-effect-options.webp',
  'fxmaster-module-settings.webp',
  'filter-effects-management.webp',
  'filter-effects-region-management.webp',
  'manage-api-effects.webp',
  'manage-layers.webp',
  'save-effects-as-macro.webp',
  'particle-effect-options.webp',
  'particle-effects-management.webp',
  'particle-effects-region-management.webp',
  'region-document.webp',
];
for (const asset of screenshotAssets) {
  const assetPath = path.join(root, 'public/images/screenshots', asset);
  if (!fs.existsSync(assetPath)) {
    fail(`Screenshot asset is missing: ${asset}`);
  } else if (fs.statSync(assetPath).size === 0) {
    fail(`Screenshot asset is empty: ${asset}`);
  }
}

function readWebpDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a valid WebP container');
  }

  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (chunk === 'VP8L') {
    if (buffer[20] !== 0x2f) throw new Error('invalid VP8L signature');
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    return {
      width: 1 + (b1 | ((b2 & 0x3f) << 8)),
      height: 1 + (((b2 & 0xc0) >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10)),
    };
  }
  if (chunk === 'VP8 ') {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) throw new Error('invalid VP8 frame signature');
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  throw new Error(`unsupported WebP chunk ${chunk}`);
}

const screenshotDirectory = path.join(root, 'public/images/screenshots');
const screenshotDimensions = new Map();
if (fs.existsSync(screenshotDirectory)) {
  for (const entry of fs.readdirSync(screenshotDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (path.extname(entry.name).toLowerCase() !== '.webp') {
      fail(`Screenshot asset is not WebP: ${entry.name}`);
      continue;
    }
    const assetPath = path.join(screenshotDirectory, entry.name);
    try {
      screenshotDimensions.set(entry.name, readWebpDimensions(assetPath));
    } catch (error) {
      fail(`Screenshot asset does not contain valid WebP data: ${entry.name} (${error.message})`);
    }
  }
}

const screenshotPageChecks = new Map([
  ['particles/index.mdx', ['ScreenshotPreview', 'particle-effects-management.webp', 'particle-effect-options.webp']],
  ['filters/index.mdx', ['ScreenshotPreview', 'filter-effects-management.webp', 'filter-effect-options.webp']],
  ['regions/index.mdx', ['ScreenshotPreview', 'particle-effects-region-management.webp', 'filter-effects-region-management.webp', 'region-document.webp']],
  ['regions/manage-layers.mdx', ['ScreenshotPreview', 'manage-layers.webp']],
  ['automation/effect-api.mdx', ['ScreenshotPreview', 'manage-api-effects.webp']],
  ['plus/water-module-settings.mdx', ['ScreenshotPreview', 'water-options-setting-row.webp', 'water-options-modal.webp']],
]);
for (const [relativePath, requiredMarkers] of screenshotPageChecks) {
  const pagePath = path.join(docsRoot, relativePath);
  if (!fs.existsSync(pagePath)) {
    fail(`Screenshot documentation page is missing: ${relativePath}`);
    continue;
  }
  const pageSource = read(pagePath);
  for (const marker of requiredMarkers) {
    if (!pageSource.includes(marker)) fail(`${relativePath} is missing screenshot preview marker: ${marker}`);
  }
}


const screenshotReferenceFiles = [
  ...docFiles,
  ...walk(path.join(root, 'src/components')).filter((filePath) => filePath.endsWith('.astro')),
];
const screenshotReferencePattern = /src:\s*['"]\/images\/screenshots\/([^'"]+\.webp)['"][\s\S]{0,700}?width:\s*(\d+),[\s\S]{0,160}?height:\s*(\d+),/g;
for (const sourceFile of screenshotReferenceFiles) {
  const source = read(sourceFile);
  for (const match of source.matchAll(screenshotReferencePattern)) {
    const [, asset, widthText, heightText] = match;
    const dimensions = screenshotDimensions.get(asset);
    if (!dimensions) {
      fail(`${relative(sourceFile)} references missing or invalid screenshot asset ${asset}.`);
      continue;
    }
    const declaredWidth = Number(widthText);
    const declaredHeight = Number(heightText);
    if (dimensions.width !== declaredWidth || dimensions.height !== declaredHeight) {
      fail(`${relative(sourceFile)} declares ${asset} as ${declaredWidth}x${declaredHeight}; actual WebP dimensions are ${dimensions.width}x${dimensions.height}.`);
    }
  }
}

const expectedEffectShowcases = {
  auroraborealis: ['/videos/aurora-borealis.mp4', 'Preview shows Aurora Borealis being played in Horizon mode'],
  bubbles: ['/videos/bubbles.mp4', 'Preview shows Bubbles being played with Token Trails enabled'],
  duststorm: ['/videos/duststorm.mp4', 'Preview shows Duststorm and Sandstorm enabled together'],
  eagles: ['/videos/eagles.mp4', 'Preview shows Eagles with Shadow enabled'],
  fire: ['/videos/fire-filter.mp4', 'Preview shows Fire enabled'],
  fireflies: ['/videos/fireflies.mp4', 'Preview shows Fireflies enabled'],
  fireparticles: ['/videos/fire-particle.mp4', 'Preview shows Fire in Manual Placement mode with Light Source enabled'],
  fish: ['/videos/fish.mp4', 'Preview shows Fish and Underwater enabled together, Fish are limited to Betta Fish Type variants'],
  ghosts: ['/videos/ghosts.mp4', 'Preview shows Ghosts enabled, limited to the Cute variant'],
  glitch: ['/videos/glitch.mp4', 'Preview shows Glitch with both the Slice and Glyph parameters enabled'],
  ice: ['/videos/ice.mp4', 'Preview shows Ice enabled'],
  lightningbolts: ['/videos/lightning-bolts.mp4', 'Preview shows Lightning Bolts with the Horizontal Lightning Mode enabled'],
  magiccrystals: ['/videos/magic-crystals.mp4', 'Preview shows Magic Crystals with Orbit mode turned off'],
  rain: ['/videos/rain.mp4', 'Preview shows Rain in Top Down mode with Background and Token Trails enabled'],
  rats: ['/videos/rats.mp4', 'Preview shows Rats in Directional Movement mode with Directional Spread enabled'],
  sakurabloom: ['/videos/sakura-bloom.mp4', 'Preview shows Sakura Bloom enabled for a Region'],
  sakurablossoms: ['/videos/sakura-blossoms.mp4', 'Preview shows Sakura Bloom enabled with Background and Token Trails enabled'],
  sandstorm: ['/videos/sandstorm.mp4', 'Preview shows Sandstorm and Duststorm enabled together'],
  screenshake: ['/videos/screen-shake.mp4', 'Preview shows Screen Shake with Timed mode disabled'],
  snowstorm: ['/videos/snowstorm.mp4', 'Preview shows Snowstorm in Top Down mode with Background and Sweeping Snow enabled'],
  summerleaves: ['/videos/summer-leaves.mp4', 'Preview shows Summer Leaves and Wind enabled together, with Directional Movement and Synchronized Direction enabled'],
  sunlight: ['/videos/sunlight.mp4', 'Preview shows Sunlight with Parallel mode disabled'],
  underwater: ['/videos/fish.mp4', 'Preview shows Underwater and Fish enabled together'],
  water: ['/videos/water.mp4', 'Preview shows Water enabled for a Region with Flowing Water and Follow Region Path enabled'],
  wind: ['/videos/wind.mp4', 'Preview shows Wind and Summer Leaves enabled together, with Wind in Manual Painting mode'],
  windwisps: ['/videos/wind-wisps.mp4', 'Preview shows Wind Wisps and Wind enabled together'],
};
for (const [effectId, [videoPath, description]] of Object.entries(expectedEffectShowcases)) {
  const pagePath = path.join(docsRoot, 'reference/effects/details', `${effectId}.mdx`);
  if (!fs.existsSync(pagePath)) {
    fail(`Missing effect showcase page: ${effectId}`);
    continue;
  }
  const page = read(pagePath);
  if (!page.includes(`src=${JSON.stringify(videoPath)}`)) fail(`${effectId} is missing its expected video ${videoPath}.`);
  if (!page.includes(`description=${JSON.stringify(description)}`)) fail(`${effectId} is missing its expected preview description.`);
  const videoFile = path.join(root, 'public', videoPath.replace(/^\//, ''));
  if (!fs.existsSync(videoFile)) fail(`${effectId} references missing video asset ${videoPath}.`);
}
if (fs.existsSync(path.join(root, 'public/videos/sakura-blossom.mp4'))) {
  fail('The retired sakura-blossom.mp4 asset is still present; Sakura Blossoms must use sakura-blossoms.mp4.');
}

const routeSet = new Set(routes.keys());
function verifyInternalLink(sourceFile, href) {
  const cleaned = href.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(cleaned) || cleaned.includes('{')) return;
  const withoutHash = cleaned.split('#')[0].split('?')[0];
  if (!withoutHash) return;
  const sourceRoute = routeFor(sourceFile);
  const resolved = new URL(withoutHash, `https://fxmaster.invalid${sourceRoute}`).pathname;
  if (/\.[a-z0-9]+$/i.test(resolved) && !/\.html?$/i.test(resolved)) {
    const publicAsset = path.join(root, 'public', resolved.replace(/^\//, ''));
    if (!fs.existsSync(publicAsset)) fail(`${relative(sourceFile)} links to missing asset ${cleaned}.`);
    return;
  }
  const target = normalizeRoute(resolved);
  if (!routeSet.has(target)) fail(`${relative(sourceFile)} links to missing documentation route ${cleaned} (${target}).`);
}

for (const filePath of docFiles) {
  const rawSource = read(filePath);
  rawSource.split(/\r?\n/).forEach((line, index) => {
    const screenshotString = line.match(/^\s*(?:src|alt|label|caption):\s*'(.*)',?\s*$/);
    if (!screenshotString) return;
    const value = screenshotString[1];
    for (let position = 0; position < value.length; position += 1) {
      if (value[position] !== "'" || value[position - 1] === '\\') continue;
      fail(`${relative(filePath)}:${index + 1} contains an unescaped apostrophe inside a single-quoted MDX expression.`);
      break;
    }
  });

  const source = rawSource
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, '');
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) verifyInternalLink(filePath, match[1]);
  for (const match of source.matchAll(/href=["']([^"']+)["']/g)) verifyInternalLink(filePath, match[1]);
  for (const match of source.matchAll(/link:\s*([^\s]+)/g)) verifyInternalLink(filePath, match[1]);
}

const config = read(path.join(root, 'astro.config.mjs'));
for (const removedRoute of [
  '/filters/water/',
  '/filters/wind/',
  '/filters/fire/',
  '/filters/aurora-borealis/',
  '/particles/rain/',
  '/particles/snow-and-snowstorm/',
  '/particles/leaves-and-backgrounds/',
  '/plus/manual-placement/',
  '/plus/sound-only/',
  '/plus/water-options/',
]) {
  if (config.includes(removedRoute)) fail(`astro.config.mjs still links to removed standalone effect route ${removedRoute}.`);
}
for (const match of config.matchAll(/\blink:\s*['"]([^'"]+)['"]/g)) {
  const target = normalizeRoute(match[1]);
  if (!routeSet.has(target)) fail(`astro.config.mjs links to missing documentation route ${match[1]}.`);
}

for (const filePath of walk(root)) {
  const rel = relative(filePath);
  if (rel.startsWith('node_modules/') || rel.startsWith('dist/')) continue;
}


const regionEffectsPage = read(path.join(docsRoot, 'regions/index.mdx'));
const availableRegionStart = regionEffectsPage.indexOf('## Available Region behaviors');
const addRegionStart = regionEffectsPage.indexOf('## Add a Region effect');
const configureRegionStart = regionEffectsPage.indexOf('### Configure the enabled effects');
if (availableRegionStart < 0 || addRegionStart < 0 || configureRegionStart < 0) {
  fail('Region Effects page is missing the expected screenshot sections.');
} else {
  const availableRegionSection = regionEffectsPage.slice(availableRegionStart, addRegionStart);
  const addRegionSection = regionEffectsPage.slice(addRegionStart, configureRegionStart);
  if (!availableRegionSection.includes('/images/screenshots/region-document.webp')) {
    fail('Available Region behaviors must use the Region document screenshot.');
  }
  if (availableRegionSection.includes('particle-effects-region-management.webp') || availableRegionSection.includes('filter-effects-region-management.webp')) {
    fail('Available Region behaviors must not use the particle/filter behavior screenshots.');
  }
  if (!addRegionSection.includes('particle-effects-region-management.webp') || !addRegionSection.includes('filter-effects-region-management.webp')) {
    fail('Add a Region effect must include the particle and filter Region behavior screenshots.');
  }
  if (addRegionSection.includes('/images/screenshots/region-document.webp')) {
    fail('Add a Region effect must not use the Region document screenshot.');
  }
}

const soundEffectsManagerPage = read(path.join(docsRoot, 'plus/soundfx.mdx'));
const environmentalStart = soundEffectsManagerPage.indexOf('### Environmental');
const tokenMovementStart = soundEffectsManagerPage.indexOf('### Token Movement');
const buildRuleStart = soundEffectsManagerPage.indexOf('## Build a rule');
const suppressionStart = soundEffectsManagerPage.indexOf('## Suppression');
const hooksStart = soundEffectsManagerPage.indexOf('## Hooks');
if (environmentalStart < 0 || tokenMovementStart < 0 || buildRuleStart < 0) {
  fail('Sound Effects Manager page is missing the expected Rule types subsections.');
} else {
  const environmentalSection = soundEffectsManagerPage.slice(environmentalStart, tokenMovementStart);
  const tokenMovementSection = soundEffectsManagerPage.slice(tokenMovementStart, buildRuleStart);
  if (!environmentalSection.includes('/images/screenshots/sound-rule-environmental.webp')) {
    fail('Environmental must include the Environmental sound-rule screenshot.');
  }
  if (!environmentalSection.includes('attachToHeadingId="environmental"')) {
    fail('Environmental screenshot must explicitly attach to the Environmental heading.');
  }
  if (environmentalSection.includes('/images/screenshots/sound-rule-tokenmovement.webp')) {
    fail('Environmental must not include the Token Movement sound-rule screenshot.');
  }
  if (!tokenMovementSection.includes('/images/screenshots/sound-rule-tokenmovement.webp')) {
    fail('Token Movement must include the Token Movement sound-rule screenshot.');
  }
  if (!tokenMovementSection.includes('attachToHeadingId="token-movement"')) {
    fail('Token Movement screenshot must explicitly attach to the Token Movement heading.');
  }
  if (tokenMovementSection.includes('/images/screenshots/sound-rule-environmental.webp')) {
    fail('Token Movement must not include the Environmental sound-rule screenshot.');
  }
}
if (suppressionStart < 0 || hooksStart < 0) {
  fail('Sound Effects Manager page is missing Suppression or Hooks.');
} else {
  const suppressionSection = soundEffectsManagerPage.slice(suppressionStart, hooksStart);
  if (!suppressionSection.includes('/images/screenshots/suppress-scene-sounds.webp')) {
    fail('Sound Effects Manager Suppression must include suppress-scene-sounds.webp.');
  }
  if (!suppressionSection.includes('attachToHeadingId="suppression"')) {
    fail('Suppression screenshot must explicitly attach to the Suppression heading.');
  }
}

if (warnings.length) {
  console.warn('FXMaster wiki validation warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error('FXMaster wiki validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${actualCounts.effects} effects (${actualCounts.coreParticles + actualCounts.plusParticles} particles, ` +
  `${actualCounts.coreFilters + actualCounts.plusFilters} filters), ${actualCounts.customParticleBases} custom particle bases, ` +
  `${actualCounts.presetFamilies} preset families, ${actualCounts.presetVariants} preset variants, ` +
  `${parameterCount + customBaseParameterCount} parameter descriptions, and ${routes.size} documentation routes.`,
);

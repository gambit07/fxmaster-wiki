import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getParameterDescription } from '../src/data/parameter-info.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultInput = path.resolve(scriptDirectory, '../src/data/reference.json');
const inputPath = path.resolve(process.argv[2] || defaultInput);

const normalizedRangeKeys = new Set([
  'branches',
  'density',
  'dimensions',
  'glyphSpeed',
  'glow',
  'height',
  'intensity',
  'lacunarity',
  'length',
  'lifetime',
  'noiseSize',
  'pathInfluence',
  'reflectionFresnel',
  'ribbonWidth',
  'scale',
  'scrollSpeed',
  'spin',
  'speed',
  'backgroundLeafSize',
  'backgroundParticleSize',
  'splashDensity',
  'splashScale',
  'wobbleFrequency',
]);
const normalizedRangeSuffixes = ['Intensity', 'Scale', 'Speed', 'Strength'];

const labels = {
  belowTokens: 'Below Tokens',
  belowTiles: 'Below Tiles',
  belowForeground: 'Below Foreground',
  levels: 'Levels',
  darknessActivationEnabled: 'Darkness Activation',
  darknessActivationRange: 'Darkness Activation Range',
  soundFxManualSoundIds: 'Sound FX Sounds',
  tokenAvoidanceDispositions: 'Token Dispositions',
  fadePercent: 'Edge Fade %',
};

const tooltips = {
  belowTokens: 'Renders effects underneath tokens visually.',
  belowTiles: 'Renders effects underneath overhead tiles visually.',
  belowForeground: 'Renders effects underneath foreground coverage visually.',
  levels: 'Limit this scene effect to selected scene levels. Leave All Levels selected to render everywhere.',
  darknessActivationEnabled: 'Only render the effect while scene darkness is within the configured range.',
  darknessActivationRange: 'Minimum and maximum scene darkness values where the effect remains active.',
  soundFxManualSoundIds: 'Choose which sounds are eligible when a matching manual SoundFX rule supplies multiple sounds.',
  tokenAvoidanceDispositions: 'Choose which token dispositions this effect should avoid.',
  fadePercent: 'Softens the edge of this filter inside a Region. A value of 0 creates a hard edge; higher values create a wider transition.',
};

const manualSoundAvailabilityDetail = 'the matching enabled SoundFX rule uses Multi-Sound Mode = Manual with at least two configured sounds';

const particleManagementGroups = {
  bats: 'creatures',
  birds: 'creatures',
  crows: 'creatures',
  eagles: 'creatures',
  rats: 'creatures',
  spiders: 'creatures',
  fireflies: 'creatures',
  fish: 'creatures',
  bubbles: 'ambient',
  embers: 'ambient',
  stars: 'ambient',
  autumnleaves: 'ambient',
  sakurabloom: 'ambient',
  sakurablossoms: 'ambient',
  summerleaves: 'ambient',
  ghosts: 'ambient',
  magiccrystals: 'ambient',
  clouds: 'weather',
  fog: 'weather',
  rain: 'weather',
  hail: 'weather',
  snow: 'weather',
  snowstorm: 'weather',
  fireparticles: 'weather',
  sandstorm: 'weather',
  windwisps: 'weather',
};

const summerLeafOptions = {
  'aspen-leaf': 'Aspen Leaf',
  'beech-leaf': 'Beech Leaf',
  'birch-leaf': 'Birch Leaf',
  'dandelion-fluff': 'Dandelion Fluff',
  'dogwood-petal': 'Dogwood Petal',
  'elm-leaf': 'Elm Leaf',
  'hackberry-leaf': 'Hackberry Leaf',
  'horse-chestnut-leaf': 'Horse Chestnut Leaf',
  'linden-leaf': 'Linden Leaf',
  'maple-leaf': 'Maple Leaf',
  'oak-leaf': 'Oak Leaf',
  'sweetgum-leaf': 'Sweetgum Leaf',
  'sycamore-leaf': 'Sycamore Leaf',
  'willow-leaf': 'Willow Leaf',
};
const summerTreeLeafIds = Object.keys(summerLeafOptions).filter((id) => !['dandelion-fluff', 'dogwood-petal'].includes(id));

const auroraPaletteOptions = {
  lakeside: 'Lakeside Aurora Borealis',
  northernGetaway: 'Northern Getaway',
  northernLights: 'Northern Lights',
  forestNorthernLights: 'Forest Northern Lights',
  phenomenalAurora: 'Phenomenal Aurora',
  aurora: 'Aurora',
  custom: 'Custom Colors',
};
const auroraDefaults = ['#01213a', '#01411f', '#005d55', '#08afa8', '#8aed07'];

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function conditionOperator(operator, value = undefined) {
  return value === undefined ? { operator } : { operator, value };
}

function patchConditionalVisibility(effect, parameter) {
  const hideOrbitOrTopDown = [{ orbit: true }, { topDown: true }];

  if (['embers', 'autumnleaves', 'summerleaves'].includes(effect.id) && ['directionalMovement', 'direction', 'synchronizedDirection'].includes(parameter.id)) {
    parameter.hideWhen = clone(hideOrbitOrTopDown);
  }
  if (['autumnleaves', 'summerleaves'].includes(effect.id) && ['spread', 'spawnMode'].includes(parameter.id)) {
    parameter.hideWhen = clone(hideOrbitOrTopDown);
  }
  if (['autumnleaves', 'summerleaves'].includes(effect.id) && parameter.id === 'direction') {
    parameter.showWhen = [{ directionalMovement: true }, { spawnMode: 'upwind' }];
  }

  if (effect.id === 'rain' && parameter.id === 'backgroundShimmerSpeed') {
    parameter.showWhen = {
      backgroundEnabled: true,
      backgroundShimmerStrength: conditionOperator('>', 0),
    };
  }

  if (effect.id === 'screenshake' && ['duration', 'decay'].includes(parameter.id)) {
    parameter.showWhen = [{ timed: true }, { audioAware: true }];
  }

  if (['duststorm', 'wind'].includes(effect.id) && ['directionRandomizationRadius', 'directionChangeTime'].includes(parameter.id)) {
    parameter.showWhen = { directionRandomization: conditionOperator('>', 0) };
  }

  if (effect.id === 'lightningbolts') {
    const horizontalModes = [
      { mode: conditionOperator('isEmpty') },
      { mode: conditionOperator('contains', 'horizontal') },
      { mode: conditionOperator('contains', 'mixed') },
    ];
    const topDownModes = [
      { mode: conditionOperator('contains', 'topDown') },
      { mode: conditionOperator('contains', 'mixed') },
    ];

    if (parameter.id === 'triggerChance') parameter.showWhen = [{ syncFlash: true }, { audioAware: true }];
    if (['topDownBoltsVariable', 'topDownScale', 'topDownBolts'].includes(parameter.id)) parameter.showWhen = clone(topDownModes);
    if (['thickness', 'directionalMovement'].includes(parameter.id)) parameter.showWhen = clone(horizontalModes);
    if (parameter.id === 'direction') {
      parameter.showWhen = [
        { mode: conditionOperator('isEmpty'), directionalMovement: true },
        { mode: conditionOperator('contains', 'horizontal'), directionalMovement: true },
        { mode: conditionOperator('contains', 'mixed'), directionalMovement: true },
      ];
    }
  }

  if (effect.id === 'water' && ['synchronizedDirection', 'turbulence'].includes(parameter.id)) {
    parameter.showWhen = [{ flow: true }, { waves: true }];
  }
  if (effect.id === 'water' && ['causticStrength', 'causticsTint'].includes(parameter.id)) {
    parameter.showWhen = { caustics: conditionOperator('>', 0) };
  }
}

function insertedParameter(id) {
  const common = { id, label: labels[id] };
  switch (id) {
    case 'belowTokens':
    case 'belowTiles':
    case 'belowForeground':
      return { ...common, type: 'checkbox', default: false, tooltip: tooltips[id] };
    case 'levels':
      return { ...common, type: 'scene-levels', default: [], tooltip: tooltips[id], sceneOnly: true };
    case 'darknessActivationEnabled':
      return { ...common, type: 'checkbox', default: false, tooltip: tooltips[id] };
    case 'darknessActivationRange':
      return {
        ...common,
        type: 'range-dual',
        default: { min: 0, max: 1 },
        min: 0,
        max: 1,
        step: 0.01,
        showWhen: { darknessActivationEnabled: true },
        tooltip: tooltips[id],
      };
    case 'soundFxManualSoundIds':
      return {
        ...common,
        type: 'multi-select',
        default: [],
        options: {},
        allowEmpty: true,
        showWhen: { soundFxEnabled: true },
        availabilityDetail: manualSoundAvailabilityDetail,
        tooltip: tooltips[id],
      };
    case 'fadePercent':
      return {
        ...common,
        type: 'range',
        default: 0,
        min: 0,
        max: 1,
        step: 0.01,
        regionOnly: true,
        tooltip: tooltips[id],
      };
    default:
      throw new Error(`Unknown inserted parameter ${id}`);
  }
}

function patchExpressionValues(effect, parameter, alreadyNormalized) {
  if (typeof parameter.label === 'string') {
    const fallback = parameter.label.match(/localizeKeyOrFallback\([^,]+,\s*["']([^"']+)["']\)/);
    if (fallback) parameter.label = fallback[1];
  }

  if (parameter.id === 'soundFxManualSoundIds') {
    parameter.availabilityDetail = manualSoundAvailabilityDetail;
  }

  if (effect.id === 'fireparticles' && parameter.id === 'placementActions') {
    parameter.tooltip = 'Controls for placing, deleting, or clearing manually placed flames on the current Scene.';
  }

  if (effect.id === 'water' && ['followRegionPath', 'pathInfluence'].includes(parameter.id)) {
    parameter.regionOnly = true;
    parameter.availabilityDetail = 'the Follow Region Path feature is enabled in Water Module Settings';
  }

  if (parameter.id === 'fadePercent') parameter.regionOnly = true;

  if (effect.package === 'plus' && effect.kind === 'particle' && effect.id === 'fireparticles' && parameter.id === 'glow') {
    if (alreadyNormalized) parameter.default = 0.5;
    else {
      parameter.default = 1;
      parameter.__desiredNormalizedDefault = 0.5;
    }
  }

  if (effect.package === 'plus' && effect.kind === 'filter' && effect.id === 'fire') {
    const desiredDefaults = {
      dimensions: 0.75,
      height: 0.8,
      speed: 0.15,
      intensity: 0.55,
      glow: 1,
    };
    if (Object.hasOwn(desiredDefaults, parameter.id)) {
      const desired = desiredDefaults[parameter.id];
      if (alreadyNormalized) parameter.default = desired;
      else {
        parameter.__desiredNormalizedDefault = desired;
        const min = Number(parameter.min);
        const max = Number(parameter.max);
        const uiMin = min > 0 ? (min < 0.01 ? 0.001 : min < 0.1 ? 0.01 : 0.1) : 0;
        const t = (desired - uiMin) / Math.max(1e-9, 1 - uiMin);
        parameter.default = min + Math.max(0, Math.min(1, t)) * (max - min);
      }
    }
  }

  if (effect.package === 'plus' && effect.kind === 'particle' && effect.id === 'summerleaves') {
    if (parameter.id === 'variants') {
      parameter.options = summerLeafOptions;
      parameter.default = summerTreeLeafIds;
    }
    if (parameter.id === 'scale') {
      parameter.default = 0.3;
      parameter.min = 0.1;
      parameter.max = 1;
      parameter.step = 0.01;
      parameter.__skipRangeNormalization = true;
    }
  }

  if (effect.package === 'plus' && effect.kind === 'filter' && effect.id === 'auroraborealis') {
    if (parameter.id === 'palette') parameter.options = auroraPaletteOptions;
    const colorIndex = Number(parameter.id.replace('color', ''));
    if (/^color[0-4]$/.test(parameter.id)) parameter.default = { value: auroraDefaults[colorIndex], apply: true };
  }

  patchConditionalVisibility(effect, parameter);
}

function shouldNormalizeRange(parameter) {
  if (parameter.__skipRangeNormalization) return false;
  if (parameter.type !== 'range') return false;
  const id = String(parameter.id);
  if (!normalizedRangeKeys.has(id) && !normalizedRangeSuffixes.some((suffix) => id.endsWith(suffix))) return false;
  const min = Number(parameter.min);
  const max = Number(parameter.max);
  const value = Number(parameter.default);
  return [min, max, value].every(Number.isFinite) && max > min && Math.abs(max - 1) > 1e-9;
}

function normalizeRange(parameter, alreadyNormalized) {
  if (alreadyNormalized) {
    delete parameter.__skipRangeNormalization;
    delete parameter.__desiredNormalizedDefault;
    return parameter;
  }
  if (!shouldNormalizeRange(parameter)) {
    delete parameter.__skipRangeNormalization;
    delete parameter.__desiredNormalizedDefault;
    return parameter;
  }

  const internalMin = Number(parameter.min);
  const internalMax = Number(parameter.max);
  const internalDefault = Number(parameter.default);
  const isGroundParticleSize = parameter.id === 'backgroundLeafSize' || parameter.id === 'backgroundParticleSize';
  const uiMin = isGroundParticleSize ? 0.01 : internalMin > 0 ? (internalMin < 0.01 ? 0.001 : internalMin < 0.1 ? 0.01 : 0.1) : 0;
  const uiMax = 1;
  const defaultValue = Number.isFinite(parameter.__desiredNormalizedDefault)
    ? Number(parameter.__desiredNormalizedDefault)
    : uiMin + ((internalDefault - internalMin) / (internalMax - internalMin)) * (uiMax - uiMin);

  parameter.internalRange = {
    min: internalMin,
    max: internalMax,
    default: internalDefault,
    step: parameter.step,
  };
  parameter.min = uiMin;
  parameter.max = uiMax;
  parameter.step = uiMin === 0.001 ? 0.001 : 0.01;
  parameter.default = Number(Math.max(uiMin, Math.min(uiMax, defaultValue)).toFixed(uiMin === 0.001 ? 3 : 2));
  delete parameter.__desiredNormalizedDefault;
  return parameter;
}

function addTokenDispositionParameter(parameters) {
  if (!parameters.has('tokenAvoidance') || parameters.has('tokenAvoidanceDispositions')) return;
  const avoidance = parameters.get('tokenAvoidance');
  parameters.set('tokenAvoidanceDispositions', {
    id: 'tokenAvoidanceDispositions',
    label: labels.tokenAvoidanceDispositions,
    type: 'multi-select',
    options: {
      friendly: 'Friendly',
      neutral: 'Neutral',
      hostile: 'Hostile',
      secret: 'Secret',
    },
    default: ['friendly', 'neutral', 'hostile', 'secret'],
    allowEmpty: false,
    showWhen: { tokenAvoidance: true },
    ...(avoidance?.hideWhen ? { hideWhen: clone(avoidance.hideWhen) } : {}),
    tooltip: tooltips.tokenAvoidanceDispositions,
  });
}

function normalizeParameters(effect, alreadyNormalized) {
  const entries = (effect.parameters || []).map((entry) => clone(entry));
  for (const parameter of entries) patchExpressionValues(effect, parameter, alreadyNormalized);

  const parameters = new Map(entries.map((entry) => [entry.id, normalizeRange(entry, alreadyNormalized)]));
  addTokenDispositionParameter(parameters);

  const leadingOrder = ['belowTokens', 'belowTiles', 'belowForeground', 'levels'];
  const trailingOrder = ['darknessActivationEnabled', 'darknessActivationRange'];
  for (const id of leadingOrder) if (!parameters.has(id)) parameters.set(id, insertedParameter(id));
  for (const id of trailingOrder) if (!parameters.has(id)) parameters.set(id, insertedParameter(id));

  const hasSoundFx = parameters.has('soundFxEnabled');
  if (hasSoundFx && !parameters.has('soundFxManualSoundIds')) parameters.set('soundFxManualSoundIds', insertedParameter('soundFxManualSoundIds'));
  if (effect.kind === 'filter' && !parameters.has('fadePercent')) parameters.set('fadePercent', insertedParameter('fadePercent'));

  const backgroundOrder = parameters.has('backgroundEnabled')
    ? ['backgroundEnabled', ...Array.from(parameters.keys()).filter((key) => key !== 'backgroundEnabled' && key.startsWith('background'))]
    : [];
  const soundOrder = hasSoundFx ? ['soundFxEnabled', 'soundFxManualSoundIds'] : [];
  const tokenTrailOrder = parameters.has('tokenTrailsEnabled')
    ? ['tokenTrailsEnabled', ...Array.from(parameters.keys()).filter((key) => key !== 'tokenTrailsEnabled' && key.startsWith('tokenTrail'))]
    : [];
  const tokenAvoidanceOrder = parameters.has('tokenAvoidance')
    ? ['tokenAvoidance', 'tokenAvoidanceDispositions', ...Array.from(parameters.keys()).filter((key) => !['tokenAvoidance', 'tokenAvoidanceDispositions'].includes(key) && key.startsWith('tokenAvoidance'))]
    : [];
  const burnOrder = parameters.has('burnTokens')
    ? ['burnTokens', ...Array.from(parameters.keys()).filter((key) => key !== 'burnTokens' && key.startsWith('burnToken'))]
    : [];
  const directionOrder = ['directionalMovement', 'direction', 'synchronizedDirection', 'spread', 'spawnMode'].filter((key) => parameters.has(key));
  const regionOnlyOrder = effect.kind === 'filter' ? ['fadePercent'] : [];
  const special = new Set([...leadingOrder, ...trailingOrder, ...backgroundOrder, ...soundOrder, ...tokenTrailOrder, ...tokenAvoidanceOrder, ...burnOrder, ...directionOrder, ...regionOnlyOrder]);
  const authoredOrder = entries.map((entry) => entry.id);
  const ordered = [];
  const pushed = new Set();
  const push = (id) => {
    if (pushed.has(id) || !parameters.has(id)) return;
    pushed.add(id);
    ordered.push(parameters.get(id));
  };

  leadingOrder.forEach(push);
  const hasTint = parameters.has('tint') || parameters.has('color');
  let soundInserted = false;
  let directionInserted = false;
  const pushSound = () => {
    if (soundInserted) return;
    soundInserted = true;
    soundOrder.forEach(push);
  };
  const pushDirection = () => {
    if (directionInserted) return;
    directionInserted = true;
    directionOrder.forEach(push);
  };

  for (const id of authoredOrder) {
    if (special.has(id)) continue;
    if (id === 'scale') pushDirection();
    const value = parameters.get(id);
    if (!hasTint && value?.type === 'checkbox') pushSound();
    push(id);
    if (id === 'tint' || id === 'color') pushSound();
  }
  pushSound();
  pushDirection();
  backgroundOrder.forEach(push);
  tokenTrailOrder.forEach(push);
  tokenAvoidanceOrder.forEach(push);
  burnOrder.forEach(push);
  trailingOrder.forEach(push);
  regionOnlyOrder.forEach(push);
  for (const id of parameters.keys()) push(id);

  return ordered;
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const alreadyNormalized = Number(data.referenceFormat) >= 2;
for (const effect of data.effects) {
  if (effect.kind === 'particle' && particleManagementGroups[effect.id]) effect.group = particleManagementGroups[effect.id];
  effect.parameters = normalizeParameters(effect, alreadyNormalized);
  effect.parameterCount = effect.parameters.length;
  delete effect.className;
  delete effect.source;
  delete effect.icon;
  for (const parameter of effect.parameters) {
    delete parameter.internalRange;
    delete parameter.__skipRangeNormalization;
    delete parameter.__desiredNormalizedDefault;
    parameter.description = getParameterDescription(effect, parameter);
  }
}
for (const base of data.customParticleBases ?? []) {
  base.parameterCount = base.parameters?.length ?? 0;
  for (const parameter of base.parameters ?? []) {
    if (parameter.id === 'soundFxManualSoundIds') parameter.availabilityDetail = manualSoundAvailabilityDetail;
    if (base.id === 'custom-manual-placement' && parameter.id === 'placementActions') {
      parameter.tooltip = 'Controls for placing, deleting, or clearing manually placed custom images on the current Scene.';
    }
    delete parameter.internalRange;
    delete parameter.__skipRangeNormalization;
    delete parameter.__desiredNormalizedDefault;
    parameter.description = getParameterDescription(base, parameter);
  }
}
data.referenceFormat = 3;
data.normalizedAt = new Date().toISOString();
fs.writeFileSync(inputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Normalized ${data.effects.length} effects and ${(data.customParticleBases ?? []).length} custom particle bases in ${inputPath}`);

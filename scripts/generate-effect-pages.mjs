import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { modulePackageName, modulePackagePage } from '../src/data/module-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'src/data/reference.json'), 'utf8'));
const outputDirectory = path.join(root, 'src/content/docs/reference/effects/details');
fs.mkdirSync(outputDirectory, { recursive: true });

const runtimeId = (effect) => effect.id === 'fog-filter' ? 'fog' : effect.id;
const tierLabel = (effect) => effect.package === 'plus' ? 'FXMaster+' : 'FXMaster';
const kindLabel = (effect) => effect.kind === 'particle' ? 'Particle effect' : 'Filter effect';
const duplicateLabels = new Set(reference.effects.map((effect) => effect.label).filter((label, index, labels) => labels.indexOf(label) !== index));
const displayEffectLabel = (effect) => effect.label;
const titleCase = (value) => String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const jsString = (value) => JSON.stringify(value, null, 2);

const groupContext = {
  creatures: 'Animal effects add moving subjects to a Scene without creating tokens. Scale and Density control the population, while the available movement controls determine how they travel around the map.',
  ambient: 'Ambient effects add visible movement without replacing the full weather setup. Use them on their own or layer them with another particle or filter.',
  foliage: 'Foliage effects can combine airborne particles with an optional persistent **Background** surface. The airborne and Background controls are configured separately within the same enabled effect; disabling the effect disables both. Background interaction controls determine how tokens disturb settled leaves or petals.',
  weather: 'Weather effects can cover a full Scene or be limited to Regions. Configure the placement or movement controls exposed by the effect first, then tune its appearance, population, and optional background controls.',
  visual: 'Visual filters change the rendered Scene. Check map, token, and text visibility after changing their strength or opacity.',
  environmental: 'Environmental filters change the Scene surface or atmosphere. They can cover the full Scene, be limited to Regions, and be moved within the effect stack.',
};

const groupDisplayLabel = (group) => group === 'creatures' ? 'Animals' : titleCase(group);

function groupContextFor(effect) {
  const context = effect.id === 'fireworks'
    ? 'Use Fireworks for a repeating display across a Scene or within a Region. Burst and Dragon modes have separate timing and shape controls.'
    : groupContext[effect.group] ?? '';
  if (effect.group !== 'creatures') return context;
  const regionContext = ' In a Region, Region Boundary Avoidance can keep the animals away from its outer edges and holes while Orbit is off.';
  const hasTokenAvoidance = effect.parameters.some((parameter) => parameter.id === 'tokenAvoidance');
  return hasTokenAvoidance
    ? `${context} This effect also includes Token Avoidance controls for steering around eligible tokens.${regionContext}`
    : `${context}${regionContext}`;
}

const effectShowcases = {
  fireworks: {
    src: '/videos/fireworks-dragon.mp4',
    description: 'Preview shows Fireworks in Dragon mode',
    mapName: "Tom Cartos",
    mapUrl: "https://www.tomcartos.com/",
  },
  auroraborealis: {
    src: '/videos/aurora-borealis.mp4',
    description: 'Preview shows Aurora Borealis being played in Horizon mode',
    mapName: 'Cze & Peku',
    mapUrl: 'https://www.czepeku.com/',
  },
  bubbles: {
    src: '/videos/bubbles.mp4',
    description: 'Preview shows Bubbles being played with Token Trails enabled',
    mapName: "Tom Cartos",
    mapUrl: "https://www.tomcartos.com/",
  },
  duststorm: {
    src: '/videos/duststorm.mp4',
    description: 'Preview shows Duststorm and Sandstorm enabled together',
    mapName: 'Cze & Peku',
    mapUrl: 'https://www.czepeku.com/',
  },
  eagles: {
    src: '/videos/eagles.mp4',
    description: 'Preview shows Eagles with Shadow enabled',
  },
  fire: {
    src: '/videos/fire-filter.mp4',
    description: 'Preview shows Fire enabled',
  },
  fireflies: {
    src: '/videos/fireflies.mp4',
    description: 'Preview shows Fireflies enabled',
    mapName: "Sanctum of Maps",
    mapUrl: "https://www.patreon.com/sanctumofmaps",
  },
  fireparticles: {
    src: '/videos/fire-particle.mp4',
    description: 'Preview shows Fire in Manual Placement mode with Light Source enabled',
    mapName: "Moonlight Maps",
    mapUrl: "https://moonlight-maps.com/",
  },
  fish: {
    src: '/videos/fish.mp4',
    description: 'Preview shows Fish and Underwater enabled together, Fish are limited to Betta Fish Type variants',
    mapName: 'Moonlight Maps',
    mapUrl: 'https://moonlight-maps.com/',
  },
  ghosts: {
    src: '/videos/ghosts.mp4',
    description: 'Preview shows Ghosts enabled, limited to the Cute variant',
    mapName: "Angela's Maps",
    mapUrl: 'https://angelamaps.com/',
  },
  glitch: {
    src: '/videos/glitch.mp4',
    description: 'Preview shows Glitch with both the Slice and Glyph parameters enabled',
    mapName: 'Cze & Peku',
    mapUrl: 'https://www.czepeku.com/',
  },
  ice: {
    src: '/videos/ice.mp4',
    description: 'Preview shows Ice enabled',
    mapName: "The MAD Cartographer",
    mapUrl: "https://themad.network/the-mad-cartographer",
  },
  lightningbolts: {
    src: '/videos/lightning-bolts.mp4',
    description: 'Preview shows Lightning Bolts with the Horizontal Lightning Mode enabled',
    mapName: "Angela's Maps",
    mapUrl: 'https://angelamaps.com/',
  },
  magiccrystals: {
    src: '/videos/magic-crystals.mp4',
    description: 'Preview shows Magic Crystals with Orbit mode turned off',
    mapName: 'Zach Moeller',
    mapUrl: 'https://www.patreon.com/zachmoeller',
  },
  neon: {
    src: '/videos/neon.mp4',
    description: 'Preview shows Neon in Fill + Outline mode using custom source color matching',
    mapName: "Cze & Peku",
    mapUrl: "https://www.czepeku.com/",
  },
  rain: {
    src: '/videos/rain.mp4',
    description: 'Preview shows Rain in Top Down mode with Background and Token Trails enabled',
    mapName: "Angela's Maps",
    mapUrl: "https://angelamaps.com/",
  },
  rats: {
    src: '/videos/rats.mp4',
    description: 'Preview shows Rats in Directional Movement mode with Directional Spread enabled',
    mapName: "Cze & Peku",
    mapUrl: "https://www.czepeku.com/",
  },
  sakurablossoms: {
    src: '/videos/sakura-blossoms.mp4',
    description: 'Preview shows Sakura Blossoms with Background and Token Trails enabled',
    mapName: "Moonlight Maps",
    mapUrl: "https://moonlight-maps.com/",
  },
  sandstorm: {
    src: '/videos/sandstorm.mp4',
    description: 'Preview shows Sandstorm and Duststorm enabled together',
    mapName: 'Cze & Peku',
    mapUrl: 'https://www.czepeku.com/',
  },
  screenshake: {
    src: '/videos/screen-shake.mp4',
    description: 'Preview shows Screen Shake with Timed mode disabled',
    mapName: "Cze & Peku",
    mapUrl: "https://www.czepeku.com/",
  },
  snowstorm: {
    src: '/videos/snowstorm.mp4',
    description: 'Preview shows Snowstorm in Top Down mode with Background and Sweeping Snow enabled',
    mapName: "Angela's Maps",
    mapUrl: "https://angelamaps.com/",
  },
  summerleaves: {
    src: '/videos/summer-leaves.mp4',
    description: 'Preview shows Summer Leaves and Wind enabled together, with Directional Movement and Synchronized Direction enabled',
    mapName: "Cze & Peku",
    mapUrl: "https://www.czepeku.com/",
  },
  sunlight: {
    src: '/videos/sunlight.mp4',
    description: 'Preview shows Sunlight with Parallel mode disabled',
    mapName: "Sanctum of Maps",
    mapUrl: "https://www.patreon.com/sanctumofmaps",
  },
  underwater: {
    src: '/videos/fish.mp4',
    description: 'Preview shows Underwater and Fish enabled together',
    mapName: 'Moonlight Maps',
    mapUrl: 'https://moonlight-maps.com/',
  },
  water: {
    src: '/videos/water.mp4',
    description: 'Preview shows Water enabled for a Region with Flowing Water and Follow Region Path enabled',
    mapName: "Angela's Maps",
    mapUrl: 'https://angelamaps.com/',
  },
  wind: {
    src: '/videos/wind.mp4',
    description: 'Preview shows Wind and Summer Leaves enabled together, with Wind in Manual Painting mode',
    mapName: "Cze & Peku",
    mapUrl: "https://www.czepeku.com/",
  },
  windwisps: {
    src: '/videos/wind-wisps.mp4',
    description: 'Preview shows Wind Wisps and Wind enabled together',
    mapName: "Angela's Maps",
    mapUrl: "https://angelamaps.com/",
  },
};

function effectShowcaseMarkup(effect) {
  const showcase = effectShowcases[effect.id];
  if (!showcase) return '';
  const props = [
    `src=${JSON.stringify(showcase.src)}`,
    `title=${JSON.stringify(effect.label)}`,
    `description=${JSON.stringify(showcase.description)}`,
  ];
  if (showcase.mapName) props.push(`mapName=${JSON.stringify(showcase.mapName)}`);
  if (showcase.mapUrl) props.push(`mapUrl=${JSON.stringify(showcase.mapUrl)}`);
  return `<EffectShowcase ${props.join(' ')} />\n\n`;
}

const specialNotes = {
  fireworks: [
    'Choose Firework Mode first. Burst Style, Shells per Volley, and Sparks per Shell apply to Burst; the Flight controls apply to Dragon.',
    'Top Down changes the viewpoint. Firework Size (grid units) and Launch Height (grid units) are also limited by the available Scene or Region area.',
    'A longer Period leaves more space between launches. In Dragon mode the pause follows the dragon sequence and its final burst.',
    'Increase Sparks per Shell, Shells per Volley, or Dragon Spark Detail gradually; higher values require more rendering work.',
    'Fireworks uses its own Wind Drift and Wind Direction controls and does not expose a Sound FX toggle.',
  ],
  bats: [
    'Orbit works well when bats should circle a cave chamber, tower, or other focal point. Directional Movement is better when they should cross a wider map.',
    'Shadow Only can suggest bats passing above the ground without showing the bat sprites themselves.',
  ],
  birds: [
    'Select only the Animations that fit the Scene so the flock does not look like several unrelated effects.',
    'Lower Density with a longer Lifetime usually reads more naturally than a dense flock that is replaced quickly.',
  ],
  crows: [
    'Lower Opacity with moderate shadows can work well when the flock should appear distant, such as over a battlefield or haunted landscape.',
    'Directional Movement establishes the main route, while Lateral Movement keeps repeated paths from looking mechanical.',
  ],
  eagles: [
    'A larger Scale with lower Density can make the eagles feel farther above the map than a crowded flock.',
    'Orbit can draw attention to a mountain, fortress, battlefield, or another point of interest.',
  ],
  rats: [
    'Enable Token Avoidance when rats should visibly scatter from moving creatures.',
    'Avoid Stationary Tokens keeps nearby tokens relevant even when they are not moving. Disable it when only movement should provoke a response.',
  ],
  spiders: [
    'A lower layer with Token Avoidance can make spiders read as part of the ground instead of foreground decoration.',
    'A smaller Avoidance Radius with stronger Avoidance Strength creates a later but sharper reaction.',
  ],
  bubbles: [
    'Top Down is intended for overhead maps and can pair well with [Underwater](../underwater/) or [Water](../water/).',
    'Token Trails create temporary openings through the bubbles. Tune Trail Width before increasing Trail Strength.',
  ],
  embers: [
    'Enable Synchronized Direction when [Wind](../wind/) or [Duststorm](../duststorm/) should drive the ember flow.',
    'Lower Density with a moderate Lifetime can suggest distant fire without obscuring the map.',
  ],
  stars: [
    'Lower Density works well when Stars are used as a subtle accent. Raise it when the stars should become a stronger background layer.',
    'Tint, Opacity, and Scale usually change the overall mood more than Density alone.',
  ],
  autumnleaves: [
    'Trail Width controls the affected area; Trail Strength and Trail Swirl shape the response; Settle Time (Seconds) controls how quickly the surface returns.',
    'Spawn Mode and Depth Variation help prevent the leaves from forming a uniform curtain.',
  ],
  clouds: [
    'Synchronized Direction allows Clouds to follow [Wind](../wind/) or [Duststorm](../duststorm/) direction changes.',
    'Orbit works well when clouds should circulate around a focal area rather than cross the full Scene.',
    'Shadow controls add depth, but high Shadow Opacity can reduce map readability.',
  ],
  fog: [
    'This is the particle Fog effect. The separate [Fog filter](../fog-filter/) applies continuous haze and includes token-trail controls.',
    'Use particle Fog for visible moving banks. Use the [Fog filter](../fog-filter/) when the active area should have a continuous haze treatment.',
  ],
  rain: [
    'Choose the normal or Top Down presentation before tuning Density and Direction because the two modes use different movement and splash behavior.',
    'Splash Density is independent from the primary Rain Density when splashes are enabled.',
    'Background Water can fill immediately or over time and supports sheen, shimmer, token interaction, elevation thresholds, and settling.',
  ],
  hail: [
    'Top Down changes the hail projection and should be selected before tuning Scale and Direction.',
    'Hail is visually strong, so moderate Opacity and Density values usually preserve token readability better.',
  ],
  snow: [
    'Balance airborne Density separately from **Background** coverage while Snow is enabled.',
    'Background trails can expose paths through snow and optionally refill over a configured duration.',
    'Use the Token Elevation Threshold to prevent flying or elevated tokens from carving trails through the surface.',
  ],
  snowstorm: [
    'Snowstorm is denser and more directional than Snow and includes a separate Sweeping Snow layer.',
    'Rotation Strength has its largest effect in Top Down mode. Keep it lower when flakes should follow a more consistent direction.',
    'Background Opacity can remain below full coverage so map details remain visible beneath the accumulated snow.',
  ],
  bloom: [
    'Raise Threshold before Bloom when only the brightest highlights should glow.',
    'Bloom compounds with bright particles, lighting, and emissive artwork, so review it with the complete stack active.',
  ],
  color: [
    'Use Tint and Blend Mode for broad grading, then make smaller Saturation, Contrast, Brightness, and Gamma adjustments.',
    'Color is often most useful near the end of the filter stack because it can grade the output of earlier particles and filters together.',
  ],
  'fog-filter': [
    'This is the Fog filter. The [particle Fog effect](../fog/) creates separate moving banks instead.',
    'Token Trails can temporarily clear haze around moving tokens and settle back over time.',
    'Synchronized Direction allows the filter to follow compatible [Wind](../wind/) or [Duststorm](../duststorm/) effects.',
  ],
  lightning: [
    'Period controls the spacing between automatic events, while Duration controls each flash.',
    'Audio Aware can trigger from selected audio channels when the bass threshold is met.',
    'Keep Brightness conservative on already bright maps to avoid washing out large portions of the Scene.',
    'Above Darkness presents the luminous flash contribution above Foundry scene darkness.',
  ],
  oldfilm: [
    'Balance Sepia, Noise Density, and Scratch Density instead of maximizing all three at once.',
    'Higher values can work well for a short transition, while lower values are easier to leave active for a complete Scene.',
  ],
  predator: [
    'Thermal Strength blends the false-color palette into the original scene, while Thermal Contrast separates cool and hot values.',
    'Edge Definition sharpens temperature boundaries. Scanline Strength, Sensor Noise, Scanline Speed, and Scanline Width shape the sensor presentation independently.',
  ],
  neon: [
    'Choose Source Color Matching before tuning Threshold, Smoothness, or the custom color ranges so the filter is matching the intended artwork.',
    'Pulse and Slide are mutually exclusive. Flicker can be combined with either animation mode.',
    'Halo Radius can be visually expensive at higher values, especially when Neon covers a large portion of the Scene.',
  ],
  screenshake: [
    'Timed automatically ends the effect after the configured Duration.',
    'Edge Protection reduces exposed canvas edges during displacement; stronger shake generally needs more protection.',
    'Audio Aware can turn the filter into a reactive thunder, impact, or music-bass effect.',
  ],
  underwater: [
    'Speed controls movement while Scale controls the size of the distortion pattern.',
    'Underwater can pair with [Bubbles](../bubbles/), [Fish](../fish/), or [Water](../water/), but several strong distortion filters in the same area can make the map difficult to read.',
  ],
  sakurablossoms: [
    'Background fill and appearance controls are separate from airborne Scale, Speed, Lifetime, Density, and Opacity while the effect is enabled.',
    'Use Trail Lift Chance sparingly so frequent token movement does not continuously refill the airborne layer.',
  ],
  summerleaves: [
    'Variants controls which summer leaf designs may spawn.',
    'Spin Speed, Turbulence, Gustiness, Ripple, Edge Definition, and Edge Width shape separate parts of the motion and rendering.',
    'The **Background** uses the same disturbance, elevation, and settling model as [Autumn Leaves](../autumnleaves/).',
  ],
  fireflies: [
    'Lower Density with a moderate Lifetime produces distinct points of light instead of visual noise.',
    'Token Avoidance can make fireflies move away from approaching creatures, while Orbit creates a localized swarm.',
  ],
  fireparticles: [
    'Manual Placement stores individual flame positions and supports per-placement direction, adjustment, flipping, and optional light sources.',
    'Glow and Glow Radius affect the sprite presentation. Light Source controls create Scene illumination for manually placed flames.',
    'Burn Tokens adds a temporary burning presentation when eligible tokens enter the flame area.',
  ],
  fish: [
    'Fish Type and Animations define the visual population, while movement and Token Avoidance define how the school behaves.',
    'Token Avoidance works well when tokens should pass through or around the school without fish swimming directly through them.',
    'Glow, Bloom, and Trail can be used for bioluminescent, spirit, or other stylized fish variants.',
  ],
  magiccrystals: [
    'Rainbow replaces the single Tint color with a changing multicolor treatment.',
    'Glow and Bloom compound, so raise one at a time while viewing the complete effect stack.',
  ],
  ghosts: [
    'Manual Placement creates fixed ghost positions, while the normal particle controls create ghosts that move across the Scene.',
    'Variants, Wobble, Displacement, Blur, and Glow provide the primary visual identity.',
    'Token Avoidance can keep moving ghosts from passing directly through tokens when desired.',
  ],
  sandstorm: [
    'Within an enabled Sandstorm effect, the airborne particles and persistent sand **Background** can be toggled and configured separately. Disabling Sandstorm disables both.',
    'Dune Migration, Sand Grit, and Token Trails shape the ground surface, while Wobble changes the airborne particles.',
    'Sandstorm particles can be paired with [Duststorm](../duststorm/) for a denser treatment, but their Density and Opacity compound where they overlap.',
  ],
  windwisps: [
    'Wind Wisps provide visible particle streaks and pair naturally with the [Wind filter](../wind/).',
    'Turbulence, Gustiness, and Distortion make the wisps less uniform without changing the base Direction.',
  ],
  sunlight: [
    'Ray Direction and Ray Length establish the beam geometry, while Ray Intensity, Opacity, and Tint establish visibility.',
    'Parallel Rays works well for broad sunlight. Disabling it makes the rays converge toward a more localized source point.',
    'Above Darkness presents the luminous ray contribution above Foundry scene darkness.',
  ],
  duststorm: [
    'Within an enabled Duststorm effect, the airborne dust and persistent sand **Background** can be toggled and configured separately. Disabling Duststorm disables both.',
    'Direction Randomization controls variation around the base Direction; Time Between Direction Changes controls how often a new target is selected.',
    'Streakiness and Opacity define the airborne filter, while the **Background** controls define persistent sand coverage.',
    'Use Token Trails and trail refill to make token movement visibly disturb the surface.',
  ],
  ice: [
    'Ice, Frost, Water, Sheen, and Reflection are separate visual layers and can be tuned one group at a time.',
    'Reflection Distance, Reflection Blur, and Reflection Fresnel have a larger readability impact than tint alone.',
  ],
  glitch: [
    'Slice and Glyph systems can be enabled independently.',
    'RGB offsets create channel separation, Slice controls displace bands of the image, and Glyph controls add the digital overlay.',
    'Use a Region to limit the Glitch filter to part of the Scene, or a timed macro for a short transition.',
  ],
  lightningbolts: [
    'Lightning Mode selects the bolt presentation; Top Down controls become available for overhead strikes.',
    'Trigger Chance and Period control occurrence, while Line Width, Branchiness, Bolt Length, Jitter, Glow, and Brightness shape each bolt.',
    'Sync with Lightning Flash coordinates the bolt with the core [Lightning filter](../lightning/).',
    'Above Darkness presents the luminous bolt contribution above Foundry scene darkness.',
  ],
  water: [
    'Flow, Waves, Vortex, Turbulence, Caustics, and Refraction are independent systems.',
    'Follow Region Path and Path Influence are useful for rivers or channels drawn as Regions.',

  ],
  wind: [
    'Manual Painting opens the Wind painting tools. Brush Radius (Grid Spaces) controls the paint area, and the Painting actions add, erase, or clear the mask.',
    'Direction Randomization and Time Between Direction Changes create evolving wind, while Sway, Turbulence, Gustiness, Streakiness, and Highlight shape its appearance.',
    'Wind can drive Synchronized Direction on compatible particle and filter effects.',
  ],
  auroraborealis: [
    'Aurora Mode selects Side, Top Down, or Horizon presentation, each with its own placement controls.',
    'Built-in palettes provide coordinated colors. Custom Colors exposes five color slots and Mixed Colors.',
    'Aurora Count, Intensity, Speed, Ribbon Width, Waviness, and Softness define the ribbons themselves.',
    'Above Darkness presents the luminous ribbon contribution above Foundry scene darkness.',
  ],
  fire: [
    'Scale and Flame Spread establish the flame field before Density and Speed are tuned.',
    'Inner Flame, Outer Flame, Core Flame, and Smoke Color can be adjusted independently for ordinary or stylized fire palettes.',
    'Glow, Smoke, Heat, and Heat Distortion are separate layers and should be raised incrementally.',
    'Above Darkness presents the luminous flame contribution above Foundry scene darkness.',
  ],
};

const importantControlIds = {
  fireworks: ['fireworkMode', 'topDown', 'palette', 'frequency', 'burstRadius', 'dragonPatterns', 'dragonDirection', 'dragonTravel', 'dragonSpeed', 'aboveDarkness'],
  bats: ['orbit', 'directionalMovement', 'dropShadow', 'shadowOnly', 'density'],
  birds: ['animations', 'orbit', 'directionalMovement', 'dropShadow', 'density'],
  crows: ['directionalMovement', 'lateralMovement', 'dropShadow', 'shadowOpacity', 'density'],
  eagles: ['animations', 'scale', 'orbit', 'directionalMovement', 'dropShadow'],
  rats: ['directionalMovement', 'tokenAvoidance', 'tokenAvoidanceAtRest', 'tokenAvoidanceRadius', 'tokenAvoidanceStrength'],
  spiders: ['directionalMovement', 'tokenAvoidance', 'tokenAvoidanceAtRest', 'tokenAvoidanceRadius', 'tokenAvoidanceStrength'],
  bubbles: ['topDown', 'directionalMovement', 'synchronizedDirection', 'tokenTrailsEnabled', 'tokenTrailWidth'],
  embers: ['topDown', 'directionalMovement', 'synchronizedDirection', 'lifetime', 'density'],
  stars: ['orbit', 'scale', 'speed', 'density', 'alpha'],
  autumnleaves: ['spawnMode', 'direction', 'turbulence', 'backgroundEnabled', 'backgroundInteractionEnabled'],
  clouds: ['orbit', 'direction', 'synchronizedDirection', 'scale', 'dropShadow'],
  fog: ['direction', 'synchronizedDirection', 'scale', 'density', 'alpha'],
  rain: ['topDown', 'splash', 'splashDensity', 'direction', 'backgroundEnabled', 'backgroundInteractionEnabled'],
  hail: ['topDown', 'direction', 'synchronizedDirection', 'scale', 'density'],
  snow: ['topDown', 'direction', 'density', 'backgroundEnabled', 'backgroundTrailsEnabled'],
  snowstorm: ['topDown', 'rotationStrength', 'direction', 'backgroundEnabled', 'backgroundSweepEnabled', 'backgroundTrailsEnabled'],
  bloom: ['threshold', 'bloomScale', 'blur'],
  color: ['color', 'blendMode', 'saturation', 'contrast', 'brightness', 'gamma'],
  'fog-filter': ['dimensions', 'density', 'direction', 'synchronizedDirection', 'tokenTrailsEnabled'],
  lightning: ['frequency', 'spark_duration', 'brightness', 'audioAware', 'aboveDarkness'],
  oldfilm: ['sepia', 'noise', 'noiseSize', 'scratchDensity', 'scratch'],
  predator: ['tokenHeatSeek', 'tokenHeatSeekDispositions', 'thermalStrength', 'thermalContrast', 'edgeDefinition', 'scanlineStrength', 'speed'],
  screenshake: ['timed', 'strength', 'speed', 'smoothness', 'decay', 'edgeProtection', 'audioAware'],
  underwater: ['scale', 'speed'],
  sakurablossoms: ['directionalMovement', 'topDown', 'orbit', 'synchronizedDirection', 'backgroundEnabled', 'backgroundInteractionEnabled'],
  summerleaves: ['variants', 'spawnMode', 'turbulence', 'backgroundEnabled', 'backgroundInteractionEnabled'],
  fireflies: ['orbit', 'directionalMovement', 'tokenAvoidance', 'tokenAvoidanceRadius', 'density'],
  fireparticles: ['spritesheets', 'manualPlacement', 'lightSource', 'glow', 'burnTokens'],
  fish: ['fishType', 'animations', 'directionalMovement', 'tokenAvoidance', 'glow', 'trail'],
  magiccrystals: ['rainbow', 'orbit', 'spin', 'glow', 'bloom'],
  ghosts: ['variants', 'manualPlacement', 'wobble', 'displacement', 'tokenAvoidance'],
  sandstorm: ['direction', 'synchronizedDirection', 'wobble', 'backgroundEnabled', 'backgroundMigrationEnabled', 'backgroundTrailsEnabled'],
  windwisps: ['direction', 'synchronizedDirection', 'windTurbulence', 'windGustiness', 'windDistortion'],
  sunlight: ['parallel', 'angle', 'gain', 'lacunarity', 'beam_length', 'alpha', 'aboveDarkness'],
  duststorm: ['direction', 'directionRandomization', 'density', 'streakiness', 'backgroundEnabled', 'backgroundTrailsEnabled'],
  ice: ['strength', 'iceScale', 'frostStrength', 'waterStrength', 'reflectionStrength', 'reflectionFresnel'],
  glitch: ['sliceEnable', 'slices', 'offset', 'sliceJaggedness', 'glyphEnable', 'glyphIntensity'],
  lightningbolts: ['mode', 'triggerChance', 'frequency', 'branches', 'syncFlash', 'audioAware', 'aboveDarkness'],
  water: ['flow', 'followRegionPath', 'pathInfluence', 'flowStrength', 'waves', 'vortex', 'caustics', 'refraction'],
  wind: ['manualPlacement', 'direction', 'directionRandomization', 'turbulence', 'gustiness', 'streakiness', 'sheenStrength'],
  auroraborealis: ['mode', 'palette', 'auroraCount', 'intensity', 'ribbonWidth', 'waviness', 'softness', 'aboveDarkness'],
  fire: ['dimensions', 'height', 'density', 'intensity', 'glow', 'smoke', 'distortion', 'aboveDarkness'],
  neon: ['sourceColorMode', 'colorFamilies', 'mode', 'intensity', 'glow', 'outlineWidth', 'pulseEnabled', 'slideEnabled', 'flickerEnabled', 'aboveDarkness'],
};

const effectOverviews = {
  fireworks: `## Burst and Dragon modes

**Firework Mode** selects a conventional **Burst** display or a flying **Dragon** made of sparks. Both can run across the Scene or inside **FXMaster: Particle Effects** on a Region.

### Burst

**Burst Style** selects Chrysanthemum, Peony, Willow, Palm, Ring, or a mixture. **Shells per Volley** sets the number of staggered launches, **Sparks per Shell** fills out each burst, and **Burst Duration (ms)** controls how long those sparks remain visible.

**Period** sets the interval between launches or volleys in milliseconds. **Timing Variation** makes that interval less regular. A shorter Period with a longer Burst Duration produces more overlap.

### Dragon

Dragon mode forms a spark dragon, sends it through a flight pattern, and finishes with a finale and a matching burst. **Dragon Duration (ms)** controls the dragon sequence. The next **Period** starts after the sequence and follow-up burst have finished.

| Parameter | What to adjust |
|---|---|
| Flight Patterns | Choose Circular, Figure 8, or both as available paths. |
| Flight Direction | Rotate the path; the dragon faces along the curve while travelling. |
| Flight Distance | Increase the distance travelled, or set it to 0 for a dragon that stays near its origin. |
| Flight Speed | Adjust travel speed without changing Dragon Duration. A value of 0 pauses path travel rather than all animation. |
| Wingbeat Rate | Adjust wing movement separately from travel speed. |
| Dragon Spark Detail | Increase silhouette detail, with a corresponding increase in rendering work. |

### Color, size, and viewpoint

**Color Palette** provides coordinated color sets. Select **Custom Colors** to use the five **Custom Color** slots. **Multicolor Shells** mixes palette colors within each shell or dragon; turn it off for one color per shell.

Use **Firework Size (grid units)** for burst or dragon size and **Shell Size** for the launching shell trail. **Launch Height (grid units)** sets the launch distance. Choose **Top Down** for an overhead view. The available Scene or Region space can limit how large the effect appears.

**Spark Trail Length**, **Gravity**, **Wind Drift**, and **Wind Direction** shape the loose sparks. Wind Drift is a Fireworks control, not a link to the Wind filter.

### Above Darkness and Region events

**Above Darkness** is enabled by default. It keeps the luminous fireworks visible over Scene darkness without creating Foundry light sources.

To start the display when a token enters an area, add Fireworks to a Region particle behavior and configure its **Events**. See [Token enter and exit events](../../../../regions/#events). Event activation controls the whole repeating display; it does not fire exactly one shell for each crossing.
`,
  predator: `## Thermal image and token heat sources

With **Token Heat Seek** off, **Thermal Strength** blends a thermal palette over the Scene. **Thermal Contrast**, **Edge Definition**, **Scanline Strength**, **Sensor Noise**, **Scanline Speed**, and **Scanline Width** refine the image.

Enable **Token Heat Seek** to use visible tokens as heat sources against cooler surroundings. **Token Disposition** chooses which visible tokens contribute. The effect uses full thermal vision in this mode, so **Thermal Strength** is hidden.

This does not reveal hidden or occluded tokens. Effect masks, layer placement, and the current view still determine what can be seen.
`,
  rain: `## Rain presentation

Rain has separate normal and Top Down presentations. Choose **Top Down** before tuning movement because it changes how the rain, direction, and splash layer are rendered.

### Airborne rain and splashes

**Scale**, **Speed**, **Density**, **Opacity**, and **Direction** control the main rain layer. **Splash** adds impact sprites. **Splash Density** and **Splash Scale** are independent from the main Rain Density and Scale, so impacts can remain visible without forcing the airborne layer to use the same amount or size.

### Background water

Within an enabled Rain effect, **Background** adds a persistent wet surface with controls separate from the airborne rain and splashes. Disabling Rain disables the Background as well. It supports immediate or timed fill, ground coverage, patch size, fill variation, movement, opacity, sheen, and shimmer.

### Token trails

**Token Trails** disturbs the background around moving tokens. **Trail Width** defines the affected path, **Trail Strength** controls the amount of disturbance, **Token Elevation Threshold** limits which tokens interact with the surface, and **Settle Time (Seconds)** controls how quickly it returns.
`,
  snow: `## Airborne and settled snow

Within an enabled Snow effect, the airborne and **Background** layers are configured separately. The Background can build to full coverage without requiring the airborne flakes to become a whiteout, but disabling Snow disables both layers.

### Airborne snow

Choose **Top Down** before adjusting **Direction**, **Scale**, **Speed**, and **Density**. The normal presentation shows drifting snowfall across a side-facing view; Top Down changes the motion and coverage for overhead maps.

### Background snow

**Background** creates persistent snow coverage with immediate or timed fill, opacity, fill variation, drift height, and drift size. Configure the background after the airborne layer so the two remain visually balanced.

### Token trails and refill

**Token Trails** removes a path through the accumulated snow. **Trail Width** and **Trail Strength** define the path, **Refill Trails Over Time** restores it over the configured **Trail Refill Time**, and **Token Elevation Threshold** prevents elevated tokens from affecting the surface.
`,
  snowstorm: `## Snowstorm layers

Snowstorm is the denser and more directional snow effect. Within an enabled Snowstorm effect, the main airborne storm, persistent **Background** snow, and optional **Sweeping Snow** layer are configured separately. Disabling Snowstorm disables all of them.

### Airborne storm

Choose **Top Down** before tuning **Rotation Strength**, **Direction**, **Scale**, **Speed**, and **Density**. Rotation Strength has its largest visual effect in Top Down mode and should remain lower when the flakes need to follow a more consistent route.

### Background and sweeping snow

**Background** adds accumulated snow with fill, opacity, variation, drift height, and drift size controls. **Sweeping Snow** adds a separate moving layer with its own opacity, scale, speed, and strength. The background is intentionally less opaque than [Snow](../snow/)’s maximum so more of the map remains visible through the storm.

### Token trails and refill

Token trails use the same width, strength, refill, refill-time, and elevation controls as Snow. Configure these after the background appearance is established.
`,
  autumnleaves: `## Airborne and background leaves

Within an enabled Autumn Leaves effect, airborne leaves and the persistent **Background** surface can be toggled and configured separately. **Background** is not a standalone effect; disabling Autumn Leaves disables both layers.

### Airborne motion

**Spawn Mode**, **Direction**, **Directional Spread**, **Scale**, **Speed**, **Density**, **Spin Speed**, **Turbulence**, **Gustiness**, **Depth Variation**, and **Ripple** shape the moving leaves. Set the travel pattern first, then use the rendering controls to keep repeated particles from looking uniform.

### Ground coverage

**Background** adds persistent leaf coverage with immediate or timed fill, opacity, coverage, variation, pile amount, pile size, and ground-particle size controls.

### Token trails

**Token Trails** disturbs the settled leaves. **Trail Width**, **Trail Strength**, and **Trail Swirl** define the movement around a token. **Trail Lift Chance** can return some leaves to the airborne layer, while **Settle Time (Seconds)** and **Settle Impact** control the return to rest.
`,
  summerleaves: `## Summer leaf layers

Within an enabled Summer Leaves effect, the airborne and **Background** systems are configured separately, using the same Background model as [Autumn Leaves](../autumnleaves/). **Background** is not standalone; disabling Summer Leaves disables both layers. **Variants** chooses which leaf and petal designs can appear.

### Airborne motion

Choose the Variants first, then configure **Spawn Mode**, **Direction**, **Directional Spread**, **Scale**, **Speed**, **Density**, **Spin Speed**, **Turbulence**, **Gustiness**, **Depth Variation**, **Ripple**, and the edge controls.

### Ground coverage and trails

**Background** controls fill, opacity, coverage, variation, piles, and ground-particle size. **Token Trails** controls the disturbed area, strength, swirl, lift chance, elevation threshold, and settling behavior around moving tokens.
`,
  sakurablossoms: `## Blossom ambience and ground coverage

Sakura Blossoms includes ambient drifting, **Directional Movement**, **Top Down**, and **Orbit** presentations. It also includes the movement modes previously provided by Sakura Bloom.

Within an enabled Sakura Blossoms effect, the drifting blossom layer and optional persistent **Background** accumulation are configured separately. **Background** is not standalone; disabling Sakura Blossoms disables both layers. The airborne layer uses **Scale**, **Speed**, **Lifetime**, **Density**, and **Opacity**, while **Background** has its own fill and appearance controls.

### Movement modes

Leave Directional Movement, Top Down, and Orbit off for ambient drifting. Enable **Directional Movement** for a travelling stream of petals, then adjust **Direction** or enable **Synchronized Direction** to follow [Wind](../wind/) or [Duststorm](../duststorm/). **Top Down** uses overhead motion with **Rotation Strength**; **Orbit** uses circular motion with **Orbit Distance**. Orbit and Top Down are mutually exclusive.

### Background and trails

**Background** controls fill timing, opacity, coverage, variation, pile amount, pile size, and **Ground Particle Size**. **Token Trails** controls the affected radius, strength, swirl, lift chance, settle time, and settle impact around moving tokens.
`,
  water: `## Major systems

Water is built from several independent systems. They can be combined, but each can also be tuned or disabled without changing the others.

### Base surface

**Water Tint**, **Opacity**, **Scale**, **Turbulence**, and **Still Water Speed** define the underlying surface before directional movement is added.

### Flow and Region paths

Enable **Flowing Water** for a directional current. **Flow Speed**, **Flow Direction**, and **Flow Strength** control that movement. In a Region Water effect, **Follow Region Path** allows a river or channel drawn as a Region to bend the current, while **Path Influence** controls how strongly the Region path overrides the base direction. These two controls are not shown on Scene Water effects.

### Waves and vortex

**Waves** adds a second directional layer with its own speed, direction, and strength. The wave direction can differ from the flow direction, which can work well for wind-driven surface movement over a current.

**Vortex Water** adds circular movement. Vortex Center Size controls the affected center, while Vortex Speed, Vortex Strength, and Clockwise Rotation control the spin.

### Caustics and refraction

**Caustics** adds moving light patterns with separate strength and tint. **Refraction** controls how strongly the underlying Scene is displaced. Raise them separately because both can affect map, grid, and text readability.

:::note[Water module settings]
Some Water controls are hidden when their world-level feature is disabled. Enable the required group in [Water Module Settings](../../../../plus/water-module-settings/) before configuring it on an effect row.
:::
`,
  wind: `## Procedural and painted Wind

Wind can run across the complete Scene or Region, or it can be limited to a painted mask.

### Procedural Wind

Start with **Direction**, **Speed**, and **Density**. Then use **Scale** and **Opacity** to set the overall coverage. **Distortion**, **Turbulence**, **Sway Strength**, **Sway Frequency**, **Gustiness**, **Streakiness**, and **Highlight** shape the movement and visible detail.

**Direction Randomization** adds variation around the base direction. **Direction Change Radius** sets the allowed range, and **Time Between Direction Changes** controls how often a new target is selected.

### Manual Painting

Enable **Manual Painting** to create a movement mask. **Brush Radius (Grid Spaces)** controls the painted area, while the **Painting** actions add to, erase, or clear the mask. This can work well for wind passing through a doorway, moving around a large obstruction, following a canyon, or remaining on one side of a Region.

See [Wind Painting](../../../../plus/wind-painting/) for the complete painting workflow.

### Synchronized direction

Wind can act as the direction source for compatible effects. Enable **Synchronized Direction** on a supported particle or filter to follow Wind’s direction changes while retaining its own speed, scale, density, and appearance.
`,
  neon: `## Source color matching

Neon applies its Fill, Outline, and Halo only to source artwork that passes the selected matching rules. **Source Color Matching** can use broad **Color Families**, up to five **Custom Source Colors**, or both.

When Color Families are enabled, **Detection Mode**, **Affected Source Colors**, **Threshold**, and **Smoothness** define the match. When Custom Colors are enabled, use **Custom Color Range** for hue tolerance and **Custom Shade Range** for lighter or darker versions of each selected color.

## Neon style and color

**Neon Style** selects Fill, Outline, or Fill + Outline. **Core Color** controls Fill and Outline, while **Halo Color** controls the surrounding glow. Disable Apply on either color to retain or derive color from the matched source artwork.

Outline modes expose **Outline Definition**, **Outline Width**, **Outline Strength**, and **Outline Position**. **Intensity**, **Halo Strength**, **Halo Radius**, and **Saturation** affect the complete result.

## Animation

**Pulse** alternates between on and off states. **Slide** sweeps an active band across the effect area. Pulse and Slide are mutually exclusive, while **Flicker** can be combined with either one.

**Above Darkness** presents Neon’s luminous contribution above Foundry scene darkness without changing its order relative to the other FXMaster rows.
`,
  fire: `## Fire filter overview

The Fire filter creates a continuous top-down flame field. It is separate from the [Fire particle effect](../fireparticles/), which uses individual flame sprites and supports Manual Placement.

### Build the flame field

Set **Scale** and **Flame Spread** first, then tune **Density**, **Speed**, **Intensity**, and **Opacity**. **Wind Strength**, **Turbulence**, and **Flicker** control how the flame field moves.

### Color layers

Fire exposes separate **Inner Flame**, **Outer Flame**, **Core Flame**, and **Smoke Color** controls. This supports standard flame colors or stylized treatments such as green, blue, or spectral-looking fire without forcing one tint across the complete filter.

### Secondary layers

**Glow**, **Smoke**, **Heat**, and **Heat Distortion** are separate layers. Their values compound, so add them one at a time while the complete map, tokens, and effect stack are visible.
`,
  fireparticles: `## Manual Placement

Enable **Manual Placement** to place individual Fire particles instead of generating them through **Density**. Use **Place** to add flames, **Delete** to remove a selected placement, and **Clear** to remove the current placements.

### Flame appearance

**Variants**, **Direction**, **Scale**, **Opacity**, **Flicker**, **Glow**, and **Glow Radius** define the placed flames. **Horizontal Flip** mirrors the selected placement when the source image needs to face the opposite direction.

### Optional light sources

Enable **Light Source** to create illumination at each placed flame via a Foundry light source. **Light Color**, **Light Radius**, **Bright Radius**, **Light Intensity**, and **Light Flicker** control that illumination independently from the particle's visual Glow.

### Manual and generated controls

**Density** is hidden while Manual Placement is enabled because the saved placements determine how many flames appear. **Burn Tokens** remains available and can add the configured burning presentation when eligible tokens enter a flame's trigger radius.
`,
  ghosts: `## Manual Placement

Enable **Manual Placement** to save individual Ghost positions instead of generating ghosts through **Density** and **Lifetime**. Use **Place** to add ghosts, **Undo** to remove the most recent placement, and **Clear** to remove the current placements.

### Placement movement and appearance

**Manual Float Radius** controls how far each placed ghost drifts from its saved point, while **Direction** controls its facing. **Variants**, **Scale**, **Speed**, **Opacity**, **Glow**, **Wobble**, **Displacement**, and **Blur** continue to define the appearance and movement of the placed ghosts.

### Manual and automatic controls

**Orbit** and **Manual Placement** are mutually exclusive. **Density**, **Lifetime**, and **Token Avoidance** are hidden in Manual Placement mode because placement count and saved positions replace automatic spawning and avoidance behavior.
`,
  auroraborealis: `## Presentation modes

Aurora Borealis has three presentation modes. Choose the mode before tuning shared ribbon controls because each mode exposes a different placement group.

| Mode | Presentation | Main placement controls |
|---|---|---|
| Side | A vertical curtain across a landscape or side-facing Scene | Curtain Height Position and Curtain Falloff |
| Top Down | An overhead ribbon path | Path Angle, Depth Glow, and Haze Strength |
| Horizon | A lower, distant aurora path | Start Anchor, Exit Anchor, Overhead Drop, Path Slant, Haze Strength, and Haze Height |

## Palettes and ribbons

Built-in palettes provide coordinated color sets. **Custom Colors** exposes five separate color controls plus **Mixed Colors**.

The shared ribbon controls are **Aurora Count**, **Intensity**, **Speed**, **Ribbon Width**, **Waviness**, and **Softness**. Increase Aurora Count or Ribbon Width when more of the view should be filled, but raising both heavily can flatten the separation between ribbons.
`,
};


const exampleOverrides = {
  fireworks: { fireworkMode: 'dragon', dragonPatterns: ['circular', 'figure8'], dragonDuration: 15000, dragonTravel: 0.6, dragonSpeed: 0.5, aboveDarkness: true },
  rain: { topDown: true, splash: true, direction: 270, speed: 0.2, density: 0.4, backgroundEnabled: false },
  snow: { topDown: true, direction: 270, speed: 0.25, density: 0.4, backgroundEnabled: false },
  snowstorm: { topDown: true, direction: 270, speed: 0.55, density: 0.45, backgroundEnabled: false },
  autumnleaves: { topDown: true, direction: 225, synchronizedDirection: false, density: 0.35, backgroundEnabled: false },
  summerleaves: { topDown: true, direction: 225, density: 0.35, backgroundEnabled: false },
  'fog-filter': { color: '#b9c4c9', speed: 0.3, density: 0.45, direction: 180, tokenTrailsEnabled: false },
  water: { tint: { apply: true, value: '#3276c4' }, flow: true, flowDirection: 180, flowStrength: 0.4, waves: true, caustics: true },
  wind: { manualPlacement: false, direction: 180, speed: 0.4, density: 0.55, turbulence: 0.5, gustiness: 0.45 },
  auroraborealis: { mode: 'side', palette: 'aurora', intensity: 0.65, speed: 0.35, auroraCount: 3 },
  fire: { dimensions: 0.49, height: 0.5, speed: 0.15, intensity: 0.55, turbulence: 0.5, glow: 1 },
  fireparticles: { manualPlacement: false, scale: 0.5, density: 0.35, alpha: 1, glow: 0.5 },
  lightning: { color: { apply: false, value: '#ffffff' }, frequency: 0.5, spark_duration: 0.5, brightness: 1 },
  lightningbolts: { mode: 'side', thickness: 0.5, branches: 0.5, brightness: 0.8, frequency: 0.5 },
  predator: { thermalStrength: 0.8, thermalContrast: 0.6, edgeDefinition: 0.35, scanlineStrength: 0.8, noise: 0.15, speed: 0.3, lineWidth: 0.5 },
  neon: { mode: 'fillOutline', sourceColorMode: 'families', colorFamilies: ['cyan', 'magenta', 'purple'], threshold: 0.42, intensity: 0.5, glow: 0.45 },
  screenshake: { timed: true, strength: 0.25, duration: 1.2, speed: 0.5, smoothness: 0.5, decay: 0.5 },
  bloom: { blur: 2, bloomScale: 1, threshold: 0.5 },
  color: { color: { apply: true, value: '#7c75aa' }, saturation: 1, contrast: 1, brightness: 1, gamma: 1 },
};

function representativeOptions(effect) {
  if (exampleOverrides[effect.id]) return exampleOverrides[effect.id];
  const preferred = effect.kind === 'particle'
    ? ['belowTokens', 'tint', 'topDown', 'orbit', 'directionalMovement', 'direction', 'scale', 'speed', 'density', 'alpha']
    : ['belowTokens', 'color', 'tint', 'speed', 'direction', 'density', 'opacity', 'strength', 'scale', 'intensity'];
  const selected = {};
  for (const key of preferred) {
    const parameter = effect.parameters.find((entry) => entry.id === key);
    if (!parameter || parameter.default === undefined) continue;
    selected[key] = parameter.default;
    if (Object.keys(selected).length >= 5) break;
  }
  return selected;
}

function importantControls(effect) {
  const ids = importantControlIds[effect.id];
  if (!ids?.length) throw new Error(`Missing important control list for ${effect.id}.`);

  const parameters = new Map(effect.parameters.map((parameter) => [parameter.id, parameter]));
  return ids.map((id) => {
    const parameter = parameters.get(id);
    if (!parameter) throw new Error(`Unknown important control ${effect.id}.${id}.`);
    return `- **${parameter.label}:** ${parameter.description}`;
  }).join('\n');
}

function relatedPresets(effect) {
  const id = runtimeId(effect);
  const matches = reference.presets.filter((preset) => {
    const list = effect.kind === 'particle' ? preset.particles : preset.filters;
    return list.includes(id);
  });
  if (!matches.length) {
    const control = effect.kind === 'particle'
      ? '<span class="fxm-control-label" data-control="particle-effects">Particle Effects</span>'
      : '<span class="fxm-control-label" data-control="filters">Filter Effects</span>';
    return `No bundled preset currently uses this effect directly. Add it through ${control} or the Direct Effect API.`;
  }

  const grouped = new Map();
  for (const preset of matches) {
    const entry = grouped.get(preset.id) ?? { label: preset.label, tiers: new Set(), variants: new Set() };
    entry.tiers.add(preset.tier === 'plus' ? 'FXMaster+' : 'FXMaster');
    entry.variants.add(preset.variant === 'topDown' ? 'Top Down' : titleCase(preset.variant));
    grouped.set(preset.id, entry);
  }
  const rows = [...grouped.entries()].map(([idKey, entry]) => `| ${entry.label} | \`${idKey}\` | ${[...entry.tiers].join(', ')} | ${[...entry.variants].join(', ')} |`);
  return `| Preset | API name | Availability | Variants |\n|---|---|---|---|\n${rows.join('\n')}`;
}

function apiExample(effect) {
  const kindPlural = effect.kind === 'particle' ? 'particles' : 'filters';
  const suffix = effect.kind === 'particle' ? 'p' : 'f';
  const identifier = `apiMacro_wiki${effect.id.replace(/[^a-z0-9]/gi, '')}_${suffix}`;
  const options = representativeOptions(effect);
  const entry = {
    id: identifier,
    type: runtimeId(effect),
    options,
  };
  return `const created = await FXMASTER.api.effects.play({\n  ${kindPlural}: [${jsString(entry).replace(/\n/g, '\n  ')}],\n});\n\nawait FXMASTER.api.effects.${kindPlural}.stop(created.${kindPlural});`;
}

for (const [index, effect] of reference.effects
  .slice()
  .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id))
  .entries()) {
  const packageBadge = effect.package === 'plus' ? 'FXMaster+' : 'FXMaster';
  const badge = duplicateLabels.has(effect.label) ? `${packageBadge} · ${titleCase(effect.kind)}` : packageBadge;
  const variant = effect.package === 'plus' ? 'caution' : 'tip';
  const notes = specialNotes[effect.id] ?? [
    `Start with the documented defaults and adjust one setting at a time while the effect is visible on the Scene.`,
    `Lower density or opacity first when the map becomes difficult to read. Reduce scale when the individual particles are too large.`,
  ];
  const featureControls = importantControls(effect);
  const overview = effectOverviews[effect.id] ? `${effectOverviews[effect.id]}\n` : '';
  const showcase = effectShowcaseMarkup(effect);
  const showcaseImport = effectShowcases[effect.id]
    ? "import EffectShowcase from '../../../../../components/EffectShowcase.astro';\n"
    : '';
  const content = `---
title: ${JSON.stringify(displayEffectLabel(effect))}
description: ${JSON.stringify(effect.description)}
sidebar:
  order: ${index + 1}
  badge:
    text: ${JSON.stringify(badge)}
    variant: ${variant}
---
import ParameterTable from '../../../../../components/ParameterTable.astro';
${showcaseImport}
<div class="fxm-kicker">${groupDisplayLabel(effect.group)} reference</div>
<div class="fxm-badge-row">
  <a class="fxm-badge" data-tier="${effect.package}" href="${modulePackagePage(effect.package)}" target="_blank" rel="noopener noreferrer" title="Open ${modulePackageName(effect.package)} on Foundry VTT">${tierLabel(effect)}</a>
  <span class="fxm-badge" data-kind="${effect.kind}">${kindLabel(effect)}</span>
  <span class="fxm-badge">API type: ${runtimeId(effect)}</span>
</div>

${showcase}${effect.description}

${groupContextFor(effect)}

| Reference | Value |
|---|---|
| Package | ${tierLabel(effect)} |
| Effect kind | ${kindLabel(effect)} |
| Category | ${groupDisplayLabel(effect.group)} |
| Runtime type | \`${runtimeId(effect)}\` |
| Exposed parameters | ${effect.parameterCount} |

${overview}## Important controls

${featureControls}

## Setup notes

${notes.map((note) => `- ${note}`).join('\n')}

## Bundled preset usage

${relatedPresets(effect)}

## Parameters

The table combines the settings available for this effect in Scene and Region contexts. Scene-only and Region-only badges identify controls limited to one context. Hover or focus an info button to see what the parameter changes on the canvas. Select it to keep the card open. Each card also includes the default, range or choices, context, availability, API key, and control type.

<ParameterTable effectId="${effect.id}" />

## Direct-effect API example

The Direct Effect API creates a separate row shown through <span class="fxm-control-label" data-control="api-effects">Manage API Effects</span>. Add a stable \`apiMacro_…_p\` or \`apiMacro_…_f\` ID when later macro calls need to update or stop the same row.

\`\`\`js
${apiExample(effect)}
\`\`\`

For complete API behavior, scene targeting, stack ordering, and toggle groups, see the [Direct Effect API](../../../../automation/effect-api/) guide.
`;
  fs.writeFileSync(path.join(outputDirectory, `${effect.id}.mdx`), content);
}

console.log(`Generated ${reference.effects.length} effect detail pages in ${path.relative(root, outputDirectory)}.`);

fs.writeFileSync(path.join(outputDirectory, 'sakurabloom.mdx'), `---
title: "Sakura Bloom (legacy)"
description: "Sakura Bloom is now included in Sakura Blossoms."
pagefind: false
sidebar:
  hidden: true
---
Sakura Bloom is no longer a separate effect in the particle manager. Its directional and Top Down presentations are now part of [Sakura Blossoms](../sakurablossoms/).

Use **Directional Movement**, **Top Down**, or **Orbit** on Sakura Blossoms to choose its motion, then configure **Background** and **Token Trails** where needed. The **Sakura Bloom** preset name remains available in the [Preset Catalog](../../../../presets/catalog/).
`);

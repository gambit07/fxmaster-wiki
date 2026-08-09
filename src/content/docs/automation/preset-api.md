---
title: Preset API
description: Resolve, play, replace, inspect, and stop named FXMaster preset compositions.
---

Presets provide a stable, compact API for bundled weather and ambience combinations.

## Manage API-created effects

Effects created through `FXMASTER.api.presets` appear in <span class="fxm-control-label" data-control="api-effects">Manage API Effects</span>. The **Source** column identifies these rows as **API - Preset**, while **Name** identifies the preset that created them.

Use <span class="fxm-control-label" data-control="api-effects">Manage API Effects</span> to inspect, edit, or delete active preset-created rows. These rows remain separate from Scene effects configured through <span class="fxm-control-label" data-control="particle-effects">Particle Effects</span> or <span class="fxm-control-label" data-control="filters">Filter Effects</span>.

## Method reference

| Method | Result |
|---|---|
| `play(name, options)` | Applies or updates one named preset; returns `true` or `false` |
| `stop(name, options)` | Removes rows created for that preset; returns `true` or `false` |
| `toggle(name, options)` | Stops an active preset or plays an inactive one; returns the new enabled state |
| `switch(name, options)` | Stops all active preset-API rows, then applies the requested preset |
| `list()` | Returns all known preset names |
| `listValid(options)` | Returns presets with a compatible variant in the current world |
| `listActive(options)` | Returns preset names represented by active preset-API rows |
| `hasFxmaster()` | Returns whether FXMaster is active |
| `hasFxmasterPlus()` | Returns whether FXMaster+ is active |

## Names

Names are trimmed, lowercased, and normalized with hyphens. These resolve to the same preset:

```js
await FXMASTER.api.presets.play("Acid Rain");
await FXMASTER.api.presets.play("acid-rain");
```

Open the [Preset Catalog](../../presets/catalog/) for the complete shipped list.

## Variant resolution

`topDown: true` requests the top-down variant when one exists.

```js
await FXMASTER.api.presets.play("blizzard", {
  topDown: true
});
```

A preset operation returns `false` when no compatible definition can be resolved for the selected tier, variant, and registered effect database.

## Supported overrides

| Option | Accepted value | Behavior |
|---|---|---|
| `topDown` | Boolean | Requests a top-down preset variant |
| `direction` | Compass alias or degrees | Overrides compatible effect direction |
| `color` | Hex color | Applies a compatible tint override |
| `speed` | Relative name or number | Multiplies supported speed controls |
| `density` | Relative name or number | Multiplies supported density controls |
| `belowTokens` | Boolean | Moves supported rows below tokens |
| `splash` | Boolean | Enables or disables [Rain](../../reference/effects/details/rain/) splashes |
| `background` | Boolean | Enables supported particle background surfaces |
| `tokenTrails` | Boolean | Enables supported token trail interactions |
| `belowTiles` | Boolean | Moves supported rows beneath overhead tiles |
| `belowForeground` | Boolean | Moves supported rows beneath foreground coverage |
| `darknessActivationEnabled` | Boolean | Explicitly enables or disables darkness gating |
| `darknessActivationMin` | Number from 0 to 1 | Sets the minimum active darkness |
| `darknessActivationMax` | Number from 0 to 1 | Sets the maximum active darkness |
| `soundFx` | Boolean | Enables supported FXMaster+ SoundFX matching |
| `windPainting` | Boolean | Enables painted [Wind](../../reference/effects/details/wind/) masks for compatible Wind filters |
| `levels` | Level id/name or array | Limits rows to selected scene Levels |
| `scene` | Scene document or UUID | Targets another scene |
| `silent` | Boolean | Controls missing-preset and invalid-override warnings |
| `skipFading` | Boolean | Bypasses transition fades |

### Direction convention

FXMaster uses geometric degrees:

| Direction | Degrees |
|---|---:|
| East / right | 0 |
| North / up | 90 |
| West / left | 180 |
| South / down | 270 |

Diagonal names and abbreviations such as `ne`, `southwest`, and `nw` are also accepted.

### Relative speed and density

| Name | Multiplier |
|---|---:|
| `very-low` | 0.0 |
| `low` | 0.5 |
| `medium` | 1.0 |
| `high` | 1.5 |
| `very-high` | 2.0 |

Values are clamped and quantized against each effect’s public parameter definition.

## Scene targeting

Omit `scene` to target `canvas.scene`. Supply a Scene document or UUID to target another scene.

```js
await FXMASTER.api.presets.play("fog", {
  scene: "Scene.abc123"
});
```

## List compatible presets

```js
const standard = FXMASTER.api.presets.listValid({
  topDown: false
});

const topDown = FXMASTER.api.presets.listValid({
  topDown: true
});

const eitherVariant = FXMASTER.api.presets.listValid();
```

Use `listValid()` when a macro depends on FXMaster+ effects or a specific projection.

## Switch or clear preset weather

`switch()` stops every preset created through the preset API on the target scene before applying the new name.

```js
await FXMASTER.api.presets.switch("drizzle", {
  density: "low",
  speed: "low"
});
```

A falsy name clears active preset-API rows without applying another preset:

```js
await FXMASTER.api.presets.switch(null, {
  skipFading: true
});
```

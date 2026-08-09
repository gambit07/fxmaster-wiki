---
title: Using Presets
description: Apply complete FXMaster weather and ambience compositions from macros and integrations.
---

Presets are named particle/filter compositions with optional normal and Top Down versions. They provide a stable entry point without requiring every effect option to be repeated in a macro.

## Preset actions

### Play a preset

```js
await FXMASTER.api.presets.play("blizzard");
```

Playing the same preset again updates its API-managed rows rather than affecting Scene effects created through the management windows.

### Stop a preset

```js
await FXMASTER.api.presets.stop("blizzard");
```

Only rows created for that named preset are removed.

### Toggle a preset

```js
const enabled = await FXMASTER.api.presets.toggle("blizzard", {
  topDown: true
});
```

The return value is the new state: `true` when enabled and `false` when disabled.

### Switch weather states

`switch()` stops all presets created through the Preset API on the target Scene before applying the requested name.

```js
await FXMASTER.api.presets.switch("gravewind", {
  direction: "west",
  soundFx: true
});
```

Use a falsy name to clear Preset API rows without applying a replacement:

```js
await FXMASTER.api.presets.switch(null);
```

## Common overrides

| Option | Accepted value |
|---|---|
| `topDown` | Boolean |
| `direction` | Compass string or numeric degrees |
| `color` | Hex color |
| `speed` / `density` | `very-low`, `low`, `medium`, `high`, `very-high`, or a number |
| `belowTokens` / `belowTiles` / `belowForeground` | Boolean |
| `background` | Boolean |
| `tokenTrails` | Boolean |
| `splash` | Boolean |
| `darknessActivationEnabled` | Boolean |
| `darknessActivationMin` / `Max` | Number from 0 to 1 |
| `soundFx` | Boolean; requires supported FXMaster+ rules |
| `windPainting` | Boolean |
| `levels` | Level id/name or an array |
| `scene` | Scene document or Scene UUID |
| `silent` | Boolean |
| `skipFading` | Boolean |

## Free and FXMaster+ variants

Some preset families have a Free definition and an enhanced FXMaster+ definition. Resolution considers the active module tier and whether every referenced effect type is registered.

Use `listValid()` before exposing a preset in another module’s interface:

```js
const validPresets = new Set(
  FXMASTER.api.presets.listValid({ topDown: true })
);
```

## Module integration example

[Calendaria](https://wiki.3deathsaves.com/calendaria/) uses the FXMaster Presets API to activate named FXMaster presets for its Weather system. It's a practical (and impressive) example of a module using the presets API directly instead of manually building FXMaster effects from scratch.

## Browse shipped definitions

Open the [Preset Catalog](./catalog/) to browse each preset family in one card. Free and FXMaster+ versions use separate sections so their effect lists and Top Down availability remain clear.

For every override and return behavior, open the [Preset API](../automation/preset-api/) reference.

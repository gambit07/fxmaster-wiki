---
title: Macro Recipes
description: Reusable FXMaster macro patterns for weather, transitions, stable IDs, scene targeting, and capability checks.
---

## Toggle a top-down hurricane

```js
await FXMASTER.api.presets.toggle("hurricane", {
  topDown: true,
  soundFx: true,
  background: true,
  tokenTrails: true
});
```

## Replace current preset weather

```js
await FXMASTER.api.presets.switch("drizzle", {
  density: "low",
  speed: "low",
  belowTokens: false
});
```

## Clear all scene-wide FXMaster effects

```js
await FXMASTER.api.stopSceneEffects({
  skipFading: true
});
```

This affects scene-wide FXMaster rows. Region documents and their behaviors remain in place.

## Temporarily disable Region effects

```js
const disabled = await FXMASTER.api.stopRegionEffects({
  scene: canvas.scene
});
```

Re-enable the FXMaster Region behaviors later:

```js
const enabled = await FXMASTER.api.startRegionEffects({
  scene: canvas.scene
});
```

Suppression behaviors are not changed by these methods.

## Target a different scene

```js
const scene = game.scenes.getName("Harbor");

await FXMASTER.api.presets.play("fog", {
  scene
});
```

## Check preset availability

```js
const valid = new Set(
  FXMASTER.api.presets.listValid({ topDown: false })
);

if (valid.has("luminous-sky")) {
  await FXMASTER.api.presets.play("luminous-sky");
} else {
  ui.notifications.warn(
    "Luminous Sky is not available with the active FXMaster modules."
  );
}
```

## Add and remove a stable filter

```js
await FXMASTER.api.effects.play({
  filters: [
    {
      id: "apiMacro_ritualBloom_f",
      type: "bloom",
      options: {
        blur: 2,
        bloomScale: 1,
        threshold: 0.45
      }
    }
  ]
});
```

```js
await FXMASTER.api.effects.filters.stop([
  "apiMacro_ritualBloom_f"
]);
```

## Toggle a saved effect group

```js
await FXMASTER.api.effects.toggle({
  toggleKey: "crypt-ambience",
  effects: [
    {
      kind: "particle",
      type: "fog",
      options: {
        density: 0.25,
        speed: 0.2
      }
    },
    {
      kind: "filter",
      type: "color",
      options: {
        color: {
          apply: true,
          value: "#6f7d96"
        },
        saturation: 0.75
      }
    }
  ]
});
```

## Apply weather only at night

```js
await FXMASTER.api.presets.play("gravewind", {
  darknessActivationEnabled: true,
  darknessActivationMin: 0.6,
  darknessActivationMax: 1,
  direction: "west"
});
```

## Inspect active presets

```js
console.table(
  FXMASTER.api.presets.listActive({
    scene: canvas.scene
  })
);
```

---
title: Troubleshooting
description: Diagnose missing effects, rendering, masking, SoundFX, performance, and API behavior.
---

## An effect is listed but does not render

1. Confirm **Enable Effects** is on for the current client.
2. Confirm **Disable Effects For Everybody** is off.
3. Verify the row is enabled and the intended scene is active.
4. Check selected Levels and Darkness Activation.
5. Check Below Tiles, foreground coverage, Region masks, and suppression.
6. Move the row temporarily to the top of <span class="fxm-control-label" data-control="layers">Manage Layers</span>.
7. Disable tint and set opacity or alpha to a visible value.
8. Enable **FXMaster Debugging** and inspect the browser console.

## FXMaster+ effects are missing

Confirm FXMaster and FXMaster+ are installed, active, and loaded without startup errors. FXMaster+ registers into the base effect database; an initialization failure can leave only core definitions available.

Also verify that the installed FXMaster version satisfies the FXMaster+ manifest requirement.

## A parameter list is incomplete

Reload after enabling, disabling, or updating FXMaster or FXMaster+. A core effect should retain its core parameter list when FXMaster+ is absent.

Before changing the world, open the same Scene in a different browser. If the missing parameters or effects appear there, the original browser is probably using stale cached module code or assets.

Close any open Foundry tabs for that address, clear the browser cache or site data for the Foundry host, then reopen Foundry and reload. Clearing site data may sign you out and reset browser-stored preferences, but it does not remove world data.

If the issue remains, check the console for registry, localization, or normalization errors. Reproduce with only FXMaster active, then add FXMaster+ and other visual modules one at a time.

## A preset does nothing

Inspect compatible presets in the active world:

```js
console.table(
  FXMASTER.api.presets.listValid()
);
```

A known preset can be unavailable when FXMaster+ is inactive, the requested projection has no compatible variant, or a referenced type failed to register.

Set `silent: false` during diagnosis to show API warnings:

```js
await FXMASTER.api.presets.play("preset-name", {
  silent: false
});
```

## Sound FX is absent

The Sound FX control is useful only when an active rule matches the effect. Confirm that the rule:

- is enabled;
- includes the current scene or all scenes;
- targets the effect key in use;
- contains playable files;
- is not excluded by Region or suppression behavior;
- satisfies its Environmental or Token Movement conditions.

For default rules, confirm the `psfx-ambience` module is active and use **Reset PSFX Rules to Default** from the **Sound Effects Manager** overflow menu if you may have removed a default rule or would like to reset them to their default state.

## Effects drift during pan or zoom

Identify which system moves incorrectly:

- particle field;
- procedural filter;
- persistent particle background;
- Region mask;
- radial weather restriction;
- overhead Level overlay.

Disable other visual modules, test at 100% browser zoom, and record scene dimensions, grid size, Windows display scale, browser display scale, Foundry version, System version, and the exact pan/zoom sequence.

## Performance drops

Reduce the heaviest contributor first:

- overhead Level behaviors;
- masking layers such as **Below Tokens**, **Below Tiles**, **Below Foreground**, suppression Regions, and other Region or tile restrictions;
- particle effect density;
- procedural filter detail or distortion;
- persistent backgrounds.


## A macro creates an effect but cannot remove it

Any active macro or API effect can be deleted manually from <span class="fxm-control-label" data-control="api-effects">Manage API Effects</span>.

For repeatable macro cleanup, use the IDs returned by `FXMASTER.api.effects.play()` or provide a valid stable ID:

```text
apiMacro_<name>_p
apiMacro_<name>_f
```

IDs without the `apiMacro_` prefix or the correct kind suffix are replaced with generated IDs.

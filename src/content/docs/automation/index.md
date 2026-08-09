---
title: Automation
description: Use the supported FXMaster API from macros and module integrations.
---

FXMaster exposes its API through `FXMASTER.api`. The same API is also available from the active `fxmaster` module object.

Use the API instead of writing Scene flags directly. The API handles parameter preparation, particle backgrounds, filter restarts, stack order, Scene targeting, and fade behavior.

## Generate a macro from the Scene controls

The easiest way to generate an FXMaster macro is to select <span class="fxm-control-label" data-control="save">Save Particle and Filter Effects as Macro</span> from the <span class="fxm-control-label" data-control="effects">FXMaster Controls</span> sidebar. It captures the current Scene particle and filter effect setup and creates the macro in the Macro directory without requiring API code.

The save window includes these options:

| Option | What it controls |
|---|---|
| Macro Name | Sets the name used for the new macro. |
| Macro Action | **Play** creates a new API-effect instance each time the macro runs. **Toggle** turns the saved effect group on or off. |
| Skip Fading | Applies and removes the saved effects immediately instead of using the normal fade-in and fade-out transitions. |

## Choose an API

| Goal | API |
|---|---|
| Apply a named bundled composition | `FXMASTER.api.presets` |
| Create exact particle or filter rows | `FXMASTER.api.effects` |
| Stop all Scene-wide FXMaster rows | `FXMASTER.api.stopSceneEffects()` |
| Disable or re-enable FXMaster Region effects | `stopRegionEffects()` / `startRegionEffects()` |
| Check module availability | `FXMASTER.api.presets.hasFxmaster()` / `hasFxmasterPlus()` |

### Preset API

```js
FXMASTER.api.presets.play(name, options)
FXMASTER.api.presets.stop(name, options)
FXMASTER.api.presets.toggle(name, options)
FXMASTER.api.presets.switch(name, options)
FXMASTER.api.presets.list()
FXMASTER.api.presets.listValid(options)
FXMASTER.api.presets.listActive(options)
```

Use presets for bundled weather and ambience setups. Presets can select normal or top-down variants and apply common overrides without recreating every effect row in a macro.

### Direct Effect API

```js
FXMASTER.api.effects.play(options)
FXMASTER.api.effects.stop(options)
FXMASTER.api.effects.toggle(options)
FXMASTER.api.effects.particles.stop(entries, options)
FXMASTER.api.effects.particles.toggle(entries, options)
FXMASTER.api.effects.filters.stop(entries, options)
FXMASTER.api.effects.filters.toggle(entries, options)
```

Use direct effects when a macro needs exact effect types, specific parameter values, independent copies, stable IDs, or an explicit top-to-bottom stack order.

### Scene and Region control

```js
FXMASTER.api.stopSceneEffects(options)
FXMASTER.api.stopRegionEffects(options)
FXMASTER.api.startRegionEffects(options)
```

These methods target the active Scene by default and accept a Scene document or Scene UUID where supported.

:::caution[Use registered effect types]
Effect type IDs and parameter names are case-sensitive. Open the [Effect Catalog](../reference/effects/) to copy the correct runtime type and review its supported options.
:::

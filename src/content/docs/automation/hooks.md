---
title: Hooks and Integrations
description: Check module availability and respond to supported FXMaster and FXMaster+ runtime hooks.
---

Use the public FXMaster APIs and supported runtime hooks when integrating with FXMaster or FXMaster+.

## Availability checks

```js
const fxmasterActive = FXMASTER.api.presets.hasFxmaster();
const plusActive = FXMASTER.api.presets.hasFxmasterPlus();
```

Use `listValid()` when checking preset availability instead of assuming every effect referenced by a preset is currently registered.

## Preset list methods

Use the Preset API list methods when an integration needs to populate a preset selector, verify compatibility, or report the presets currently active on a Scene:

```js
const knownPresets = FXMASTER.api.presets.list();
const validPresets = FXMASTER.api.presets.listValid();
const activePresets = FXMASTER.api.presets.listActive();
```

| Method | Result |
|---|---|
| `list()` | Returns every known preset name. |
| `listValid(options)` | Returns preset names with a compatible definition for the selected options and currently active modules. |
| `listActive(options)` | Returns preset names represented by active Preset API rows on the target Scene. |

Use `listValid()` for user-facing choices so an integration does not offer presets that cannot resolve in the current world. Use `listActive()` when an interface needs to reflect the current Preset API state.

## SoundFX state hooks

FXMaster+ emits these runtime hooks:

```js
Hooks.on("fxmasterPlusSoundFxPlayingChanged", ({ active }) => {
  console.debug("FXMaster+ SoundFX playing:", active);
});

Hooks.on("fxmasterPlusSoundFxActiveRulesChanged", ({ rules }) => {
  console.debug("FXMaster+ active SoundFX rule scopes:", rules);
});
```

The playing-state hook is useful when an interface needs to know whether SoundFX is currently playing. The active-rules hook is useful when an interface needs to refresh which effects should display the Sound FX option.

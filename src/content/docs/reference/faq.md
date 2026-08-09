---
title: Frequently Asked Questions
description: Common FXMaster and FXMaster+ questions about access, activation, effects, Regions, SoundFX, presets, and recovery.
---

## How do I activate FXMaster+?

Follow the [Accessing FXMaster+](../../plus/access/) guide. It covers subscribing through Gambit’s Lounge, linking Patreon to your Foundry VTT account, restarting the Foundry server, installing **Gambit’s FXMaster+**, and enabling it in a world.

## Should both FXMaster and FXMaster+ be enabled in my world?

Yes, when using FXMaster+. **Gambit’s FXMaster+** is an expansion module and requires **Gambit’s FXMaster**, so both modules should be enabled in the same world. **Gambit’s FXMaster** can be enabled by itself when FXMaster+ features are not needed.

## Can one Scene contain several copies of the same effect?

Yes. Add the same effect more than once through <span class="fxm-control-label" data-control="particle-effects">Particle Effects</span>, <span class="fxm-control-label" data-control="filters">Filter Effects</span>, Regions, or the API. Each copy can use its own settings and placement.

## Can an effect be limited to one room?

Yes. Add a Region for the room dimensions and then add the effect with a Region behavior. For the inverse layout, use a Scene-wide effect and use a Suppression Region behavior inside relevant Regions.

## Can weather appear below tokens but above the map?

Yes. Enable **Below Tokens** and place the row appropriately in <span class="fxm-control-label" data-control="layers">Manage Layers</span>. **Below Tiles** and **Below Foreground** provide additional control around overhead artwork.

## Why is Sound FX not always visible?

The control appears when a matching active FXMaster+ SoundFX rule makes it relevant. A visual effect without a matching rule does not need the toggle. FXMaster contains many conditionally visible parameters to make sure you're only seeing parameters relevant to the mode you're in. Visit specific effect pages and check out the parameter list for more specifics on conditional visibility.

## Why don't I see the Animation Effects controls button?

The Animation Effects window was retired in FXMaster V8, so its former Scene Controls button is no longer available. [Gambit’s Asset Previewer](https://foundryvtt.com/packages/gambitsAssetPreviewer) provides an enhanced and expanded version of that functionality with broader asset browsing, preview, organization, and deployment tools.

## I have an effect active that I can't get rid of. What should I do?

Use left-click on <span class="fxm-control-label" data-control="clearfx">Clear Scene Particle and Filter Effects (Right-click: Disable Region Effects)</span> to remove active Scene particle and filter effects after confirmation.

To clear all Scene-wide FXMaster effects from a macro, use:

```js
await FXMASTER.api.stopSceneEffects({
  skipFading: true
});
```

If the remaining effect belongs to a Region, disable its Region behavior or right-click the same control to disable Region effects.

## I'd like to change how an FXMaster preset looks while using the Calendaria module

Calendaria contains UI modifiers for some aspects of a preset, such as speed and density. It also supports adding a user-generated FXMaster macro directly in place of a preset for a given weather type. Visit the [Calendaria Weather Wiki](https://wiki.3deathsaves.com/calendaria/weather-editor/) or the Calendaria Discord for additional questions.

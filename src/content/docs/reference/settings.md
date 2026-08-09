---
title: Settings
description: User-facing FXMaster world and client settings, defaults, and performance considerations.
---

## Configurable settings



| Setting | Scope | Default | Purpose |
|---|---|---:|---|
| Enable Effects | Client | On | Enables effect rendering for the current user; changing it requires a reload |
| Enable Tooltips | World | On | Shows parameter descriptions in particle and filter configuration |
| Disable Grid Movement Highlighting | World | Off | Hides Foundry's highlighted grid spaces during token movement on gridded Scenes while leaving movement and measurement unchanged |
| Tooltip Direction | Client | Up | Places parameter tooltips above, below, left, or right of controls |
| Include Foundry Grid in FX Stack | Client | Off | Allows FXMaster effects to appear over normal grid lines while controls remain above |
| Display Effects Above Fog/Vision | World | Off | Presents particles and filters above fog/vision while hidden artwork remains masked |
| Apply Region Behaviors to Overhead Levels | World | Off | Allows multi-Level Region effects and suppression in overhead overlays |
| Enable FXMaster Debugging | World | Off | Writes FXMaster debug, warning, and error messages to the console |
| Disable Effects For Everybody | World | Off | Emergency world-level rendering override; changing it requires a reload |

## Client versus world scope

A **client** setting affects only the browser where it is changed. A **world** setting affects the shared world configuration and generally requires Game Master permission.

Players can disable local rendering without changing the scene definitions used by everyone else.

## Grid movement highlighting

Enable **Disable Grid Movement Highlighting** under **Configure Settings → Module Settings** to hide Foundry's highlighted grid spaces while tokens move across gridded Scenes. Token movement, ruler paths, waypoints, and measurement remain available; only the highlighted movement spaces are removed.

This can keep FXMaster token trails and other movement interactions more visible while a token is being moved.

## Performance-sensitive setting

**Apply Region Behaviors to Overhead Levels** can add Region masks and effect runtimes for visible overlays. Test it on representative maps and player hardware before enabling it world-wide.

## Stored module data

FXMaster and FXMaster+ also maintain hidden migration markers and feature data, including custom particle definitions, SoundFX rules, collapsed interface state, Water feature settings, and release state.

Do not edit hidden settings from the console except during a targeted repair with a known schema and a world backup.

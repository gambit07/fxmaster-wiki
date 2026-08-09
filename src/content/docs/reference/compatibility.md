---
title: Compatibility
description: Supported FXMaster and FXMaster+ versions, Levels compatibility, PSFX Ambience, hosting, and module-conflict considerations.
---

## Supported versions

| Module | Version |
|---|---|
| FXMaster | 8.3.4 |
| FXMaster+ | 1.1.11 |

FXMaster+ 1.1.11 supports Foundry VTT 13 and 14. FXMaster 8.3.2 or newer is required.

### FXMaster+

FXMaster is the core module and must be installed and enabled first. FXMaster+ is installed on top of FXMaster and adds its effects and features through the same controls.

## Levels

FXMaster supports Foundry's core Levels functionality in Foundry VTT V14. The Levels module used with Foundry VTT V13 is not supported.

## PSFX Ambience

FXMaster+ can create default SoundFX rules when the `psfx-ambience` module is installed and active. The default PSFX rules and reset option are not shown when the module is absent or inactive. The module is available through [PeriSFX on Patreon](https://www.patreon.com/PeriSFX).

## Hosting and assets

Custom particles and SoundFX files must be stored in a location the active Foundry host can browse. Hosted services may organize assets by source, bucket, or asset library, so select the appropriate hosted source and directory through Foundry’s file browser.

## Other visual modules

Modules that alter canvas groups, overhead Levels, fog/vision presentation, weather suppression, Regions, or tile masks can affect ordering and visibility. Reproduce a conflict in a minimal test world and compare Game Master and player views before identifying the source.

---
sidebar_position: 1
description: "Introduction to PlayerAnimationLibrary — the official successor to PlayerAnimator."
---

# Introduction

PlayerAnimationLibrary (PAL) is a library mod that lets your mod play and control animations on the player model.

## Why should I use this?

Here are a couple of the features the mod provides that you might find very useful:

- Provides an easy way to play JSON animations made in Blockbench **and** Blender, while allowing you to modify them using code.
- Enables smooth transitions between all animations.
- Has a priority system, so conflicts between two mods trying to animate the player at the same time can be resolved.
- Almost full [MoLang](./molang.md) support using [Mocha](https://unnamed.team/docs/mocha) — even stuff like arrow `->` operators and variables!

## Why should I use this over PlayerAnimator?

Well, this is the official successor to PlayerAnimator!

- PlayerAnimator will no longer receive any updates.
- PAL is capable of doing everything PlayerAnimator can, including loading all animations in the PlayerAnimator format.
- PAL has a ton of exclusive features and bug fixes, like the aforementioned MoLang support.

:::tip
Already using PlayerAnimator? See [How to port from PlayerAnimator](./gettingstarted/how_to_port_from_player_animator.md).
:::

## Where to start

1. [Add the library to your project](./gettingstarted/how_to_add_lib_to_mod.md)
2. [Play your first animation](./gettingstarted/how_to_play_animations.md)
3. [Modify animations with modifiers](./features/modifiers.md)

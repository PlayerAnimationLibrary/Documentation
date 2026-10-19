---
sidebar_position: 3
sidebar_label: "Porting from PlayerAnimator"
description: "Migration guide from PlayerAnimator to PlayerAnimationLibrary."
---

# How to port from PlayerAnimator

## The basics

The animations folder was moved from `assets/<mod_id>/player_animation` to `assets/<mod_id>/player_animations` late into PlayerAnimator's life, and PAL uses the new path as well.

In PlayerAnimator you use a `KeyframeAnimationPlayer` to play a `KeyframeAnimation`, but each `KeyframeAnimationPlayer` can only play one animation before having to be discarded, so you usually register an `AnimationLayer` or `ModifierLayer` to the player animation stack to hold the current animation player.

In PAL you can simply register a `PlayerAnimationController` and play animations using it, as shown in [How to play animations](./how_to_play_animations.md). You can even chain animations so they play back to back using the `PlayerRawAnimationBuilder` class!

An animation controller can also hold modifiers, so while the `AnimationLayer` and `ModifierLayer` classes still exist in PAL, you probably won't need them.

### TL;DR

| PlayerAnimator                                          | PAL                        |
|---------------------------------------------------------|----------------------------|
| `KeyframeAnimationPlayer`, `AnimationLayer`, `ModifierLayer` | `PlayerAnimationController` |
| `KeyframeAnimation`                                     | `Animation`                |

## Modifiers

First of all, modifiers now give you an instance of `PlayerAnimBone` instead of various vectors per bone, but I assume you will get the hang of that quickly. :)

All bone names are now in snake case, so for example `left_arm` instead of `leftArm`.

There are some other serious changes when it comes to the values in modifiers though, so here is a list:

- PlayerAnimator uses metres/blocks for body positions unlike all other bones, but PAL now uses pixels for it too, for the sake of consistency.
- The Y pos axis for every bone is negated except the body bone.
- The Y and X rot axes are negated for the body bone.
- The X and Z position and rotation axes are negated for capes.
- The Z and Y position and rotation axes are swapped for items.
- All the rotation and position axes are negated for items except the Y pos axis (previously the Z axis in PlayerAnimator).

All these changes are for achieving consistency between how all the different bones operate, more specifically consistency with how they work in Blockbench.

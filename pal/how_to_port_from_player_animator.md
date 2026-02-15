---
sidebar_position: 4
description: "Migration guide from PlayerAnimator to PlayerAnimationLibrary."
---

# How to port from player animator

## The basics
The animations folder was moved from `assets/<mod_id>/player_animation` to `assets/<mod_id>/player_animations` late into player animator's life and in PAL.  

In player animator you use a `KeyframeAnimationPlayer` to play a `KeyframeAnimation`, but each `KeyframeAnimationPlayer` can only play one animation before having to be discarded, so you usually register an `AnimationLayer` or `ModifierLayer` to the player animation stack to hold the current animation player.  

In PAL though you can simply register a `PlayerAnimationController` and play animations using it as shown in the how to play animations section. (You can even chain animations so they play back to back using the `PlayerRawAnimation` class!)  

An animation controller can also hold modifiers so while the `AnimationLayer` and `ModifierLayer` classes still exist in PAL you probably won't need them.  

TLDR:  
`KeyframeAnimationPlayer, AnimationLayer, ModifierLayer` -> `PlayerAnimationController`  
`KeyframeAnimation` -> `Animation`

## Modifiers
First of all modifiers now give you an instance of `PlayerAnimBone` instead of various vectors per bone, but I assume you will get the hang of that quickly. :)  
All bone names are now in snake case so for example `left_arm` instead of `leftArm`.  

There are some other serious changes when it comes to the values in modifiers though, so here is a list:  
* Player animator uses metres/block for body positions unlike all other bones, but PAL now also uses pixels for it for the sake of consistency
* The Y pos axis for every bone is negated except the body bone
* The Y and X rot axes are negated for the body bone
* The X and Z position and rotation axes are negated for capes
* The Z and Y position and rotation axes are swapped for items
* All the rotation and position axes are negated for items except the Y pos axis. (previously the Z axis on player animator)

All these changes are for achieving consistency between how all the different bones operate, more specifically consistency with how they work in Blockbench.
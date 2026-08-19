---
sidebar_position: 1
description: "Documentation on PAL modifiers."
---

# Modifiers

PAL has a unique feature called a modifier, which can be used to change things about an animation — mirror it, change its speed, or apply transformations to a specific [bone](./bones.md).

PAL offers many built-in modifiers, but you can also make your own. Both are covered on this page.

## Adding and removing modifiers

Modifiers can be added to an instance of the `AnimationController` or `ModifierLayer` class using the following methods:

- `addModifier`
- `addModifierBefore`
- `addModifierLast`

Modifiers run in order — the modifier with the lowest index runs first and has priority over all the other modifiers.

To remove them again, use:

- `removeModifier`
- `removeAllModifiers`
- `removeModifierIf`

:::warning
Modifiers last for the lifetime of the animation controller or modifier layer they're attached to unless removed.
Some modifiers can remove themselves, which is explained [below](#built-in-modifiers).
:::

## How to make your own modifier

In order to make your own modifier you need to make a class that extends the `AbstractModifier` class.
There you can override many methods in order to change how the animation is processed:

| Method            | Description                                                                                     |
|-------------------|-------------------------------------------------------------------------------------------------|
| `tick`            | Called every game tick, useful for keeping track of time.                                        |
| `setupAnim`       | Called every frame, useful for getting the tickDelta in order to make smooth translations.       |
| `get3DTransform`  | The most useful method — called for every [bone](./bones.md), including the [custom ones](./custom_bones.md), and gives you the bone so you can apply whatever translations you want to it. |
| `canRemove`       | If true, it will tell the host to remove the modifier.                                           |

:::warning
Don't forget to call `super` when you override a method!
Modifiers work by chaining: calling super calls the next modifier in line, and the last modifier calls the host.
If you don't call super, the host animation will never be called.
:::

:::note
All position translations are measured in pixels, and all rotations are measured in radians.
The axes work the same as in Blockbench, so forward is negative Z, right is positive X, and up is positive Y.
:::

You will also be able to access a variable called `host`, which is the animation controller or modifier layer hosting the modifier.
If you are sure your host is a controller, you can also use the `getController` method.

## Built-in modifiers

Here is a list of all the modifiers included with PAL by default and how they work.

### `AbstractFadeModifier`

Can be used to fade in or out of an animation.
It is made using a static method in the class rather than a constructor.
When fading in, the modifier removes itself when it's done, but not when fading out.

:::tip
You should usually use the `replaceAnimationWithFade` method in the host, rather than add this modifier yourself.
:::

### `SpeedModifier`

Multiplies the speed of the animation by the given value.
The value can be changed after the creation of the modifier.

### `AdjustmentModifier`

Can be used to apply specific translations to the desired bones.

### `MirrorModifier`

Mirrors the animation... (some of these modifiers are really self-explanatory!)
For example, if you have an animation that uses an item with the right arm, you can mirror it to use the left arm instead.

### `MirrorIfLeftHandModifier`

Same as the mirror modifier, but is only applied if the client sets its main hand to the left hand.

### `FirstPersonOffsetModifier`

Meant to be used with the first person follow camera mode turned on (read more [here](./first_person.md)).
Usually with that mode turned on the arms are out of frame, so this modifier raises the body up by the specified amount (or 1.92 pixels by default) only in first person, so the arms are in frame.

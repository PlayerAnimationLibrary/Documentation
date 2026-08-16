---
sidebar_position: 2
sidebar_label: "First person"
description: "How to animate the hand in first person."
---

# Animating the first person hand

## First person modes

You can set the first person mode in the controller by using the `setFirstPersonMode` function.
It takes an enum with four possible values:

| Value                | Description                                                                     |
|----------------------|---------------------------------------------------------------------------------|
| `NONE`               | Changes nothing.                                                                 |
| `VANILLA`            | Currently does nothing, left over from legacy stuff (might be implemented again later). |
| `THIRD_PERSON_MODEL` | This is where the fun begins — enables PAL first person animations.               |
| `DISABLED`           | Forces first person animation to be off, even when other animations are using it. |

The way `THIRD_PERSON_MODEL` mode works is that instead of animating the actual first person hands, it starts rendering parts of the third person model.
This may be disappointing to some, but thankfully there are options to make this look good!

## Tweaking first person animations

So great, now you have enabled first person animations! Here are a few things you can tweak about it.

### Mode configuration

The first thing you can change is the first person mode configuration, changed using the `setFirstPersonConfiguration` method.
It takes a `FirstPersonConfiguration` — a class with 5 booleans that lets you change three things: whether the arms, the held items and the armor are rendered.
The arms and the items are configured per hand:

| Field           | Default | Description                                |
|-----------------|---------|--------------------------------------------|
| `showRightArm`  | `false` | Whether the actual right arm is rendered.   |
| `showLeftArm`   | `false` | Whether the actual left arm is rendered.    |
| `showRightItem` | `true`  | Whether the item in the right hand is rendered. |
| `showLeftItem`  | `true`  | Whether the item in the left hand is rendered.  |
| `showArmor`     | `false` | Whether the armor is rendered.              |

Each field has a matching `setShowX` method that returns the configuration itself, so you can chain them:

```java
controller.setFirstPersonConfiguration(new FirstPersonConfiguration()
        .setShowRightArm(true)
        .setShowArmor(true));
```

### Following the camera

Then we have the follows camera config, set by the `setFirstPersonFollowsCamera` method.

It's pretty self-explanatory: by default the arms render where they are supposed to be in the world while in third person, but this makes them follow the camera and stay in frame at all times.

:::tip
When using this mode the hands will probably be too low down to be in frame, so you also want to use the `FirstPersonOffsetModifier` (read more [here](./modifiers.md)).
:::

### Transition length

Then we have the first person transition length, set by the `setFirstPersonTransitionLength` method.

When the value given is above zero, it makes it so that during the transition the vanilla first person arm slowly moves out of the frame before the PAL one appears.
The value is measured in ticks.

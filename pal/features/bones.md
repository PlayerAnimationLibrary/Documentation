---
sidebar_position: 4
description: "The bones PAL animates, what you can transform on them, and the bone classes."
---

# Bones

Every animation and every modifier works on **bones**.
A bone is just a name plus a set of transforms, and PAL registers one for each part of the player model.

## The player bones

| Bone         | Pivot (x, y, z) | Notes                                                        |
|--------------|-----------------|---------------------------------------------------------------|
| `head`       | 0, 24, 0        | Follows the torso bend.                                       |
| `body`       | 0, 12, 0        | The whole player — moving it moves everything.                |
| `torso`      | 0, 24, 0        | The upper body; this is the bone that bends.                   |
| `right_arm`  | 5, 22, 0        | Follows the torso bend.                                       |
| `left_arm`   | -5, 22, 0       | Follows the torso bend.                                       |
| `right_leg`  | 2, 12, 0        |                                                               |
| `left_leg`   | -2, 12, 0       |                                                               |
| `right_item` | 6, 12, -2       | The item held in the right hand.                              |
| `left_item`  | -6, 12, -2      | The item held in the left hand.                               |
| `cape`       | 0, 24, 2        | Follows the torso bend.                                       |
| `elytra`     | 0, 24, 2        |                                                               |

Pivots are in pixels, in the same axes as Blockbench: forward is negative Z, right is positive X, up is positive Y.

:::note
`body` and `torso` are not the same bone. `body` moves the entire player, `torso` is the upper half, and in animations converted from old PlayerAnimator versions the old `torso` bone is renamed to `body`.
:::

## Transforms

Each bone carries four things:

| Transform  | Type    | Unit                                                              |
|------------|---------|--------------------------------------------------------------------|
| `position` | vector  | Pixels.                                                            |
| `rotation` | vector  | Radians in code, degrees in animation files.                       |
| `scale`    | vector  | Multiplier, `1` means unchanged.                                   |
| `bend`     | float   | Radians in code, degrees in animation files.                       |

Bend is PAL's extra transform — it bends the bone in the middle instead of rotating it around its pivot, which is what makes a player fold at the waist rather than tip over.

When the animation has `applyBendToOtherBones` enabled, the bend of `torso` is also applied to the bones marked above as following the torso — `head`, `right_arm`, `left_arm` and `cape`.
In the Blockbench format that flag lives in the animation's extra data:

```json5
"my_animation": {
    "animation_length": 2,
    "player_animation_library": {
        "applyBendToOtherBones": true
    },
    "bones": {}
}
```

Animations converted from PlayerAnimator formats older than version 3 get it enabled automatically.

:::note
Bone names are normalised when an animation is loaded, so `leftArm` in a file becomes `left_arm`.
:::

## Bone classes

| Class                     | What it adds                                                                                          |
|---------------------------|---------------------------------------------------------------------------------------------------------|
| `PlayerAnimBone`          | The base: name, `position`, `rotation`, `scale`, `bend`, and helpers like `add`, `applyOtherBone`, `copyOtherBone`, `scale`, `setToInitialPose`. |
| `ToggleablePlayerAnimBone` | A per-axis on/off switch (`positionXEnabled`, `rotYEnabled`, `bendEnabled`, …), so an animation can leave an axis untouched instead of forcing it to zero. |
| `AdvancedPlayerAnimBone`  | Adds a per-axis transition length, used for the begin/end tick fades. The controller's own bones are these. |
| `PivotBone`               | A bone with a custom pivot point, created from the `model` section of an animation.                     |

The bone you receive in a modifier's `get3DTransform` is a `PlayerAnimBone`, so you can read and write all four transforms on it:

```java
@Override
public void get3DTransform(@NotNull PlayerAnimBone bone) {
    super.get3DTransform(bone);

    if (bone.getName().equals("right_arm")) {
        bone.rotation.x += Math.toRadians(15);
        bone.position.y += 2;
    }
}
```

:::warning
Disabled axes are skipped when a bone is copied with `copyOtherBoneIfNotDisabled`, so if your modifier writes to an axis the animation never touched, make sure the axis is enabled first.
:::

## Custom pivot bones

Animations can declare extra bones with their own pivot points and parent them to existing ones — this is how rigs add things like a tail or a prop.
PAL builds a `PivotBone` for each entry of the animation's `model` section and applies the parent hierarchy from its `parents` section every frame.

See [Custom Pivot Points/Bones](/emotecraft/creatingemotes/custom_pivot_points) for how to set them up in Blockbench and Blender, and [Custom bones and the camera](./custom_bones.md) for animating your own model parts with them.

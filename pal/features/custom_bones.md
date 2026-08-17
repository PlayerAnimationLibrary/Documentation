---
sidebar_position: 6
sidebar_label: "Custom bones & camera"
description: "How PAL drives the vanilla model parts, and how to animate your own model parts or the camera."
---

# Custom bones and the camera

All the APIs PAL uses to animate the player are available to you, so you can use them to animate custom player accessories or any other player related models.

## How the vanilla bones are animated

PAL does not replace the vanilla posing code, it runs **after** it.
At the end of `PlayerModel.setupAnim`, for every vanilla part, PAL does three things:

1. **Copies the current vanilla pose into a bone** with `RenderUtil.copyVanillaPart(part, bone)`, so an animation that doesn't touch an axis leaves the vanilla pose alone.
2. **Runs the animation stack** over that bone with `AvatarAnimManager.updatePart` → `get3DTransform(bone)`. Every layer, in priority order, gets a chance to read and overwrite the bone.
3. **Writes the result back** into the `ModelPart` with `RenderUtil.translatePartToBone(part, bone, initialPose)`.

The bone is matched to the animation purely **by name** — a controller applies its animation to a bone if it has a bone registered under that name (or a pivot bone from the animation itself).
Nothing else about the part matters, which is why the same mechanism works for parts PAL knows nothing about.

:::note
The conversion between the two coordinate spaces happens in those two helpers: PAL positions are in pixels and its Y axis is the opposite of the model part's, and the part's initial pose is subtracted on the way in and added back on the way out.
Use the helpers rather than assigning the values yourself.
:::

## Animating your own model part

Do the same three steps for your part while your model is being set up:

```java
private final PlayerAnimBone myBone = new PlayerAnimBone("my_mod_backpack");

public void setupAnim(Avatar avatar) {
    AvatarAnimManager manager = PlayerAnimationAccess.getPlayerAnimManager(avatar);
    if (!manager.isActive()) return;

    RenderUtil.copyVanillaPart(this.backpack, myBone);
    manager.updatePart(this.backpack, myBone);
}
```

Keep the `PlayerAnimBone` around instead of creating one every frame, exactly like PAL does for the vanilla parts.

:::warning
`bend` is not applied by `translatePartToBone` — a vanilla `ModelPart` has nothing to bend. If your part needs to bend, you have to apply `bone.bend` yourself while rendering.
:::

## Making the bone exist

A bone name only does something if some animation actually animates it. There are two ways to get there.

### Register the bone on the controller

```java
controller.registerPlayerAnimBone("my_mod_backpack");
```

From then on, any animation played by that controller that has a `my_mod_backpack` bone channel will drive it.
This is exactly what PAL itself does for the player bones in `HumanoidAnimationController.registerBones`.

### Declare it in the animation

An animation can bring its own bones with it, through the `model` and `parents` sections:

```json5
"my_animation": {
    "animation_length": 2,
    "model": {
        "my_mod_backpack": { "pivot": [0, 20, 2] }
    },
    "parents": {
        "my_mod_backpack": "torso"
    },
    "bones": {
        "my_mod_backpack": {
            "rotation": { "vector": [10, 0, 0] }
        }
    }
}
```

PAL creates a `PivotBone` for every entry of `model`, so the bone works without being registered on the controller, and `parents` makes it follow another bone.
This is the same mechanism as [custom pivot points](/emotecraft/creatingemotes/custom_pivot_points) in emotes.

:::warning
Give the bone a `parents` entry even if it hangs off the body, not just a `model` entry.
A pivot bone that has no parent is animated, but it is never added to the controller's active bones, so reading it back the way the next section describes returns nothing.
:::

## Reading a bone without a model part

If you are not posing a `ModelPart` — you want to place a particle, aim something, or drive the camera — ask the animation stack for the bone directly:

```java
AvatarAnimManager manager = PlayerAnimationAccess.getPlayerAnimManager(avatar);
if (!manager.isActive()) return;

PlayerAnimBone bone = manager.get3DTransform(new PlayerAnimBone("head"));
// bone.position is in pixels, bone.rotation is in radians
```

The bone you get back starts from zero, so what you read is the animation's contribution alone, without the vanilla pose.

:::note
PAL bones don't account for the initial poses of model parts — every bone starts from `(0, 0, 0)`.
That is why the vanilla parts are posed through `copyVanillaPart` and `translatePartToBone`, which add the initial pose back.
:::

## The camera

:::warning
PAL does **not** animate the camera — there is no camera hook to register into yet.
:::

What you can do is drive the camera yourself from a bone, since reading one is just the snippet above:

1. Register a bone for it, or have the animation declare one — a `camera` bone in the animation's `model` section is the tidiest option, because then the animator controls it like any other bone.
2. Read it every frame while the camera is being positioned, wherever your loader lets you do that.
3. Convert the values: divide `bone.position` by `16` to get blocks, and use `bone.rotation` as radians. `RenderUtil.translateMatrixToBone` does exactly this conversion if you are working with a `PoseStack`.

```java
PlayerAnimBone camera = manager.get3DTransform(new PlayerAnimBone("camera"));

double x = camera.position.x / 16d;
double y = camera.position.y / 16d;
double z = camera.position.z / 16d;
```

:::note
Check `manager.isActive()` before applying anything, and fall back to the vanilla camera when no animation is playing — otherwise the camera stays stuck wherever the last frame left it.
:::

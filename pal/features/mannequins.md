---
sidebar_position: 5
description: "Animating mannequins and other non-player things with PAL."
---

# Mannequins and other entities

PAL does not animate players specifically — it animates **avatars**.
`Avatar` is the vanilla type that both the player and the mannequin are, so on Minecraft versions that have mannequins your animations work on them without any extra code.

## What you get for free

Layers registered through `PlayerAnimationFactory.ANIMATION_DATA_FACTORY.registerFactory` are created for **every** avatar, mannequins included, and so is `PlayerAnimationAccess.REGISTER_ANIMATION_EVENT`.
Getting a layer works the same way:

```java
Avatar avatar = ...; // a player or a mannequin
PlayerAnimationController controller = (PlayerAnimationController) PlayerAnimationAccess.getPlayerAnimationLayer(
        avatar, ANIMATION_LAYER_ID);
controller.triggerAnimation(animationID);
```

`PlayerAnimationController.getAvatar()` gives you the `Avatar` back, so if you need something that only players have, check the type first:

```java
if (controller.getAvatar() instanceof AbstractClientPlayer player) {
    // player-only logic
}
```

:::warning
Your factory runs for mannequins too, so a controller written back when only players existed will get one.
If its state handler, its modifiers or its MoLang queries assume the avatar is a player and cast to one, that is a crash rather than a missing animation — do the check above rather than casting.
:::

## MoLang on mannequins

The [built-in MoLang queries](../molang.md) run on the avatar, so they work on mannequins too, and the player-specific ones fall back to a sensible default:

- `has_cape` reads the cape of both players and mannequins.
- `player_level` returns `0` on a mannequin.
- `is_first_person` is only ever true for the local player, so it stays `0`.

## Anything that isn't an avatar

Automatic wiring stops at avatars — mobs, block entities and your own models never get an `AvatarAnimManager`.
The animation engine itself doesn't care, though: the whole `core` module has no Minecraft classes in it at all, and neither `AnimationController` nor `HumanoidAnimationController` wants an entity — a state handler and a MoLang engine is the whole requirement.

So you can animate anything, as long as you do the three things PAL normally does for you:

1. **Construct the controller** yourself and keep it wherever your entity or block entity data lives. `HumanoidAnimationController` if your model has the player bones, or `AnimationController` with your own `registerBones` if it doesn't.
2. **Drive it** — call `tick` once per game tick and `setupAnim` once per frame with an `AnimationData` you build from your own velocity and partial tick.
3. **Apply the bones** to your model the same way [custom bones](./custom_bones.md) describes: `get3DTransform` to read a bone out of the controller, and `RenderUtil.copyVanillaPart` and `RenderUtil.translatePartToBone` to move a model part with it.

:::warning
Don't hand it the default MoLang engine. The built-in queries cast the controller to `PlayerAnimationController` when they're read, so an animation using something like `q.is_on_fire` on a non-player controller throws a `ClassCastException` at evaluation time.
The controller constructor takes the engine factory, so pass one built with `MolangLoader.createBaseEngine` and register whatever queries make sense for your thing.
:::

## Testing

PAL registers a client command for playing an animation on a mannequin:

```
/testMannequin <animationID> <mannequin UUID>
```

There are matching commands for the local player — `/testPlayerAnimation <animationID>` — and for round-tripping an animation through the binary format: `/testAnimationBinary <animationID> <version>` and `/testLegacyAnimationBinary <animationID> <version>`.

:::note
On Fabric these commands only exist in a development environment or when running a `dev` build of PAL.
:::

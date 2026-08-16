---
sidebar_position: 5
description: "Animating mannequins with PAL, not just players."
---

# Mannequins

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

## MoLang on mannequins

The [built-in MoLang queries](../molang.md) run on the avatar, so they work on mannequins too, and the player-specific ones fall back to a sensible default:

- `has_cape` reads the cape of both players and mannequins.
- `player_level` returns `0` on a mannequin.
- `is_first_person` is only ever true for the local player, so it stays `0`.

## Testing

PAL registers a client command for playing an animation on a mannequin:

```
/testMannequin <animationID> <mannequin UUID>
```

There are matching commands for the local player — `/testPlayerAnimation <animationID>` — and for round-tripping an animation through the binary format: `/testAnimationBinary <animationID> <version>` and `/testLegacyAnimationBinary <animationID> <version>`.

:::note
On Fabric these commands only exist in a development environment or when running a `dev` build of PAL.
:::

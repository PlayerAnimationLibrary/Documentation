---
sidebar_position: 2
description: "How to register animation layers and play animations with PAL."
---

# How to play animations

## Registering an animation layer

Before you can play anything, you need to register an animation layer for every player:

```java
PlayerAnimationFactory.ANIMATION_DATA_FACTORY.registerFactory(ANIMATION_LAYER_ID, 1000,
        player -> new PlayerAnimationController(player,
                (controller, state, animSetter) -> PlayState.STOP
        )
);
```

- `ANIMATION_LAYER_ID` is the `ResourceLocation`/`Identifier` of your layer.
- The number after it is the priority of your layer:

| Priority | Used for                                  |
|----------|-------------------------------------------|
| Very low | Idle animations                           |
| 1000     | Cosmetic stuff like emotes                |
| 1500+    | Important gameplay animations             |

:::warning
On Fabric you register controllers in your mod's client init class.
On NeoForge you **MUST** use the `enqueueWork` method of the `FMLClientSetupEvent` event!!!
:::

## Playing an animation

Here is how to get an animation layer and play an animation for a specific player:

```java
PlayerAnimationController controller = (PlayerAnimationController) PlayerAnimationAccess.getPlayerAnimationLayer(
        player, ANIMATION_LAYER_ID);
controller.triggerAnimation(animationID);
```

That's the most basic way to do it. `triggerAnimation` returns `false` and logs an error if no animation with that id exists.

## The state handler

The lambda you passed to the controller is its **state handler**, and it runs every frame:

```java
(controller, state, animSetter) -> {
    if (state.isMoving()) return animSetter.setAnimation(WALK_ANIMATION);

    return PlayState.STOP;
}
```

- Return `PlayState.CONTINUE` to keep playing whatever is playing.
- Return `PlayState.STOP` to stop all animations on this layer until the handler returns `CONTINUE` again.
- Call `animSetter.setAnimation(rawAnimation)` (optionally with a start tick) to set an animation and get a `PlayState` back.
- The `state` is an `AnimationData` and carries `getPartialTick()`, `getVelocity()`, `isMoving()` and `isFirstPersonPass()`.

Animations triggered with `triggerAnimation` are played on top of this, so a handler that always returns `STOP` is perfectly normal for a layer that only plays triggered animations.

## Chaining animations

`PlayerRawAnimationBuilder` builds a `RawAnimation` out of several animations that play back to back:

```java
RawAnimation animation = PlayerRawAnimationBuilder.begin()
        .thenPlay(DRAW_ANIMATION)
        .thenWait(10)
        .thenLoop(HOLD_ANIMATION)
        .build();

controller.triggerAnimation(animation);
```

| Method                          | What it does                                                        |
|---------------------------------|----------------------------------------------------------------------|
| `thenPlay(id)`                  | Plays the animation with its own loop type.                          |
| `thenLoop(id)`                  | Plays it looping.                                                    |
| `thenPlayAndHold(id)`           | Plays it and holds the last frame.                                   |
| `thenPlayXTimes(id, count)`     | Plays it `count` times.                                              |
| `thenWait(ticks)`               | Waits for the given number of ticks.                                 |
| `then(id, loopType)`            | Plays it with an explicit loop type.                                 |

The loop types are:

| Loop type             | Behaviour                                                                    |
|-----------------------|-------------------------------------------------------------------------------|
| `DEFAULT`             | Uses the loop type stored in the animation file.                              |
| `PLAY_ONCE`           | Plays once and moves on.                                                      |
| `LOOP`                | Repeats forever.                                                              |
| `HOLD_ON_LAST_FRAME`  | Pauses the controller on the last frame.                                      |
| `returnToTickLoop(t)` | Loops, but restarts from tick `t` instead of the beginning.                   |

You can also implement `LoopType` yourself to decide per playthrough whether the animation repeats and where it restarts from.

## Fading between animations

Instead of cutting straight to a new animation, fade into it:

```java
controller.replaceAnimationWithFade(
        AbstractFadeModifier.standardFadeIn(5, EasingType.EASE_IN_OUT_SINE),
        newAnimationID);
```

The fade length is in ticks. `AbstractFadeModifier` also offers `standardFadeOut`, `functionalFadeIn`, `functionalFadeOut` and the generic `standardFade`/`functionalFade`, which take a `FadeType`.
The overloads with a `fadeFromNothing` flag control whether the fade also happens when nothing is playing yet.

## Controlling playback

| Method                                     | What it does                                                             |
|--------------------------------------------|---------------------------------------------------------------------------|
| `stop()`                                   | Stops the current animation.                                              |
| `pause()` / `unpause()`                    | Freezes and resumes the animation.                                        |
| `stopTriggeredAnimation()`                 | Stops only the triggered animation.                                       |
| `forceAnimationReset()`                    | Restarts the current animation from the beginning.                        |
| `isActive()` / `getAnimationState()`       | Whether it is animating; the state is `RUNNING`, `PAUSED` or `STOPPED`.   |
| `hasAnimationFinished()`                   | Whether the current animation has played through.                          |
| `getAnimationTime()` / `getAnimationTicks()` | How long the current animation has been playing, in seconds and in ticks. |
| `getCurrentAnimation()` / `getCurrentRawAnimation()` | What is playing right now.                                       |

To change the playback speed, add a [`SpeedModifier`](../features/modifiers.md) — `getAnimationSpeed()` reports the speed all the modifiers on the controller add up to.

## Where to put your animations

You should put your animations in `assets/<namespace>/player_animations`.

The `animationID` of your animation is a `ResourceLocation`/`Identifier` where the namespace is your mod's namespace and the path is the name of the animation set in the animation file.

:::note
The name of the file itself has nothing to do with what the ID will be.
:::

---
sidebar_position: 3
sidebar_label: "Keyframe events"
description: "Reacting to sound, particle and custom instruction keyframes in animations."
---

# Keyframe events

Besides moving bones, an animation can carry **effect keyframes** — points in time that fire an event instead of transforming something.
PAL never plays a sound or spawns a particle on its own (with one exception, see below); it hands the keyframe to you and you decide what happens.

There are three kinds of them, and they all come from the animation file:

| Kind               | JSON object        | Data you get                                            |
|--------------------|--------------------|----------------------------------------------------------|
| Sound              | `sound_effects`    | `effect` → `getSound()`                                  |
| Particle           | `particle_effects` | `effect`, `locator`, `pre_effect_script` → `getEffect()`, `getLocator()`, `script()` |
| Custom instruction | `timeline`         | the string or array of strings → `getInstructions()`     |

```json5
{
    "animation_length": 2,
    "sound_effects": {
        "0.5": { "effect": "minecraft:entity.player.levelup" }
    },
    "particle_effects": {
        "1.0": { "effect": "minecraft:flame", "locator": "right_item", "pre_effect_script": "" }
    },
    "timeline": {
        "1.5": "my_mod:spawn_shockwave"
    },
    "bones": {}
}
```

The keys are timestamps in **seconds**, the same as everywhere else in the Blockbench format, and PAL converts them to ticks when loading.
Every keyframe fires **once per playthrough** — it is remembered until the animation restarts or the controller resets.

:::note
Blockbench writes these three objects for you when you add sound, particle and timeline keyframes to an animation.
:::

## Handling them

Every kind has an event on `CustomKeyFrameEvents`:

```java
CustomKeyFrameEvents.CUSTOM_INSTRUCTION_KEYFRAME_EVENT.register((animationTick, controller, keyframeData, animationData) -> {
    if (!"my_mod:spawn_shockwave".equals(keyframeData.getInstructions())) return EventResult.PASS;

    // do your thing
    return EventResult.SUCCESS;
});
```

The same shape works for `SOUND_KEYFRAME_EVENT` and `PARTICLE_KEYFRAME_EVENT`.

A handler returns an `EventResult`:

| Result    | Meaning                                                                             |
|-----------|--------------------------------------------------------------------------------------|
| `PASS`    | Not interested — the next listener gets a shot at the keyframe.                       |
| `SUCCESS` | Handled — the other listeners of the event still run, but see the note below.          |
| `FAIL`    | Stop — no further listeners run, and the rest of the keyframes are skipped this pass. |

If you only care about a single controller, set a handler on it directly instead of listening globally:

```java
controller.setSoundKeyframeHandler((animationTick, ctrl, keyframeData, animationData) -> ...);
controller.setParticleKeyframeHandler(...);
controller.setCustomInstructionKeyframeHandler(...);
```

The controller's own handler runs **first**, and the global event only runs if it returned `PASS` — so returning `SUCCESS` there is how you keep other mods' listeners out of your controller's keyframes.

## Playing sounds automatically

PAL registers `AutoPlayingSoundKeyframeHandler` on `SOUND_KEYFRAME_EVENT` by default, so sound keyframes already play without any code on your side.
It expects the effect string to be a sound id, optionally followed by a volume and a pitch:

```
namespace:soundid
namespace:soundid|volume|pitch
```

The sound is played at the avatar's position in the `PLAYERS` sound source, and both volume and pitch default to `1`.
If the id can't be parsed or isn't in the sound registry, the handler returns `PASS` and leaves the keyframe to your listeners.

## Reset event

`CustomKeyFrameEvents.RESET_KEYFRAMES_EVENT` fires when a controller clears the keyframes it has already executed — when an animation restarts, loops or is replaced.
It gives you the controller and the set of keyframes that had fired, which is handy for stopping something you started in a keyframe:

```java
CustomKeyFrameEvents.RESET_KEYFRAMES_EVENT.register((controller, executedKeyFrames) -> {
    // the keyframes in executedKeyFrames are about to be able to fire again
});
```

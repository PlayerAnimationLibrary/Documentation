---
sidebar_position: 7
description: "Using MoLang in an emote: what it is, where to write it, and worked examples."
---

# MoLang

Every value in an emote is normally a fixed number you set on a keyframe.
MoLang lets you write a little formula in place of that number, and the game solves it on every single frame while the emote plays.

That's how an emote reacts to what's going on — like how long it has been playing, whether the player is sneaking, what time it is in the world — and how you build movement that would be miserable to keyframe by hand.

You don't need to know how to code. A MoLang expression is one line of maths.

## Where you write it

Anywhere a keyframe takes a number, you can put an expression instead — in Blockbench, type it into the keyframe's X, Y or Z field. In the emote file it ends up as a string:

```json5
"rotation": {
    "vector": [0, "q.anim_time * 20", 0]
}
```

:::warning
The old Emotecraft format — a `.json` with an `emote` object instead of `animations` — only understands plain numbers.
MoLang works in emotes made in [Blockbench](./blockbench.md) or [Blender](./blender.md).
:::

## Your first expression

`q.anim_time` is how long the emote has been playing, in seconds. On its own it counts up: `0.5`, `1.0`, `1.5`…

Put it in the body's Y rotation and multiply it:

```json5
"body": {
    "rotation": {
        "vector": [0, "q.anim_time * 20", 0]
    }
}
```

The body now turns 20 degrees every second, forever, and you never placed a second keyframe.
Make the number bigger to spin faster, negative to spin the other way.

## Making something wave

Multiplying by time grows forever. To make a value go back and forth, use a sine wave:

```
math.sin(q.anim_time * 200) * 30
```

Read it right to left: `math.sin` swings smoothly between `-1` and `1`, `* 30` stretches that to `-30`–`30` degrees, and the `200` inside controls how fast it swings.

Drop that into an arm's Z rotation and the arm waves. Change `30` for how far it swings, change `200` for how quickly.

## Reacting to the player

`q.` values are things the game tells you about the player. They cost you nothing to read:

```
q.is_sneaking ? 20 : 0
```

That means *if the player is sneaking, use 20, otherwise use 0*. Yes-or-no values like `q.is_sneaking` are just `1` and `0`, and `? :` picks between two options.

You can combine the two ideas — wave only while sneaking:

```
q.is_sneaking ? math.sin(q.anim_time * 200) * 30 : 0
```

There are around seventy of these values, from `q.health` and `q.is_on_fire` to `q.moon_phase`.

## Reusing a value

If the same piece of maths shows up in several places, give it a name with `v.`, separate the steps with `;`, and hand back the final value with `return`:

```
v.wave = math.sin(q.anim_time * 200); return v.wave * 30;
```

Names you make up live in `v.` and stick around for as long as the emote plays, so a value you set on one bone can be read on another.

## Things that trip people up

- **Rotations are in degrees**, exactly like a normal keyframe value. `90` is a quarter turn, not `1.57`.
- **A misspelled query is silently `0`.** Nothing warns you — the bone just sits there. If an expression does nothing at all, check the spelling first.
- **It's a string.** In the file the expression goes in quotes; a bare number doesn't.
- **It runs every frame**, so what you write is a description of the pose at *this instant*, not a sequence of steps.

## Everything else

The full list — every `q.` value, every `math.` function, and the easing functions — lives on the [PAL MoLang page](/pal/molang), because the library is what actually runs it.

Emotecraft implements all of Bedrock's MoLang queries and functions, so [the Bedrock MoLang documentation](https://bedrock.dev/docs/stable/Molang) applies too.

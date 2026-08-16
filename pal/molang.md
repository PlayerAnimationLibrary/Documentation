---
sidebar_position: 4
description: "MoLang in PAL: syntax, built-in queries, math functions and how to register your own queries."
---

# MoLang

PAL evaluates MoLang with [mochafloats](https://github.com/PlayerAnimationLibrary/mochafloats), a fork of [Mocha](https://unnamed.team/docs/mocha) that computes with floats instead of doubles.
Almost all of Bedrock MoLang's functionality is present, and all MoLang queries and functions have been implemented — [here is the full documentation for Bedrock MoLang](https://bedrock.dev/docs/stable/Molang).

MoLang lets you compute a keyframe value while the animation plays instead of baking it into keyframes, so you can react to the player's state or build motion that never repeats itself.

Every animation controller creates its own MoLang engine, so `variable`/`v` values live as long as the controller and are shared between all animations it plays, but never leak into another player's controller.

:::info
Emotecraft runs on PAL, so everything on this page applies to emotes as well — see [Creating Emotes With Blockbench](/emotecraft/creatingemotes/blockbench).
:::

## Where you can use MoLang

MoLang expressions are written as **strings** inside the keyframe vectors of Blockbench/Bedrock format animations:

```json5
{
    "format_version": "1.8.0",
    "animations": {
        "molang_test": {
            "animation_length": 5,
            "bones": {
                "body": {
                    "rotation": {
                        "vector": [0, "math.sin(q.anim_time * 50) * 45", 0]
                    }
                },
                "right_arm": {
                    "position": {
                        "vector": [0, "q.is_on_fire ? 5 : 0", 0]
                    }
                }
            }
        }
    }
}
```

Each of the three components of a `vector` can be either a number or a MoLang string, and it is re-evaluated every frame.

:::warning
The PlayerAnimator/Emotecraft JSON format (the one with an `emote` object instead of `animations`) reads keyframe values as plain numbers — MoLang is **not** supported there.
:::

:::note
Rotation and bend values are written in **degrees**, exactly like plain numeric keyframes — PAL converts the result of the expression to radians for you.
Positions and scales are used as-is.
:::

## Syntax

Everything in MoLang evaluates to a number; booleans are just `1` and `0`.

| Scope           | Alias | Description                                                                              |
|-----------------|-------|------------------------------------------------------------------------------------------|
| `query`         | `q`   | Read-only values provided by PAL and by mods. See [Built-in queries](#built-in-queries).  |
| `variable`      | `v`   | Your own values, kept for the lifetime of the animation controller.                       |
| `temp`          | `t`   | Your own values, discarded after the expression finishes.                                 |
| `math`          | —     | Math functions and constants. See [Math functions](#math-functions).                      |

Names are case-insensitive, and both the full name and the alias always point at the same thing.

Supported operators: `+` `-` `*` `/`, `!` `&&` `||`, `<` `<=` `>` `>=` `==` `!=`, `=` (assignment), `? :` (ternary), `??` (null coalescing), `->` (arrow), `.` (member access), `[]` (array access), `()`, `{}`, `,`, `;`.
The keywords `true`, `false`, `return`, `break` and `continue` are supported, as well as the `loop(count, expression)` and `for_each(variable, array, expression)` functions.

:::note
There is no `%` operator — use `math.mod(a, b)` instead.
:::

Multi-statement expressions have to end with a `return`:

```json5
"vector": [0, "v.angle = q.anim_time * 20; return math.sin(v.angle) * 45;", 0]
```

## Built-in queries

These two are available on every controller, even outside Minecraft:

| Query              | Description                                                        |
|--------------------|--------------------------------------------------------------------|
| `anim_time`        | Time in **seconds** since the current animation started.            |
| `controller_speed` | The current animation speed of the controller.                      |

The rest are registered by PAL itself and read from the **avatar** — the player (or mannequin) the controller is animating.
Every query returning a yes/no answer evaluates to `1` or `0`.

### Time and world

| Query              | Description                                                                                  |
|--------------------|-----------------------------------------------------------------------------------------------|
| `day`              | The world's game time in days (game time / 24000).                                            |
| `time_of_day`      | The world's clock time in days, so `0.0` is the start of a day and `1.0` is the end of it.     |
| `time_stamp`       | The world's game time in ticks.                                                                |
| `moon_phase`       | The index of the current moon phase.                                                           |
| `moon_brightness`  | The star/moon brightness at the avatar's position.                                             |
| `frame_alpha`      | The partial tick of the frame being rendered (`0.0`–`1.0`).                                    |
| `life_time`        | Like `anim_time`, but `0` while the controller is not active.                                  |
| `actor_count`      | How many entities the client is currently rendering.                                           |
| `distance_from_camera` | Distance in blocks between the camera and the avatar.                                      |
| `is_first_person`  | Whether the avatar is the local player and the camera is in first person.                       |

### Position and movement

| Query                  | Description                                                                                       |
|------------------------|----------------------------------------------------------------------------------------------------|
| `body_x_rotation`      | The avatar's view pitch, interpolated with the partial tick.                                        |
| `body_y_rotation`      | The avatar's body yaw, interpolated with the partial tick.                                          |
| `head_x_rotation`      | The avatar's head pitch, interpolated with the partial tick.                                        |
| `head_y_rotation`      | The avatar's head yaw, interpolated with the partial tick.                                          |
| `yaw_speed`            | How much the yaw changed since the last tick.                                                       |
| `ground_speed`         | Horizontal speed in blocks per tick.                                                                |
| `vertical_speed`       | Vertical (Y) speed in blocks per tick.                                                              |
| `is_moving`            | Whether the animation data considers the avatar to be moving.                                        |
| `movement_direction`   | The direction the avatar is moving in as a direction id, or `6` when it isn't moving.                |
| `cardinal_facing`      | The direction the avatar is facing as a direction id.                                                |
| `cardinal_facing_2d`   | Same as `cardinal_facing`, but returns `6` for up and down.                                          |
| `cardinal_player_facing` | The direction the avatar is facing as the ordinal of the direction.                                |
| `limb_swing`           | The position of the vanilla walk animation.                                                          |
| `limb_swing_amount`    | The speed of the vanilla walk animation at the current partial tick.                                 |
| `is_on_ground`         | Whether the avatar is standing on the ground.                                                        |
| `is_sneaking`          | Whether the avatar is crouching.                                                                     |
| `is_sprinting`         | Whether the avatar is sprinting.                                                                     |
| `is_swimming`          | Whether the avatar is swimming.                                                                      |
| `is_wall_climbing`     | Whether the avatar is on a climbable block.                                                          |
| `sleep_rotation`       | The Y rotation of the bed the avatar is sleeping in, or `0`.                                         |
| `is_sleeping`          | Whether the avatar is sleeping.                                                                      |

Direction ids are the vanilla ones: `0` down, `1` up, `2` north, `3` south, `4` west, `5` east.

### State

| Query                | Description                                                                        |
|----------------------|-------------------------------------------------------------------------------------|
| `health`             | The avatar's current health.                                                        |
| `max_health`         | The avatar's maximum health.                                                        |
| `hurt_time`          | Ticks left of the hurt animation, or `0`.                                           |
| `invulnerable_ticks` | Ticks left of invulnerability, or `0`.                                              |
| `death_ticks`        | Ticks since the death animation started, or `0`.                                    |
| `is_alive`           | Whether the avatar is alive.                                                        |
| `is_baby`            | Whether the avatar is a baby.                                                       |
| `is_angry`           | Whether the avatar is an angry neutral mob.                                         |
| `is_breathing`       | Whether the avatar's air supply is full.                                            |
| `is_on_fire`         | Whether the avatar is on fire.                                                      |
| `is_fire_immune`     | Whether the avatar's entity type is immune to fire.                                 |
| `is_invisible`       | Whether the avatar is invisible.                                                    |
| `is_silent`          | Whether the avatar is silent.                                                       |
| `is_in_water`        | Whether the avatar is in water.                                                     |
| `is_in_lava`         | Whether the avatar is in lava.                                                      |
| `is_in_water_or_rain` | Whether the avatar is in water or being rained on.                                 |
| `is_in_contact_with_water` | Same as `is_in_water_or_rain`.                                                |
| `has_collision`      | Whether the avatar collides with blocks.                                            |
| `has_gravity`        | Whether gravity applies to the avatar.                                              |
| `scale`              | The avatar's scale.                                                                 |
| `player_level`       | The player's experience level, or `0` for non-players.                              |
| `get_actor_info_id`  | The avatar's entity network id.                                                     |

### Equipment and items

| Query                          | Description                                                                     |
|--------------------------------|----------------------------------------------------------------------------------|
| `blocking`                     | Whether the avatar is blocking.                                                  |
| `is_using_item`                | Whether the avatar is using an item.                                             |
| `main_hand_item_use_duration`  | How long the main hand item has been used, in seconds, or `0`.                    |
| `main_hand_item_max_duration`  | The full use duration of the main hand item, in ticks.                           |
| `equipment_count`              | How many armor slots are filled.                                                 |
| `has_head_gear`                | Whether something is worn in the head slot.                                      |
| `has_cape`                     | Whether the avatar's skin has a cape.                                            |
| `is_saddled`                   | Whether the avatar has something in the saddle slot.                             |

### Riding

| Query                    | Description                                                        |
|--------------------------|---------------------------------------------------------------------|
| `is_riding`              | Whether the avatar is riding something.                             |
| `has_rider`              | Whether something is riding the avatar.                             |
| `has_player_rider`       | Whether a player is riding the avatar.                              |
| `has_owner`              | Whether the avatar is an ownable entity that has an owner.          |
| `is_leashed`             | Whether the avatar is leashed.                                      |
| `rider_body_x_rotation`  | The pitch of the first passenger's body, or `0`.                    |
| `rider_body_y_rotation`  | The yaw of the first passenger's body, or `0`.                      |
| `rider_head_x_rotation`  | The pitch of the first passenger's head, or `0`.                    |
| `rider_head_y_rotation`  | The yaw of the first passenger's head, or `0`.                      |

## Math functions

All the standard MoLang math functions are available.

:::note
`math.sin` and `math.cos` take **degrees**, and `math.asin`, `math.acos`, `math.atan` and `math.atan2` return **degrees**.
:::

| Function                          | Description                                                                     |
|-----------------------------------|----------------------------------------------------------------------------------|
| `math.abs(value)`                 | Absolute value.                                                                  |
| `math.acos(value)`                | Arc cosine, in degrees.                                                          |
| `math.asin(value)`                | Arc sine, in degrees.                                                            |
| `math.atan(value)`                | Arc tangent, in degrees.                                                         |
| `math.atan2(y, x)`                | Arc tangent of `y/x`, in degrees.                                                |
| `math.ceil(value)`                | Rounds up.                                                                       |
| `math.clamp(value, min, max)`     | Clamps the value between `min` and `max`.                                        |
| `math.copy_sign(value, sign)`     | The magnitude of `value` with the sign of `sign`.                                |
| `math.cos(degrees)`               | Cosine of an angle in degrees.                                                   |
| `math.sin(degrees)`               | Sine of an angle in degrees.                                                     |
| `math.d2r(degrees)`               | Converts degrees to radians.                                                     |
| `math.r2d(radians)`               | Converts radians to degrees.                                                     |
| `math.die_roll(num, low, high)`   | Sum of `num` random rolls between `low` and `high`.                              |
| `math.die_roll_integer(num, low, high)` | Same, but with whole numbers.                                              |
| `math.exp(value)`                 | `e` raised to the given power.                                                   |
| `math.ln(value)`                  | Natural logarithm.                                                               |
| `math.floor(value)`               | Rounds down.                                                                     |
| `math.round(value)`               | Rounds to the nearest whole number.                                              |
| `math.trunc(value)`               | Drops the fractional part.                                                       |
| `math.hermite_blend(t)`           | `3t² - 2t³`, a smooth 0→1 curve.                                                 |
| `math.inverse_lerp(start, end, value)` | Where `value` sits between `start` and `end`, as `0.0`–`1.0`.               |
| `math.lerp(start, end, t)`        | Interpolates between `start` and `end`.                                          |
| `math.lerprotate(start, end, t)`  | Interpolates between two angles in degrees, taking the shortest way around.       |
| `math.min_angle(degrees)`         | Wraps an angle into the `-180`–`180` range.                                      |
| `math.max(a, b)`                  | The bigger of the two values.                                                    |
| `math.min(a, b)`                  | The smaller of the two values.                                                   |
| `math.mod(a, b)`                  | Remainder of `a / b`.                                                            |
| `math.pow(a, b)`                  | `a` raised to the power of `b`.                                                  |
| `math.sqrt(value)`                | Square root.                                                                     |
| `math.random(min, max)`           | Random value between `min` and `max`.                                            |
| `math.random_integer(min, max)`   | Random whole number between `min` and `max`.                                     |
| `math.sign(value)`                | `-1`, `0` or `1` depending on the sign of the value.                             |
| `math.pi`                         | The constant π.                                                                  |
| `math.e`                          | The constant e.                                                                  |

### Easing functions

On top of the standard functions, PAL exposes every easing type as `math.ease_*(start, end, t)`, where `t` goes from `0.0` to `1.0`:

```json5
"vector": [0, "math.ease_out_bounce(0, 90, q.anim_time / 2)", 0]
```

All of them exist in `ease_in_`, `ease_out_` and `ease_in_out_` flavours:

| Family                                                    | Functions                                                                 |
|-----------------------------------------------------------|---------------------------------------------------------------------------|
| Sine                                                      | `math.ease_in_sine`, `math.ease_out_sine`, `math.ease_in_out_sine`         |
| Quadratic                                                 | `math.ease_in_quad`, `math.ease_out_quad`, `math.ease_in_out_quad`         |
| Cubic                                                     | `math.ease_in_cubic`, `math.ease_out_cubic`, `math.ease_in_out_cubic`      |
| Quartic                                                   | `math.ease_in_quart`, `math.ease_out_quart`, `math.ease_in_out_quart`      |
| Quintic                                                   | `math.ease_in_quint`, `math.ease_out_quint`, `math.ease_in_out_quint`      |
| Exponential                                               | `math.ease_in_expo`, `math.ease_out_expo`, `math.ease_in_out_expo`         |
| Circular                                                  | `math.ease_in_circ`, `math.ease_out_circ`, `math.ease_in_out_circ`         |
| Back                                                      | `math.ease_in_back`, `math.ease_out_back`, `math.ease_in_out_back`         |
| Elastic                                                   | `math.ease_in_elastic`, `math.ease_out_elastic`, `math.ease_in_out_elastic` |
| Bounce                                                    | `math.ease_in_bounce`, `math.ease_out_bounce`, `math.ease_in_out_bounce`   |

See [Easings.net](https://easings.net/) for what each of them looks like.

## Registering your own queries

Mods can add their own queries through the MoLang event.
It fires once for every animation controller that is created, and gives you the controller, the engine and the query binding.

On Fabric and in Architectury common code:

```java
MolangEvent.MOLANG_EVENT.register((controller, engine, queryBinding) -> {
    MolangLoader.setDoubleQuery(queryBinding, "mymod_hand_distance", ctrl ->
            ctrl instanceof PlayerAnimationController playerController ? getHandDistance(playerController.getAvatar()) : 0);
    MolangLoader.setBoolQuery(queryBinding, "mymod_is_aiming", ctrl -> ...);
});
```

On NeoForge, listen for `com.zigythebird.playeranim.neoforge.event.MolangEvent` on the NeoForge event bus instead:

```java
@SubscribeEvent
public static void onMolang(MolangEvent event) {
    event.setDoubleQuery("mymod_hand_distance", ctrl -> ...);
    event.setBoolQuery("mymod_is_aiming", ctrl -> ...);
}
```

The lambda you pass is evaluated every time the query is read, so it always sees the current state.

:::danger
**Query names must not contain dots.**
A dot is the member access operator, so `q.mymod.hand_distance` is read as "the `hand_distance` property of the `mymod` property of `query`".
`query` has no `mymod` property, so the expression silently evaluates to `0`, your lambda is never called, and nothing is logged.
Use underscores instead — `mymod_hand_distance` — and read it as `q.mymod_hand_distance`.
:::

:::warning
The event fires for **every** controller of every player, including the ones registered by other mods, so check the controller before returning anything meaningful — that it is a `PlayerAnimationController`, and, if the query only makes sense for your own layer, that it is yours.
Queries can only be added while the event is running — the binding is made immutable right after.
:::

:::tip
Query names are case-insensitive, and registering a name that already exists **overwrites** it, so prefix your queries with your mod id to avoid breaking the built-in ones or another mod's.
The `setDoubleQuery`/`setBoolQuery` methods return `false` when the query could not be registered.
:::

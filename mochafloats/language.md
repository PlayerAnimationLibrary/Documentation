---
sidebar_position: 5
description: "The MoLang syntax, operators, keywords and math functions mochafloats supports, and where it differs from Bedrock."
---

# MoLang support

mochafloats follows [Bedrock's MoLang](https://bedrock.dev/docs/stable/Molang), and 6.1 was checked against Bedrock itself.
This page lists exactly what it understands, so you know what you can write in an expression.

## Literals

| Literal  | Examples                                 | Notes                                                       |
|----------|------------------------------------------|-------------------------------------------------------------|
| Number   | `5`, `0.25`, `-1.5`, `1.5e3`, `2.5E-4`   | Stored as a 32-bit `float`. Scientific notation is supported. |
| Boolean  | `true`, `false`                          | The same as `1` and `0`.                                    |
| String   | `'minecraft:pig'`                        | Single quotes only, no escape sequences. `"text"` is a syntax error. |

## Names and scopes

Names are case-insensitive and made of letters, digits and `_`.
Every expression starts from these top-level names:

| Name             | Provided by                 | Lifetime                                                  |
|------------------|-----------------------------|-----------------------------------------------------------|
| `math`           | `MolangInterpreter.standard()` | Read-only.                                             |
| `variable` / `v` | `MolangInterpreter.standard()` | Kept between evaluations of the same interpreter.      |
| `temp` / `t`     | every evaluation            | Thrown away when the evaluation ends.                     |
| `query` / `q` and anything else | you, see [Bindings](./gettingstarted/bindings.md) | Whatever you decide.                       |

A name that doesn't exist evaluates to `0`.

## Operators

From the tightest binding to the loosest:

| Operators                     | Meaning                                                       |
|-------------------------------|---------------------------------------------------------------|
| `.` `()` `[]`                 | Property access, call, array index                            |
| `-x` `!x`                     | Negation, logical not                                         |
| `->`                          | Evaluate the right side with the Java object on the left as the entity |
| `*` `/`                       | Multiplication, division (dividing by zero gives `0`)         |
| `+` `-`                       | Addition, subtraction                                         |
| `<` `<=` `>` `>=`             | Comparison, gives `1` or `0`                                  |
| `==` `!=`                     | Equality. Two strings compare by their text                   |
| `&&`                          | Logical and                                                   |
| `\|\|`                        | Logical or                                                    |
| `??`                          | The left side, or the right side if the left side doesn't exist. `0` counts as existing |
| `c ? a : b`, `c ? a`          | Conditional. Without `:` it gives `0` when `c` is false. Chained conditionals group from the right: `a ? 1 : b ? 2 : 3` is `a ? 1 : (b ? 2 : 3)` |
| `=`                           | Assignment, to `v.*` and `t.*`. It takes everything on its right: `v.x = c ? 5 : 6` assigns the conditional, and `v.a = v.b = 1` assigns both |

There is no `%` operator; use `math.mod(a, b)`.

## Statements and control flow

- `;` separates statements. A script with several statements returns the value of its `return`, and stops there. Empty statements (`;;`) are skipped.
- `{ ... }` groups statements into a block.
- `c ? { ... } : { ... }` runs the block of the chosen branch, and `c ? { ... }` runs its block when `c` is true.
- `loop(count, { ... })` runs a block `count` times.
- `for_each(t.item, array, { ... })` runs a block once for every element of an array, with `t.item` set to the element.
- `break` and `continue` work inside both loops.

```
t.total = 0;
loop(10, {
    t.total = t.total + 1;
    (t.total >= 5) ? break;
});
return t.total; // 5
```

A missing operand (`1 +`) or a trailing comma in a call (`math.abs(1,)`) is a syntax error, as in Bedrock.

## Math functions

Angles are in **degrees**: `math.sin` and `math.cos` take degrees, and `math.asin`, `math.acos`, `math.atan` and `math.atan2` return degrees.

| Function                                   | Result                                                                  |
|--------------------------------------------|-------------------------------------------------------------------------|
| `math.abs(x)`                              | Absolute value.                                                         |
| `math.sign(x)`                             | `-1`, `0` or `1`.                                                       |
| `math.copy_sign(x, sign)`                  | `x` with the sign of `sign`.                                            |
| `math.min(a, b)`, `math.max(a, b)`         | The smaller / bigger value.                                             |
| `math.clamp(x, min, max)`                  | `x` limited to the range.                                               |
| `math.floor(x)`, `math.ceil(x)`            | Round down / up.                                                        |
| `math.round(x)`                            | Round to the nearest whole number; halves round away from zero (`-2.5` → `-3`). |
| `math.trunc(x)`                            | Drop the fractional part (`-2.7` → `-2`).                               |
| `math.mod(a, b)`                           | Remainder of `a / b`, with the sign of `a` (`math.mod(-7, 3)` → `-1`).  |
| `math.sqrt(x)`, `math.pow(a, b)`           | Square root, power.                                                     |
| `math.exp(x)`, `math.ln(x)`                | `e` to the power of `x`, natural logarithm.                             |
| `math.sin(deg)`, `math.cos(deg)`           | Sine and cosine of an angle in degrees.                                 |
| `math.asin(x)`, `math.acos(x)`, `math.atan(x)` | Inverse functions, in degrees.                                      |
| `math.atan2(y, x)`                         | Angle of the point `(x, y)`, in degrees.                                |
| `math.d2r(deg)`, `math.r2d(rad)`           | Degrees to radians and back.                                            |
| `math.lerp(a, b, t)`                       | Linear interpolation from `a` to `b`.                                   |
| `math.inverse_lerp(a, b, x)`               | Where `x` lies between `a` and `b`, as `0`–`1` (`0` if `a == b`).       |
| `math.lerprotate(a, b, t)`                 | Interpolation between two angles the short way round.                   |
| `math.min_angle(deg)`                      | The angle wrapped into `-180`–`180`.                                    |
| `math.hermite_blend(t)`                    | `3t² - 2t³`, a smooth `0`–`1` curve.                                    |
| `math.random(min, max)`                    | A random number between the two bounds, in either order.               |
| `math.random_integer(min, max)`            | A random whole number from the smaller bound to the bigger one, both included. |
| `math.die_roll(count, low, high)`          | The sum of `count` random numbers between `low` and `high`.             |
| `math.die_roll_integer(count, low, high)`  | The sum of `count` random whole numbers from `low` to `high`, both included. |
| `math.pi`, `math.e`                        | The constants π and e.                                                  |

`math.sign`, `math.copy_sign`, `math.inverse_lerp`, `math.d2r`, `math.r2d` and `math.e` don't exist in Mocha.

:::info
PlayerAnimationLibrary adds the `math.ease_*` easing functions on top of this list; they belong to PAL, not to mochafloats. See [PAL's MoLang page](/pal/molang#easing-functions).
:::

## Results

- Results are 32-bit floats: about 7 significant digits, and whole numbers are exact up to 16,777,216.
- Dividing by zero gives `0`, and `NaN` and infinities are turned into `0`, both interpreted and in [compiled functions](./features/compiling.md).
- Strings, objects and functions evaluate to `0` when a number is needed.

## Differences from Bedrock and Blockbench

Of everything checked against Bedrock, one difference is left, and it's deliberate: `math.sqrt` of a negative number and `math.ln(0)` give `0`, where Bedrock gives `NaN` and `-Infinity`. A `NaN` that reaches a bone breaks the model.

:::note
Blockbench previews animations with [MolangJS](https://github.com/JannisX11/MolangJS), which differs from Bedrock and mochafloats in a few places. In Blockbench:

- `'a' == 'b'` is `1`: strings count as `0`.
- `math.round(-2.5)` is `-2`.
- `math.random_integer(3, 1)` is always `2`.
- `math.ln(0)` is `-Infinity`.
- `1 +` and `math.abs(1,)` are accepted.

Avoid these in animations if what you see in Blockbench has to match the game exactly.
:::

Versions before 6.1 differ from Bedrock in more places; see [Upgrading to 6.1](./migration/upgrading_to_6_1.md).

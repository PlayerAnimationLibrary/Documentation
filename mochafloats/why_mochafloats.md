---
sidebar_position: 2
description: "What mochafloats fixes and adds compared to Mocha 3.0.1, with the results of running the same expressions on both."
---

# Why mochafloats?

Mocha 3.0.1, released in March 2025, is the last version of the original library.
Its `main` branch hasn't changed since, the bug reports [#27](https://github.com/unnamed/mocha/issues/27) and [#29](https://github.com/unnamed/mocha/issues/29) are still open, and the pull request that ported it to `float` ([#22](https://github.com/unnamed/mocha/pull/22)) was never merged.

mochafloats picked up from there: well over a hundred commits on top of Mocha 3.0.1, released as versions up to 6.1.0.
This page lists what that changed.

## At a glance

|                                          | Mocha 3.0.1                           | mochafloats 6.1.0                                    |
|------------------------------------------|---------------------------------------|------------------------------------------------------|
| Number type                              | `double`                              | `float`                                              |
| Java                                     | 8+                                    | 24+                                                  |
| Bytecode generation                      | Javassist 3.30.2 (≈ 795 KB extra jar) | JDK ClassFile API, no extra jar                      |
| What you ship to only interpret MoLang   | ≈ 930 KB (Mocha + Javassist)          | ≈ 125 KB (`lexer` + `parser` + `runtime`)            |
| Interpreting `math.sin(...) * 45 + math.cos(...)` | 248 ns                       | 157 ns                                               |
| Compiled functions                       | regular classes, never unloaded       | hidden classes, unloaded with the function           |
| Sending parsed expressions over network  | —                                     | built in, on Netty `ByteBuf`                         |
| Checked against Bedrock                  | —                                     | [yes](#molang-that-evaluates-like-bedrock)           |
| `-math.sin(90) * 30`                     | `0`                                   | `-30`                                                |
| `v.x = 1 ? 5 : 6; return v.x;`           | `1`                                   | `5`, like Bedrock                                    |
| `1.0E-4 * 10000`                         | `0` and a parse error                 | `1`                                                  |
| `math.PI` on a Turkish system            | `0`                                   | `3.1415927`                                          |
| `math.e`, `math.sign`, `math.inverse_lerp` | `0` (missing)                       | implemented                                          |
| Bundled inside a NeoForge mod            | crashes when compiling ([#27](https://github.com/unnamed/mocha/issues/27)) | works                       |
| Compiled calls to instance methods       | fail verification ([#29](https://github.com/unnamed/mocha/issues/29))      | work                        |

:::info How these results were measured
Every expression on this page was run on both libraries, interpreted and compiled, with a standard engine (`createStandard()`) on JDK 25.
Where a query appears, `q.length('abc')` is a Java method bound with `@Binding` that returns the length of its argument.
The Bedrock results come from a behaviour pack whose animation controllers evaluate each expression in the game and report the result.
:::

## Bugs fixed only in mochafloats

### A minus or `!` in front of a function call

Mocha attaches a leading `-` or `!` to the function name instead of the call, so `-math.abs(5)` is read as `(-math.abs)(5)`: it calls a negated function, which evaluates to `0`.
Negating a `sin` or `cos` is one of the most common things an animation does, and every such expression silently produced `0`.

| Expression            | Mocha 3.0.1 | mochafloats |
|-----------------------|-------------|-------------|
| `-math.sin(90) * 30`  | `0`         | `-30`       |
| `-math.abs(3) * 2`    | `0`         | `-6`        |
| `!math.abs(0)`        | `0`         | `1`         |
| `-q.length('abc')`    | `0`         | `-3`        |
| `!q.length('')`       | `0`         | `1`         |

The results are the same interpreted and compiled. Fixed in [#55](https://github.com/PlayerAnimationLibrary/mochafloats/pull/55).

### MoLang that evaluates like Bedrock

mochafloats 6.1 was checked against Bedrock itself, and against five other MoLang implementations where Bedrock wasn't tested.
These expressions give different results in Mocha:

| Expression                                             | Mocha 3.0.1 | mochafloats 6.1 | Bedrock |
|--------------------------------------------------------|-------------|-----------------|---------|
| `v.x = 1 ? 5 : 6; return v.x;`                         | `1`         | `5`             | `5`     |
| `1 ? 2 : 3 ? 4 : 5`                                    | `4`         | `2`             | `2`     |
| `v.w = 0; 1 ? { v.w = 4; } : { v.w = 5; }; return v.w;` | `0`        | `4`             | `4`     |
| `v.zero = 0; return v.zero ?? 7;`                      | `7`         | `0`             | `0`     |
| `'a' == 'b'`                                           | `1`         | `0`             | `0`     |
| `math.round(-2.5)`                                     | `-2`        | `-3`            | `-3`    |
| `math.random_integer(1, 3)`                            | 1 or 2      | 1 to 3          | 1 to 3  |
| `math.random(1, 1)`                                    | throws      | `1`             | `1`     |
| `math.die_roll(1, 5, 6)`                               | 1.25 to 2.5 | 5 to 6          | 5 to 6  |

- Mocha binds `=` tighter than `? :`, so `v.x = c ? 5 : 6` assigns `c`; and it groups chained conditionals from the left.
- In `c ? { ... } : { ... }`, Mocha never runs either block.
- Mocha's `??` falls back on `0` as well as on a missing value.
- Mocha compares strings as numbers, so any two strings are equal.
- Mocha's `math.random`, `math.random_integer` and `math.die_roll_integer` throw an `IllegalArgumentException` out of `eval` when both bounds are equal or reversed, and `random_integer` never returns its upper bound.
- Mocha's `math.die_roll` sums whole numbers from `low` to `low + high - 1` and divides the total by 4.

The one deliberate difference from Bedrock is in [MoLang support](./language.md#differences-from-bedrock-and-blockbench).

### Numbers in scientific notation

Mocha's lexer stops reading a number at the `e`, so anything written in scientific notation fails to parse and the whole expression evaluates to `0`.
That's the format Java, JavaScript and many exporters print very small and very large numbers in.

| Expression        | Mocha 3.0.1                                                | mochafloats |
|-------------------|------------------------------------------------------------|-------------|
| `1.0E-4 * 10000`  | `0`, parse error *Expected a semicolon, but was IDENTIFIER(E)* | `1`     |
| `2.5e-1`          | `0`                                                        | `0.25`      |
| `1.5E+2`          | `0`                                                        | `150`       |

### Names on a Turkish (or Azerbaijani) system

MoLang names are case-insensitive, and Mocha lowercases them with the system's language rules.
In Turkish the lowercase of `I` is the dotless `ı`, so on a Turkish system `math.PI` looks up `pı`, finds nothing and evaluates to `0`.

| Expression (Turkish system locale) | Mocha 3.0.1 | mochafloats |
|------------------------------------|-------------|-------------|
| `math.PI`                          | `0`         | `3.1415927` |
| `MATH.MIN(1, 2)`                   | `0`         | `1`         |

mochafloats lowercases with `Locale.ROOT`, so the result no longer depends on the player's language. Fixed in [#18](https://github.com/PlayerAnimationLibrary/mochafloats/pull/18).

### Compiling calls to Java methods

Mocha's compiler generates invalid bytecode for several kinds of Java calls, so the expression can't be compiled at all:

| Expression                              | Mocha 3.0.1                                       | mochafloats |
|-----------------------------------------|---------------------------------------------------|-------------|
| `q.length('abc') + 1`                   | compile error: *stack underflow*                  | `4`         |
| `q.body_float('chest', 'power') - 100`  | compile error: *stack underflow*                  | `100`       |
| `offset.calc(1)` (an instance method)   | `VerifyError`: *Bad type on operand stack*        | `4`         |

- A call left the type of its last parameter as the "expected type" for the rest of the expression, so an arithmetic operation after a call with a `String`, `int`, `long`, `double` or `boolean` parameter broke. Fixed in [#55](https://github.com/PlayerAnimationLibrary/mochafloats/pull/55) ([#54](https://github.com/PlayerAnimationLibrary/mochafloats/issues/54)).
- For instance methods, the arguments were pushed before the object the method is called on. This is Mocha's open issue [#29](https://github.com/unnamed/mocha/issues/29).

### Compiled code that disagrees with the interpreter

| Compiled                                              | Mocha 3.0.1                                       | mochafloats |
|-------------------------------------------------------|---------------------------------------------------|-------------|
| `a && 1` with `a = 0.5`                               | `0`                                               | `1`         |
| `a ? 10 : 20` with `a = 0.5`                          | `20`                                              | `10`        |
| `1 / a` with `a = 0`                                  | `Infinity`                                        | `0`         |
| `-(a > b) ? 10 : 20` with `a = 5`, `b = 4`            | `20`                                              | `10`        |
| `!(a > b)` with `a = 1`, `b = 2`, returning `boolean` | `ArrayIndexOutOfBoundsException` while compiling  | `true`      |

Mocha's compiler turns a number into a boolean by cutting it to an integer first, so every value between `-1` and `1` is false.
It doesn't apply MoLang's division-by-zero rule, it flips the truth of a negated boolean, and it emits a broken jump for `!` when the surrounding code expects a `boolean`.
mochafloats' compiled functions give the interpreter's results, and constructs the compiler doesn't support are rejected with an error that names them instead of turning into invalid bytecode. See [what the compiler supports](./features/compiling.md#what-the-compiler-supports).

### Java bindings

| With bindings made with `@Binding` / lambdas                        | Mocha 3.0.1                 | mochafloats      |
|---------------------------------------------------------------------|-----------------------------|------------------|
| A class with a single `@BindExternalFunction`                       | nothing is bound            | bound            |
| A method parameter of type `ExecutionContext`, `Lazy<T>` or varargs | receives `null`, or throws  | works            |
| `q.f() + 1` where the `Function` returns `null`                     | `NullPointerException`      | `1`              |
| `warnOnReflectiveFunctionUsage(true)`, 3 evaluations with 2 calls   | 6 warnings, `math.*` included | each reflective method once |

### Compiled classes that collide and never go away

Mocha names every compiled class after the current millisecond plus a random number below 2024.
When many expressions are compiled at once — for example while resources load — two of them eventually get the same name, and the second fails with `frozen class (cannot edit)`.
The classes it defines are also never unloaded, and Javassist's global `ClassPool` keeps a copy of each one.

Compiling 20,000 expressions in a loop:

|                                   | Mocha 3.0.1 | mochafloats |
|-----------------------------------|-------------|-------------|
| Failed compilations               | 242         | 0           |
| Generated classes unloaded by GC  | 0           | 20,000      |
| Heap still used after GC          | 75 MB       | 2 MB        |

mochafloats numbers its classes with an atomic counter and defines them as [hidden classes](https://openjdk.org/jeps/371), which the JVM can unload once nothing references the compiled function anymore.

### Crash when bundled inside a NeoForge mod

When Mocha is shipped inside a mod's jar, NeoForge loads it in a separate module layer, and compiling a function that implements one of the mod's interfaces crashes with `IllegalAccessError: superinterface check failed` ([#27](https://github.com/unnamed/mocha/issues/27), still open).
mochafloats' jars declare `FMLModType: GAMELIBRARY`, so NeoForge loads them next to the mods that use them.

## Features only in mochafloats

### A faster interpreter

| Interpreted, pre-parsed                                           | Mocha 3.0.1        | mochafloats 6.1     |
|-------------------------------------------------------------------|--------------------|---------------------|
| `5`                                                               | 71 ns, 664 bytes   | **0.9 ns, 0 bytes** |
| `t.t = 3; return 3*t.t*t.t - 2*t.t*t.t*t.t;`                      | 180 ns, 1000 bytes | **167 ns, 712 bytes** |
| `t.a = 1.25; return math.sin(t.a * 50) * 45 + math.cos(t.a * 20);` | 248 ns, 1408 bytes | **157 ns, 824 bytes** |
| A method bound with `@Binding`                                    | 137 ns, 968 bytes  | **102 ns, 696 bytes** |

*Measured with JMH on JDK 25 (Apple Silicon), average time and allocation per call.*

- An expression that is just a number, like most keyframe values, is returned straight away; Mocha copies the whole scope and creates an interpreter for it on every call.
- `math.*` functions are called directly instead of through reflection.
- Other `@Binding` methods are called through a method handle that is prepared once.

Compiled functions run in about half a nanosecond for simple expressions in Mocha, mochafloats and Moonflower's molang-compiler alike. On the arithmetic and math expressions above, mochafloats' compiled code is 10 to 15% slower than the other two, because it also applies MoLang's rules for division by zero and `NaN`.

<details>
<summary>Compared with other Java MoLang libraries</summary>

| Interpreted                               | mochafloats 6.1 | Mocha 3.0.1 | bedrockk/MoLang |
|-------------------------------------------|-----------------|-------------|-----------------|
| `5`                                       | 0.9 ns          | 71 ns       | 74 ns           |
| arithmetic with temp variables (above)    | 167 ns          | 180 ns      | 2212 ns         |
| `math.sin` and `math.cos` (above)         | 157 ns          | 248 ns      | 2159 ns         |

| Compiled                                  | mochafloats 6.1 | Mocha 3.0.1 | molang-compiler |
|-------------------------------------------|-----------------|-------------|-----------------|
| `5`                                       | 0.50 ns         | 0.46 ns     | 0.52 ns         |
| arithmetic with temp variables (above)    | 0.51 ns         | 0.45 ns     | 0.44 ns         |
| `math.sin` and `math.cos` (above)         | 5.3 ns          | 4.7 ns      | 4.6 ns          |

In this test molang-compiler 3.1.1.19 returned `189` instead of `-27` for the arithmetic expression, and bedrockk/MoLang computed `math.sin` and `math.cos` in radians; their times are shown as measured.

</details>

### Floats everywhere

Literals, values, function arguments and results are 32-bit floats, the same type Minecraft's models use for part rotations, offsets and scales.
A keyframe value goes from MoLang to the model without being converted from `double` to `float` and back.

### Pick only what you need

The library is split into [four modules](./intro.md#modules).
A mod that only interprets MoLang ships `lexer`, `parser` and `runtime` — about 125 KB — while Mocha can't even create an interpreter without Javassist on the classpath.

### No Javassist

The compiler builds classes with the JDK's ClassFile API (`java.lang.classfile`, final since Java 24) and defines them as hidden classes.
There is no third-party bytecode library to ship, shade or conflict with another mod's copy.

### Sending expressions over the network

Parsed expressions can be written to a Netty `ByteBuf` and read back on the other side, without turning them back into text and parsing them again.
PlayerAnimationLibrary's binary animation format, the one that goes over the network, stores expressions this way. See [Sending expressions over the network](./features/serialization.md).

### More of the `math` library

`math.e`, `math.sign`, `math.copy_sign`, `math.inverse_lerp`, `math.d2r` and `math.r2d` are implemented; in Mocha they evaluate to `0`.

| Expression                       | Mocha 3.0.1 | mochafloats |
|----------------------------------|-------------|-------------|
| `math.e`                         | `0`         | `2.7182817` |
| `math.sign(-4)`                  | `0`         | `-1`        |
| `math.copy_sign(3, -1)`          | `0`         | `-3`        |
| `math.inverse_lerp(0, 10, 2.5)`  | `0`         | `0.25`      |
| `math.d2r(180)`                  | `0`         | `3.1415927` |
| `math.r2d(math.pi)`              | `0`         | `180`       |

### Values that only exist for one evaluation

`MolangInterpreter.eval(expressions, scope -> ...)` lets you add bindings that only that one evaluation can see — for example a `this` or a `context` object — without touching the interpreter's shared scope. See [Bindings for a single evaluation](./gettingstarted/usage.md#bindings-for-a-single-evaluation).

### Syntax trees that print as MoLang

`toString()` on a parsed expression prints it in MoLang syntax — `math.sin(q.anim_time*50)*45` instead of `Call(Access(Identifier(math), sin), [...])` — with parentheses wherever they're needed, so the text parses back into the same expression. See [Printing expressions as text](./features/serialization.md#printing-expressions-as-text).

### Smaller changes

- `Expression`, `Value`, `MolangLexer` and `MolangParser` are `sealed`, so a `switch` over them can be checked for exhaustiveness.
- The compiler's constant folding can be replaced or turned off: `new MolangCompiler(entity, scope, null)`.
- `ObjectValue.setFunction` accepts functions with no arguments.
- The runtime is annotated for [J2ObjC](https://developers.google.com/j2objc) and falls back to plain reflection where `java.lang.invoke` isn't available.
- The test suite checks 141 expressions against [MolangJS](https://github.com/JannisX11/MolangJS), the MoLang implementation Blockbench uses, both interpreted and compiled, and CI builds and tests every pull request.

## What it costs you

- **Java 24 or newer.** The ClassFile API doesn't exist before Java 24. Minecraft 26.1 and newer runs on Java 25.
- **Float precision.** A float holds about 7 significant digits, and whole numbers are only exact up to 16,777,216: `16777217` evaluates to `16777216`. That's plenty for animation, but large counters lose precision — a world's game time in ticks (`q.time_stamp` in PAL) passes that limit after about 9.7 days of running, so prefer values that stay small, like `q.anim_time`.
- **A different API.** Packages moved to `org.redlance.mocha`, and `MochaEngine` was split into an interpreter and a compiler. [Migrating from Mocha](./migration/migrating_from_mocha.md) maps every old call to its new place.

Already on mochafloats 6.0? [Upgrading to 6.1](./migration/upgrading_to_6_1.md) lists what changed.

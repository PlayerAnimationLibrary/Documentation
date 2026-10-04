---
sidebar_position: 1
description: "mochafloats — a fast MoLang lexer, parser, interpreter and bytecode compiler for Java, forked from Mocha."
---

# Introduction

mochafloats is a Java library that reads and runs [MoLang](https://bedrock.dev/docs/stable/Molang), the small expression language Minecraft Bedrock uses for data-driven values.
It contains a lexer, a parser, an interpreter and a compiler that turns expressions into JVM bytecode.

It started as a fork of [Mocha](https://github.com/unnamed/mocha) by Unnamed Team and is maintained by the PlayerAnimationLibrary team.
[PlayerAnimationLibrary](/pal/intro) and [Emotecraft](/emotecraft/gettingstarted) run every MoLang expression in their animations through it.

```java
MolangInterpreter<?> molang = MolangInterpreter.standard();

float result = molang.eval("math.sqrt(3 * 3 + 4 * 4)"); // 5.0
float swing = molang.eval("v.t = 0.25; return -math.sin(v.t * 360) * 30;"); // -30.0
```

## What MoLang looks like

Everything in MoLang evaluates to a number: `true` is `1`, `false` is `0`, and a whole script is basically one formula.
It has variables (`variable.x`, or `v.x` for short), host-provided values (`query.anim_time`), a `math` library, conditionals and loops:

```
v.speed = q.ground_speed * 4;
return q.is_on_ground ? math.sin(q.anim_time * 360 * v.speed) * 20 : 0;
```

See [MoLang support](./language.md) for everything mochafloats understands.

## What is different from Mocha

mochafloats computes with 32-bit `float` values instead of `double`, splits the library into modules, drops Javassist for the JDK's own ClassFile API and adds a binary format for sending parsed expressions over the network.
It also fixes bugs that are still present in Mocha 3.0.1, such as `-math.sin(90) * 30` evaluating to `0`, and its results were checked against Bedrock itself.

[Why mochafloats?](./why_mochafloats.md) lists every difference, with the results of running the same expressions on both libraries.

## Modules

| Module             | Contains                                                                            | Depends on               |
|--------------------|-------------------------------------------------------------------------------------|--------------------------|
| `lexer`            | The tokenizer.                                                                      | —                        |
| `parser`           | The parser, the syntax tree and the network format for it.                          | `lexer`, Netty `ByteBuf` |
| `runtime`          | `MolangInterpreter`, scopes, values, bindings and the standard `math` library.     | `parser`                 |
| `runtime-compiler` | `MolangCompiler`, which compiles expressions to bytecode, and `MochaEngine`.        | `runtime`                |

Each module brings the ones it depends on, so you only ever declare one of them.
Most projects only need `runtime`.

## Where to start

1. [Add the library to your project](./gettingstarted/installation.md)
2. [Evaluate your first expressions](./gettingstarted/usage.md)
3. [Expose your own values and functions to MoLang](./gettingstarted/bindings.md)
4. [Compile hot expressions to bytecode](./features/compiling.md) if interpreting them isn't fast enough

Coming from Mocha or an older mochafloats? Read [Migrating to mochafloats 6](./migration/migrating_from_mocha.md).

## Credits and license

mochafloats is a fork of [Mocha](https://github.com/unnamed/mocha) © Unnamed Team, and like Mocha it is distributed under the [MIT license](https://github.com/PlayerAnimationLibrary/mochafloats/blob/HEAD/license.txt).
Parts of these pages are based on [Mocha's documentation](https://github.com/unnamed/mocha/tree/v3.0.0/docs).

The source code lives at [PlayerAnimationLibrary/mochafloats](https://github.com/PlayerAnimationLibrary/mochafloats).

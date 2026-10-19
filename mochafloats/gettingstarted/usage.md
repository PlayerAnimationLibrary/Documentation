---
sidebar_position: 2
description: "Creating an interpreter, evaluating and caching MoLang expressions, scopes and parse errors."
---

# Evaluating MoLang

## Creating an interpreter

`MolangInterpreter` lives in the `runtime` module. `MolangInterpreter.standard()` gives you one with the usual bindings already in place:

```java
MolangInterpreter<?> molang = MolangInterpreter.standard();
```

| Name               | What it is                                               |
|--------------------|----------------------------------------------------------|
| `math`             | The [standard math library](../language.md#math-functions). |
| `variable` / `v`   | Variables that are kept between evaluations.             |
| `temp` / `t`       | Variables that only live for one evaluation (added on every call). |

`query` is **not** part of the standard set: queries describe your game objects, so you [bind them yourself](./bindings.md).

An interpreter can carry an **entity**, the object its expressions are about — an animated player, a mob, a particle.
Functions you bind receive it through their execution context:

```java
MolangInterpreter<Player> molang = MolangInterpreter.standard(player);
```

To start from an empty scope instead, use `MolangInterpreter.create(entity, builder -> builder.set("name", value))`.

## Evaluating text

`eval` parses a string and runs it. The result is always a `float`:

```java
float a = molang.eval("math.sqrt(3 * 3 + 4 * 4)"); // 5.0
float b = molang.eval("math.abs(-5) + 5");         // 10.0
float c = molang.eval("v.x = 2; return v.x * 3;"); // 6.0
```

A script with several statements separated by `;` returns the value of its `return`.

## Parsing once, evaluating many times

`eval(String)` parses the text again on every call.
For anything that runs repeatedly — a keyframe evaluated every frame, for example — parse it once with `MolangParser` and keep the result:

```java
List<Expression> wave = MolangParser.parseAll("math.sin(v.t * 360) * 30"); // throws ParseException

molang.eval("v.t = 0.25");
float value = molang.eval(wave); // 30.0
```

`prepareEval` does the same in one step and hands you a `Supplier<Float>`:

```java
Supplier<Float> wave = molang.prepareEval("math.sin(v.t * 360) * 30");
float value = wave.get();
```

:::tip
`Supplier<Float>` boxes the result into a new `Float` on every call. In hot code, keep the `List<Expression>` and call `eval(list)`, which returns a primitive `float`.
:::

An expression that is just a number — `5`, `-1.5` — is returned straight away, without allocating anything.

## Where values live

Every call to `eval` works on its own copy of the interpreter's scope:

- `temp` / `t` is created fresh for each call, so temporary variables never leak from one evaluation to the next.
- `variable` / `v` is shared: the copy points at the same object, so a value written by one evaluation is visible to the next one.
- While an expression runs, its scope is read-only: a script can write `v.x = 1`, but it can't replace `math` or any other top-level binding.

```java
molang.eval("v.counter = 1");
molang.eval("v.counter = v.counter + 1");
molang.eval("v.counter"); // 2.0

molang.eval("t.value = 5");
molang.eval("t.value");   // 0.0, temp variables are gone after each call
```

## Bindings for a single evaluation

Pass a `Consumer<Scope>` as the second argument to add bindings that only exist for that one call.
It runs on the copied scope, before the scope becomes read-only, so the interpreter's own scope is never touched:

```java
List<Expression> scaled = MolangParser.parseAll("this * 2");

molang.eval(scaled);                                                // 0.0
molang.eval(scaled, scope -> scope.set("this", NumberValue.of(21))); // 42.0
molang.eval(scaled);                                                // 0.0 again
```

This is handy when the same parsed expression is evaluated for many different objects — give each call its own `this`, `context` or query object instead of creating an interpreter per object.

## Parse errors

`MolangParser.parseAll` throws a `ParseException` (an `IOException`) that tells you where the problem is:

```java
try {
    MolangParser.parseAll("math.sin(");
} catch (ParseException e) {
    Cursor cursor = e.cursor(); // line and column, may be null
}
```

`eval(String)` and `prepareEval` never throw for bad syntax: they return `0` instead.
Register a handler to find out when that happens:

```java
molang.handleParseExceptions(e -> LOGGER.warn("Invalid MoLang", e));
```

## What evaluation returns

- Booleans are numbers: comparisons and `!` give `1` or `0`, and `true`/`false` are `1`/`0`.
- Dividing by zero gives `0`, and so does any `NaN` or infinity — the interpreter never returns them.
- Names that don't exist evaluate to `0` without an error, so a misspelled query silently gives `0`.
- If the final value isn't a number (a string, an object), the result is `0`.

## Interpreter and compiler together

The `runtime-compiler` module adds `MochaEngine`, which pairs an interpreter with a [compiler](../features/compiling.md) that share one scope:

```java
MochaEngine<?> engine = MochaEngine.createStandard();

engine.interpreter().eval("v.x = 3");
MochaFunction function = engine.compiler().compile("math.pow(2, 10)");
float result = function.evaluate(); // 1024.0
```

`MochaEngine.from(interpreter)` wraps an interpreter you already have.

## Threads

The interpreter doesn't lock anything, and the standard `variable` binding is a plain map.
Give each independent owner its own interpreter — PlayerAnimationLibrary creates one per animation controller — instead of sharing one between threads.

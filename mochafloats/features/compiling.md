---
sidebar_position: 1
description: "Compiling MoLang expressions to JVM bytecode with MolangCompiler: typed functions, Java calls and what the compiler supports."
---

# Compiling to bytecode

The `runtime-compiler` module can turn an expression into a small JVM class.
Calling it is as fast as calling a hand-written Java method: there's no syntax tree to walk, and the JIT can inline it like any other code.

Compile expressions that run very often and only use math and your own Java methods.
For everything else — and especially for MoLang written by users or artists — use the [interpreter](../gettingstarted/usage.md): it supports the whole language, while the compiler only supports [a subset](#what-the-compiler-supports).

## Compiling an expression

```java
MochaEngine<?> engine = MochaEngine.createStandard();

MochaFunction function = engine.compiler().compile("math.sqrt(3 * 3 + 4 * 4)");
float result = function.evaluate(); // 5.0
```

Constant parts are evaluated while compiling, so the class generated for this example simply returns `5.0` — its whole method body is `ldc 5.0; freturn`.

Compile once and keep the function: every `compile` call parses the text and defines a new class.
The class is a [hidden class](https://openjdk.org/jeps/371), so the JVM can unload it once you no longer reference the function.

`MolangCompiler` can also be created directly — `new MolangCompiler(entity, scope)` — to compile against any scope, for example an interpreter's `scope()`.

## Functions with parameters

Declare an interface with a single method that extends `MochaCompiledFunction`, and the compiled class will implement it.
Parameters are available in the expression by name:

```java
public interface Falloff extends MochaCompiledFunction {
    float apply(@Named("distance") float distance, @Named("radius") float radius);
}

Falloff falloff = engine.compiler().compile("math.clamp(1 - distance / radius, 0, 1)", Falloff.class);
falloff.apply(2, 8); // 0.75
```

- The interface must have exactly one abstract method. Default and static methods are fine.
- Name every parameter with `@Named`, or compile your code with `javac -parameters` so the names are kept.
- Parameters and the return value can be `float`, `double`, `int`, `long` or `boolean`; values are converted as needed. A `boolean` result is `true` when the expression is non-zero.

## Calling Java code

Bindings made with [`@Binding`](../gettingstarted/bindings.md#java-classes-with-binding) are called directly from the generated code — no reflection, no boxing:

```java
@Binding("game")
public final class GameBindings {
    @Binding("gravity")
    public static final float GRAVITY = 0.08F;

    @Binding("ticks_to_seconds")
    public static float ticksToSeconds(float ticks) {
        return ticks / 20F;
    }
}

engine.interpreter().bind(GameBindings.class);
engine.compiler().compile("game.ticks_to_seconds(40) * game.gravity").evaluate(); // 0.16
```

- Static methods become `invokestatic`, methods of an instance bound with `bindInstance` become `invokevirtual` on that instance.
- `public static final` number fields are copied into the class as constants; other static fields are read every time.
- String literals can be passed to methods that take a `String`.
- A parameter annotated with `@Entity` receives the compiler's entity.

## What the compiler supports

| Supported                                                   | Not supported — use the interpreter                         |
|-------------------------------------------------------------|-------------------------------------------------------------|
| Numbers, `true`, `false`                                    | `variable` / `v`                                            |
| `+` `-` `*` `/`, unary `-`                                  | Bindings made of lambdas or `ObjectValue`s, such as a `query` built from `Function`s |
| `<` `<=` `>` `>=` `==` `!=`, `&&` `\|\|` `!`                | `loop`, `for_each`, `break`, `continue`, blocks `{ ... }`   |
| `c ? a : b`, `c ? a`, `return`, several statements          | `->`, `??` and `[]`                                         |
| `temp` / `t` variables                                      | Non-static `@Binding` fields                                |
| The interface's parameters                                  | Methods that take an `ExecutionContext`, a `Lazy` or varargs |
| `math.*` and other `@Binding` static methods and fields      |                                                             |
| Methods of instances bound with `bindInstance`              |                                                             |

An unsupported construct makes `compile` throw an `UnsupportedOperationException` that names it.
Parts of an expression that only use constants are computed at compile time, so `1 ?? 2` compiles fine; `t.a ?? 3` doesn't.

Compiled code follows the interpreter's number rules: dividing by zero gives `0`, and `NaN` or infinities, from arithmetic or returned by a Java method, become `0`.
A method whose `@Binding` sets `skipChecking = true` is trusted to return finite values and isn't checked.

## Debugging

- `postCompile(bytes -> ...)` receives the bytecode of every generated class before it's loaded. Write it to a `.class` file and open it in your IDE or with `javap`.
- `handleParseExceptions(handler)` is called when the source doesn't parse. The compiler then compiles an empty body, which returns `0` (or `false`).

```java
engine.compiler()
        .postCompile(bytes -> {
            try {
                Files.write(Path.of("molang.class"), bytes);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        })
        .handleParseExceptions(e -> LOGGER.warn("Invalid MoLang", e));
```

## Constant folding

By default the compiler runs every expression through an `ExpressionInliner` first, which evaluates parts made only of literals and `pure` functions.
Pass your own inliner as the third constructor argument, or `null` to compile expressions exactly as written:

```java
MolangCompiler compiler = new MolangCompiler(null, engine.scope(), null);
```

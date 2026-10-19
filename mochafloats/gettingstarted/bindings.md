---
sidebar_position: 3
description: "Exposing your own values, functions and Java classes to MoLang expressions."
---

# Bindings

A binding is anything an expression can reach by name: `math`, `v`, your `query` object, a Java class.
All of them live in the interpreter's scope, which you get with `scope()`.

## How names are resolved

`q.health` looks up `q` in the scope, then asks that object for its `health` property.
`q.distance_to(2)` does the same, then calls the property as a function.

- Names are **case-insensitive**: `Math.PI`, `math.pi` and `MATH.PI` are the same thing. mochafloats lowercases them with `Locale.ROOT`, so the player's language doesn't matter.
- Names are made of letters, digits and `_`, and can't start with a digit. A dot always means "property of", so `q.mymod.speed` is the `speed` property of the `mymod` property of `q` — use `q.mymod_speed` for a flat name.
- A name that doesn't exist evaluates to `0`, without an error.

## Values

Everything an expression can touch is a `Value`:

| Type             | Holds                                                        |
|------------------|--------------------------------------------------------------|
| `NumberValue`    | A `float`. `NumberValue.of(1.5F)`, `Value.of(true)` (which is `1`). |
| `StringValue`    | A string. MoLang strings use single quotes: `'minecraft:pig'`. |
| `ArrayValue`     | An array of values, indexed with `[]`.                       |
| `ObjectValue`    | Something with named properties, like `math` or `query`.     |
| `Function`       | Something you can call with `()`.                            |

`Value.of(object)` converts plain Java values: numbers, strings, booleans and arrays.

## Functions as lambdas

The quickest way to add a function is a `MutableObjectBinding` holding `Function` lambdas:

```java
MolangInterpreter<Player> molang = MolangInterpreter.standard(player);

MutableObjectBinding query = new MutableObjectBinding();
query.set("health", (Function<Player>) (ctx, args) -> NumberValue.of(ctx.entity().getHealth()));
query.set("distance_to", (Function<Player>) (ctx, args) -> {
    float x = args.next().eval().getAsNumber();
    return NumberValue.of(Math.abs(ctx.entity().getX() - x));
});

molang.scope().set("query", query);
molang.scope().set("q", query);

molang.eval("q.health() / 2");
molang.eval("q.distance_to(10)");
```

- `ctx.entity()` is the interpreter's entity.
- `args.next()` returns the next argument; `eval()` evaluates it. Arguments are evaluated only when you ask, so a function decides whether and how often to evaluate them. `args.length()` tells you how many were passed.
- Return `Value.nil()` or `null` for "nothing"; both read as `0`.

For plain number functions, `setFunction` saves the casting:

```java
query.setFunction("half", x -> x / 2);
query.setFunction("random_angle", () -> (float) (Math.random() * 360));
```

Once everything is registered, `query.block()` makes the object read-only: later `set` calls return `false` and change nothing.

Lambdas are the fastest bindings for the interpreter. The [compiler](../features/compiling.md) can't call them, though — use [`@Binding` classes](#java-classes-with-binding) for compiled expressions.

## Properties computed when read

Bedrock writes most queries without parentheses: `q.health`, `q.is_sneaking`.
A `Function` stored in a `MutableObjectBinding` only runs when called with `()`, so for that style implement `ObjectValue` and compute the value in `getProperty`:

```java
public final class PlayerQueries implements ObjectValue {
    private final Player player;

    public PlayerQueries(Player player) {
        this.player = player;
    }

    @Override
    public @Nullable ObjectProperty getProperty(@NotNull String name) {
        return switch (name.toLowerCase(Locale.ROOT)) {
            case "health" -> ObjectProperty.property(NumberValue.of(player.getHealth()), false);
            case "is_sneaking" -> ObjectProperty.property(Value.of(player.isCrouching()), false);
            default -> null;
        };
    }
}

molang.scope().set("q", new PlayerQueries(player));
molang.eval("q.is_sneaking ? q.health : 0");
```

:::warning
`getProperty` receives the name exactly as it was written in the expression — `Health` for `q.Health`.
Lowercase it with `Locale.ROOT` yourself, like above. The built-in bindings already do.
:::

PlayerAnimationLibrary does the same in its `QueryBinding`: a `MutableObjectBinding` whose `getProperty` calls the stored `Function` instead of returning it.

## Java classes with `@Binding`

Annotate a class and its static members with `@Binding`, then bind the class:

```java
@Binding("random")
public final class RandomBinding {
    @Binding("select")
    public static float select(float a, float b) {
        return Math.random() < 0.5 ? a : b;
    }

    @Binding("max_roll")
    public static final float MAX_ROLL = 6F;
}

molang.bind(RandomBinding.class);
molang.eval("random.select(1, random.max_roll)"); // 1 or 6
```

- The class's `@Binding` names it in the scope. Give several names for aliases: `@Binding({"random", "rng"})`.
- Methods can take and return `float`, `double`, `int`, `long`, `short`, `boolean` and `String`; arguments are converted from MoLang values. A `void` method evaluates to `0`.
- A parameter annotated with `@Entity` receives the entity, and a parameter of type `ExecutionContext` receives the execution context. Neither consumes a MoLang argument.
- A `Lazy<Value>` parameter receives its argument unevaluated: `get()` evaluates it, so the method decides whether to.
- A varargs parameter, such as `float... values`, receives all the remaining arguments.
- The compiler only supports `@Entity` of these and rejects methods with the others, so call those from interpreted code.

To bind the non-static members of an object instead, use `bindInstance` and choose the names yourself:

```java
public final class PlayerApi {
    private final Player player;

    public PlayerApi(Player player) {
        this.player = player;
    }

    @Binding("health")
    public float health() {
        return player.getHealth();
    }
}

molang.bindInstance(PlayerApi.class, new PlayerApi(player), "player", "p");
molang.eval("p.health()");
```

### Existing methods

`@BindExternalFunction` exposes a static method of another class without writing a wrapper.
Put it on your binding class, once per function:

```java
@Binding("geometry")
@BindExternalFunction(at = Math.class, name = "hypot", args = {double.class, double.class}, pure = true)
@BindExternalFunction(at = Math.class, name = "cbrt", args = {double.class}, pure = true)
public final class GeometryBinding {
}

molang.bind(GeometryBinding.class);
molang.eval("geometry.hypot(3, 4)"); // 5.0
molang.eval("geometry.cbrt(27)");    // 3.0
```

`as = "..."` publishes it under a different name.

### Pure functions

`pure = true` on `@Binding` or `@BindExternalFunction` promises that the function always returns the same result for the same arguments and has no side effects.
The compiler then calls it **while compiling** when all its arguments are constants and puts the result in the class instead.
Don't mark anything that reads game state or randomness as pure.

## Interpreter speed of Java bindings

The compiler calls `@Binding` methods directly. The interpreter calls them through a method handle prepared once, which is a little slower than calling a lambda.
Turn on `warnOnReflectiveFunctionUsage(true)` on the interpreter to print each method called this way to `System.err`, once, and find the ones worth a lambda.

To give the interpreter a lambda while compiled code keeps calling the method, bind the class with a **backing object** that holds a `Function` under the same name.
The backing object must return its properties from `entries()`:

```java
Map<String, ObjectProperty> backing = Map.of("select", ObjectProperty.property(
        (Function<?>) (ctx, args) -> NumberValue.of(RandomBinding.select(
                args.next().eval().getAsNumber(),
                args.next().eval().getAsNumber())),
        false));

ObjectValue backingObject = new ObjectValue() {
    @Override
    public @Nullable ObjectProperty getProperty(@NotNull String name) {
        return backing.get(name);
    }

    @Override
    public @NotNull Map<String, ObjectProperty> entries() {
        return backing;
    }
};

engine.scope().set("random", JavaObjectBinding.of(RandomBinding.class, null, backingObject));
```

Now `engine.interpreter()` runs the lambda for `random.select(...)` and `engine.compiler()` calls the static method.
A backing function must have the same `pure` flag as the method, otherwise `JavaObjectBinding.of` throws.

:::note
`JavaObjectBinding` is marked as an internal API, so this may change between versions.
:::

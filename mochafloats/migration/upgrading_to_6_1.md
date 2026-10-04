---
sidebar_position: 2
description: "What changes when you update mochafloats from 6.0 to 6.1: MoLang that now evaluates like Bedrock, syntax errors, compiled functions, Java bindings and the network format."
---

# Upgrading to 6.1

6.1 doesn't remove or change any public API, so code written for 6.0 compiles against it unchanged.
What changes is the result of some MoLang: 6.1 was checked against Bedrock in the game and now agrees with it, and bugs in the parser, the compiler and the Java bindings are fixed.

## MoLang that evaluates differently

| Expression                                              | 6.0         | 6.1         | Bedrock     |
|---------------------------------------------------------|-------------|-------------|-------------|
| `v.x = 1 ? 5 : 6; return v.x;`                          | `1`         | `5`         | `5`         |
| `1 ? 2 : 3 ? 4 : 5`                                     | `4`         | `2`         | `2`         |
| `v.w = 0; 1 ? { v.w = 4; } : { v.w = 5; }; return v.w;` | `0`         | `4`         | `4`         |
| `v.zero = 0; return v.zero ?? 7;`                       | `7`         | `0`         | `0`         |
| `'a' == 'b'`                                            | `1`         | `0`         | `0`         |
| `math.round(-2.5)`                                      | `-2`        | `-3`        | `-3`        |
| `math.random_integer(1, 3)`                             | 1 or 2      | 1 to 3      | 1 to 3      |
| `math.random(1, 1)`, `math.random(5, 1)`                | throws      | `1`, 1 to 5 | `1`, 1 to 5 |
| `math.die_roll(1, 5, 6)`                                | 1.25 to 2.5 | 5 to 6      | 5 to 6      |
| `v.a = 1;; v.b = 2; return v.b;`                        | `1`         | `2`         | `2`         |

What to look for in existing animations:

- **`v.x = condition ? a : b`** assigns `a` or `b`; 6.0 assigned the condition. Content that wraps the conditional in parentheses, `v.x = (condition ? a : b)`, gives the same result in both versions. For the same reason, `v.a = v.b = 1` sets both variables, where 6.0 set only `v.a`.
- **Chained conditionals:** `a ? 1 : b ? 2 : 3` means `a ? 1 : (b ? 2 : 3)`; 6.0 read it as `(a ? 1 : b) ? 2 : 3`.
- **Blocks in a full conditional**, `c ? { ... } : { ... }`, run; in 6.0 neither block did.
- **`??`** falls back only when the left side doesn't exist: a variable set to `0` is kept.
- **Strings** compare by their text; in 6.0 any two strings were equal.
- **`math.round`** rounds halves away from zero.
- **Random functions** include both bounds and accept them in either order, and `math.die_roll` returns a sum between `count × low` and `count × high`. In 6.0 an equal or reversed pair of bounds made `math.random` and `math.random_integer` throw an exception out of `eval`.

## Syntax errors are reported

| Source               | 6.0                                    | 6.1             |
|----------------------|----------------------------------------|-----------------|
| `1 +`                | an empty script, evaluates to `0`      | parse error     |
| `math.abs(1,)`       | `1`, with `null` as a second argument  | parse error     |
| `v.a = 1;; v.b = 2`  | only `v.a = 1`, the rest is dropped    | both statements |

For the first two, `MolangParser.parseAll` throws a `ParseException`, and `eval(String)` returns `0` and passes the exception to the handler set with `handleParseExceptions`, as for any other syntax error. 6.0 reported neither, and Bedrock rejects both.

## Compiled functions

- A fraction counts as true: with `a = 0.5`, `a && 1` is `1` and `a ? 10 : 20` is `10`. 6.0 cut fractions to whole numbers first, so they were false.
- Dividing by zero gives `0`, and `NaN` or infinities, from arithmetic or returned by a Java method, become `0`, as in the interpreter. A method whose `@Binding` sets `skipChecking = true` is trusted and its result returned as it is.
- `t.*` assignments work in functions that return `double`, `int` or `boolean`; in 6.0 they failed verification.
- `c ? a` without `:` compiles.
- A construct the compiler doesn't support makes `compile` throw an `UnsupportedOperationException` that names it. In 6.0 some of them failed with an `IllegalArgumentException` about the operand stack, `loop` and `for_each` compiled to nothing, so the function returned a wrong value, and methods that take an `ExecutionContext`, a `Lazy` or varargs received `null`.

If `compile` now throws for one of your expressions, evaluate that expression with the interpreter. See [what the compiler supports](../features/compiling.md#what-the-compiler-supports).

## Java bindings

- Interpreted calls are faster: `math.*` functions are called directly instead of through reflection, and other `@Binding` methods through a method handle that is prepared once. An expression with `math.sin` and `math.cos` takes 135 ns instead of 304 ns, and a call to a `@Binding` method 102 ns instead of 174 ns.
- `warnOnReflectiveFunctionUsage(true)` reports each reflectively called method once. 6.0 printed a line on every call, `math.*` included.
- Parameters of type `ExecutionContext`, `Lazy<Value>` and varargs receive their values in interpreted code. In 6.0 they received `null`, and primitive varargs threw a `ClassCastException`.
- A class with a single `@BindExternalFunction` binds it; 6.0 only read repeated annotations.
- A `Function` that returns `null` evaluates to `0`; in 6.0, `q.f() + 1` threw a `NullPointerException`.

## Network format and printing

- The binary format is unchanged, so 6.0 and 6.1 can exchange expressions. The exception is an empty string, `''`: 6.0 can't read it back, whichever version wrote it, and 6.1 reads it from both.
- An unknown operator byte throws an `IllegalArgumentException`; 6.0 read it as the first operator.
- `toString()` keeps the parentheses an expression needs: `(1 + 2) * 3` prints as `(1+2)*3` instead of `1+2*3`, so the printed text parses back into the same expression.
- `break` and `continue` expressions implement `equals` and `hashCode`.

*Times measured with JMH on JDK 25 (Apple Silicon), average per call.*

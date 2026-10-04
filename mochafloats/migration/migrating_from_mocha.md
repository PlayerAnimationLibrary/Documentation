---
sidebar_position: 1
description: "Moving a project from Mocha 3.x to mochafloats: dependency, packages and every changed call."
---

# Migrating from Mocha

mochafloats keeps Mocha's concepts — scopes, bindings, `@Binding`, compiled interfaces — so most code only needs new imports and a few renamed calls.

## 1. Swap the dependency

Remove `team.unnamed:mocha` (and Javassist, if you declared it yourself) and add mochafloats as described in [Installation](../gettingstarted/installation.md).
Make sure the project builds and runs on **Java 24 or newer**.

To keep both the interpreter and the compiler, as Mocha had them, depend on `runtime-compiler`.

## 2. Update the imports

Everything moved from `team.unnamed.mocha` to `org.redlance.mocha`, and a few classes changed packages:

| Mocha 3                                          | mochafloats                                              |
|--------------------------------------------------|----------------------------------------------------------|
| `team.unnamed.mocha.MochaEngine`                 | `org.redlance.mocha.runtime.MochaEngine`                 |
| `team.unnamed.mocha.util.CaseInsensitiveStringHashMap` | `org.redlance.mocha.runtime.util.CaseInsensitiveStringHashMap` |
| `team.unnamed.mocha.parser.ast.DoubleExpression` | `org.redlance.mocha.parser.ast.FloatExpression`          |
| any other `team.unnamed.mocha.X`                 | `org.redlance.mocha.X`                                   |

## 3. Update the calls

`MochaEngine` used to do everything. In mochafloats it only holds an interpreter and a compiler that share one scope:

| Mocha 3                                           | mochafloats                                                         |
|---------------------------------------------------|---------------------------------------------------------------------|
| `MochaEngine.createStandard()`                    | `MochaEngine.createStandard()`, or `MolangInterpreter.standard()` if you don't compile |
| `MochaEngine.create(entity, builder -> ...)`      | `MolangInterpreter.create(entity, builder -> ...)`, wrapped with `MochaEngine.from(...)` if you compile |
| `engine.eval(code)` → `double`                    | `engine.interpreter().eval(code)` → `float`                         |
| `engine.prepareEval(code)` → `MochaFunction`      | `engine.interpreter().prepareEval(code)` → `Supplier<Float>`        |
| `engine.parse(code)`                              | `MolangParser.parseAll(code)`                                       |
| `engine.compile(code)`, `compile(code, type)`     | `engine.compiler().compile(code)`, `compile(code, type)`            |
| `engine.bind(type)`, `bindInstance(...)`          | `engine.interpreter().bind(type)`, `bindInstance(...)`              |
| `engine.warnOnReflectiveFunctionUsage(true)`      | `engine.interpreter().warnOnReflectiveFunctionUsage(true)`          |
| `engine.handleParseExceptions(handler)`           | set it on both `engine.interpreter()` and `engine.compiler()`       |
| `engine.postCompile(consumer)`                    | `engine.compiler().postCompile(consumer)`                           |
| `engine.classPool()`                              | removed, there's no Javassist                                       |
| `new MolangCompiler(entity, classLoader, scope)`  | `new MolangCompiler(entity, scope)`                                 |
| `MochaFunction.evaluate()` → `double`             | `MochaFunction.evaluate()` → `float`                                |

`engine.scope()` still works and returns the shared scope.

## 4. From `double` to `float`

- `Value.getAsNumber()` and `NumberValue.value()` return `float`. `NumberValue.of` accepts both `float` and `double`.
- `ObjectValue.setFunction` takes `FloatFunction1`, `FloatFunction2` and `FloatFunction3` instead of `DoubleFunction1`–`3`, plus a new `FloatFunction` with no arguments. Lambdas usually compile unchanged once their arithmetic is `float`.
- `@Binding` methods may still use `double`; arguments and results are converted. Using `float` avoids the conversions.
- A custom `ExpressionVisitor` overrides `visitFloat` instead of `visitDouble`. Create literals with `FloatExpression.of(value)`; the constructor taking a number is private.
- Compiled interfaces can keep `double` parameters and results, but `float` matches what the compiler computes with.

## 5. Things that behave differently

- `Expression` and `Value` are `sealed`: you can no longer implement `Expression` yourself, and every expression has a `write(ByteBuf)` method for the [network format](../features/serialization.md).
- `toString()` on expressions prints MoLang instead of debug trees like `Call(Access(...))`.
- Expressions that Mocha got wrong now give the right result, for example `-math.sin(90) * 30` is `-30` instead of `0` and `1e3` is `1000` instead of `0`. If your content was tuned around the old results, check it again — see [Why mochafloats?](../why_mochafloats.md) for the full list.
- MoLang evaluates like Bedrock where Mocha didn't: `v.x = c ? 5 : 6` assigns `5` or `6` instead of `c`, strings compare by their text, `??` keeps a `0`, `math.round(-2.5)` is `-3`, and the random functions include both bounds. See [MoLang that evaluates like Bedrock](../why_mochafloats.md#molang-that-evaluates-like-bedrock).
- Syntax Mocha accepted, such as `1 +` or a trailing comma in `math.abs(1,)`, is a parse error.
- Results are floats, so very large or very precise values round differently: `16777217` becomes `16777216`, `0.1 + 0.2` becomes `0.3`.

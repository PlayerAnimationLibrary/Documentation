---
sidebar_position: 1
sidebar_label: "Migrating to mochafloats 6"
description: "Moving a project from Mocha 3, or from mochafloats 5 and earlier, to mochafloats 6: dependencies, packages, the split MochaEngine, floats and what evaluates differently."
---

# Migrating to mochafloats 6

This page moves a project to mochafloats 6 from:

- **Mocha 3** — `team.unnamed:mocha`, the original library.
- **mochafloats 5 or earlier** — `com.zigythebird:mochafloats`, versions 1.0 to 5.0.1. They kept Mocha's `team.unnamed.mocha` packages and its all-in-one `MochaEngine`, and already computed with floats.

mochafloats 6 keeps the same concepts — scopes, bindings, `@Binding`, compiled interfaces — so most code needs a new dependency, new imports and a few renamed calls.
Each step says whom it applies to.

## Before and after

The same code on Mocha 3 and on mochafloats 6. Both print `2.0 30.0 5.0 0.75` for `seconds`, `angle`, `scaled` and `strength`.

```java title="Mocha 3"
import team.unnamed.mocha.MochaEngine;
import team.unnamed.mocha.parser.ast.Expression;
import team.unnamed.mocha.runtime.MochaFunction;
import team.unnamed.mocha.runtime.binding.Binding;
import team.unnamed.mocha.runtime.compiled.MochaCompiledFunction;
import team.unnamed.mocha.runtime.compiled.Named;
import team.unnamed.mocha.runtime.value.MutableObjectBinding;
import team.unnamed.mocha.runtime.value.NumberValue;

@Binding("game")
public final class GameBindings {
    @Binding("ticks_to_seconds")
    public static double ticksToSeconds(double ticks) {
        return ticks / 20;
    }
}

public interface Falloff extends MochaCompiledFunction {
    double apply(@Named("distance") double distance, @Named("radius") double radius);
}

MochaEngine<?> engine = MochaEngine.createStandard();
engine.handleParseExceptions(e -> LOGGER.warn("Invalid MoLang", e));
engine.bind(GameBindings.class);

MutableObjectBinding query = new MutableObjectBinding();
query.set("anim_time", NumberValue.of(1.25));
query.setFunction("scaled", value -> value * 4);
engine.scope().set("query", query);
engine.scope().set("q", query);

double seconds = engine.eval("game.ticks_to_seconds(40)");

List<Expression> wave = engine.parse("math.sin(q.anim_time * 72) * 30");
double angle = engine.eval(wave);

MochaFunction prepared = engine.prepareEval("q.scaled(q.anim_time)");
double scaled = prepared.evaluate();

Falloff falloff = engine.compile("math.clamp(1 - distance / radius, 0, 1)", Falloff.class);
double strength = falloff.apply(2, 8);
```

```java title="mochafloats 6"
import org.redlance.mocha.parser.MolangParser;
import org.redlance.mocha.parser.ast.Expression;
import org.redlance.mocha.runtime.MochaEngine;
import org.redlance.mocha.runtime.binding.Binding;
import org.redlance.mocha.runtime.compiled.MochaCompiledFunction;
import org.redlance.mocha.runtime.compiled.Named;
import org.redlance.mocha.runtime.value.MutableObjectBinding;
import org.redlance.mocha.runtime.value.NumberValue;

@Binding("game")
public final class GameBindings {
    @Binding("ticks_to_seconds")
    public static float ticksToSeconds(float ticks) {
        return ticks / 20;
    }
}

public interface Falloff extends MochaCompiledFunction {
    float apply(@Named("distance") float distance, @Named("radius") float radius);
}

MochaEngine<?> engine = MochaEngine.createStandard();
engine.interpreter().handleParseExceptions(e -> LOGGER.warn("Invalid MoLang", e));
engine.compiler().handleParseExceptions(e -> LOGGER.warn("Invalid MoLang", e));
engine.interpreter().bind(GameBindings.class);

MutableObjectBinding query = new MutableObjectBinding();
query.set("anim_time", NumberValue.of(1.25F));
query.setFunction("scaled", value -> value * 4);
engine.scope().set("query", query);
engine.scope().set("q", query);

float seconds = engine.interpreter().eval("game.ticks_to_seconds(40)");

List<Expression> wave = MolangParser.parseAll("math.sin(q.anim_time * 72) * 30");
float angle = engine.interpreter().eval(wave);

Supplier<Float> prepared = engine.interpreter().prepareEval("q.scaled(q.anim_time)");
float scaled = prepared.get();

Falloff falloff = engine.compiler().compile("math.clamp(1 - distance / radius, 0, 1)", Falloff.class);
float strength = falloff.apply(2, 8);
```

On mochafloats 5 the first version works once `double` becomes `float`.

## 1. Swap the dependency

*Everyone.*

| You depend on                                                          | Replace it with                              |
|------------------------------------------------------------------------|----------------------------------------------|
| `team.unnamed:mocha`, and `org.javassist:javassist` if you declared it  | `org.redlance.mochafloats:runtime-compiler`  |
| `com.zigythebird:mochafloats`                                          | `org.redlance.mochafloats:runtime-compiler`  |

The old artifacts were a single jar with both the interpreter and the compiler; `runtime-compiler` is the module that has both.
If you never compile expressions, depend on `runtime` instead. The repository and the build snippets are on [Installation](../gettingstarted/installation.md).

- mochafloats 6 needs **Java 24 or newer**, like mochafloats 5. Mocha 3 and mochafloats 1.0 ran on Java 8, and mochafloats 1.1 to 4.x on Java 16 or 17.
- A mod that bundles the library in its jar now bundles `lexer`, `parser`, `runtime` and, if it compiles, `runtime-compiler` — see [Bundling it inside a Minecraft mod](../gettingstarted/installation.md#bundling-it-inside-a-minecraft-mod).
- If your mod gets mochafloats through PlayerAnimationLibrary, don't add it yourself — see the tip in [Which module do I need?](../gettingstarted/installation.md#which-module-do-i-need)

## 2. Update the imports

*Everyone.*

Replace `team.unnamed.mocha` with `org.redlance.mocha`. Every class keeps its name and subpackage, except these:

| Before                                                          | mochafloats 6                                                       |
|-----------------------------------------------------------------|---------------------------------------------------------------------|
| `team.unnamed.mocha.MochaEngine`                                | `org.redlance.mocha.runtime.MochaEngine`                            |
| `team.unnamed.mocha.util.CaseInsensitiveStringHashMap`          | `org.redlance.mocha.runtime.util.CaseInsensitiveStringHashMap`      |
| `team.unnamed.mocha.util.ExprBytesUtils`                        | `org.redlance.mocha.parser.util.ExprBytesUtils`                     |
| `team.unnamed.mocha.util.ExpressionListUtils`                   | `org.redlance.mocha.parser.util.ExpressionListUtils`                |
| `team.unnamed.mocha.util.network.ProtocolUtils`, `VarIntUtils`  | `org.redlance.mocha.parser.util.network.ProtocolUtils`, `VarIntUtils` |
| `team.unnamed.mocha.parser.ast.DoubleExpression` (Mocha 3)      | `org.redlance.mocha.parser.ast.FloatExpression`                     |

This command renames them all in your Java and Kotlin sources, the moved classes included:

```bash
grep -rl --include='*.java' --include='*.kt' 'team\.unnamed\.mocha' . | xargs perl -pi -e '
  s/team\.unnamed\.mocha\.MochaEngine\b/org.redlance.mocha.runtime.MochaEngine/g;
  s/team\.unnamed\.mocha\.util\.CaseInsensitiveStringHashMap\b/org.redlance.mocha.runtime.util.CaseInsensitiveStringHashMap/g;
  s/team\.unnamed\.mocha\.util\.(ExprBytesUtils|ExpressionListUtils|network)\b/org.redlance.mocha.parser.util.$1/g;
  s/team\.unnamed\.mocha\.parser\.ast\.DoubleExpression\b/org.redlance.mocha.parser.ast.FloatExpression/g;
  s/team\.unnamed\.mocha\./org.redlance.mocha./g'
```

## 3. Update the calls

*Everyone.*

`MochaEngine` used to parse, evaluate, compile and bind by itself. In mochafloats 6 it's a class that holds an interpreter and a compiler sharing one scope:

| Before                                               | mochafloats 6                                                          |
|------------------------------------------------------|------------------------------------------------------------------------|
| `MochaEngine.createStandard()`, `create()`, and their forms taking an entity | unchanged, or `MolangInterpreter.standard()` and `create()` if you don't compile |
| `MochaEngine.create(entity, builder -> ...)`         | `MochaEngine.from(MolangInterpreter.create(entity, builder -> ...))`   |
| `engine.eval(...)`, every overload                   | `engine.interpreter().eval(...)`                                       |
| `engine.prepareEval(...)` → `MochaFunction`          | `engine.interpreter().prepareEval(...)` → `Supplier<Float>`            |
| `engine.parse(code)`                                 | `MolangParser.parseAll(code)`                                          |
| `engine.compile(...)`, every overload                | `engine.compiler().compile(...)`                                       |
| `engine.bind(type)`, `engine.bindInstance(...)`      | `engine.interpreter().bind(type)`, `bindInstance(...)`                 |
| `engine.warnOnReflectiveFunctionUsage(true)`         | `engine.interpreter().warnOnReflectiveFunctionUsage(true)`             |
| `engine.handleParseExceptions(handler)`              | set it on both `engine.interpreter()` and `engine.compiler()`          |
| `engine.postCompile(consumer)`                       | `engine.compiler().postCompile(consumer)`                              |
| `engine.scope()`                                     | unchanged: the scope both share                                        |

A `Supplier<Float>` boxes every result. In hot code, keep the parsed `List<Expression>` and call `eval(list)`, which returns a primitive `float`.

*Mocha 3 and mochafloats 4 or earlier*, which compiled with Javassist:

| Before                                           | mochafloats 6                        |
|--------------------------------------------------|--------------------------------------|
| `new MolangCompiler(entity, classLoader, scope)` | `new MolangCompiler(entity, scope)`  |
| `engine.classPool()`, `compiler.classPool()`     | removed, there's no Javassist        |

## 4. From `double` to `float`

*Mocha 3 only.* Every mochafloats version already computes with floats.

- `Value.getAsNumber()`, `NumberValue.value()` and `MochaFunction.evaluate()` return `float`. `Value.of` and `NumberValue.of` accept both `float` and `double`.
- `ObjectValue.setFunction` takes `FloatFunction1`, `FloatFunction2` and `FloatFunction3` instead of `DoubleFunction1`–`3`, plus `FloatFunction` with no arguments. Lambdas usually compile unchanged once their arithmetic is `float`.
- The static methods of `MochaMath` and its `PI` constant are `float`.
- `@Binding` methods may still use `double`; arguments and results are converted. Using `float` avoids the conversions.
- A custom `ExpressionVisitor` overrides `visitFloat` instead of `visitDouble`. Create literals with `FloatExpression.of(value)`; the constructor taking a number is private.
- Compiled interfaces can keep `double` parameters and results, but `float` matches what the compiler computes with.

## 5. Other API changes

*Mocha 3 and early mochafloats versions.* mochafloats 5 already worked this way.

- `Expression` and `Value` are `sealed`: you can no longer implement `Expression` yourself.
- Every expression has a `write(ByteBuf)` method for the [network format](../features/serialization.md).
- `toString()` on an expression prints MoLang instead of debug trees like `Call(Access(...))`.

## 6. What evaluates differently

Content tuned around the old results may need another look.

**From Mocha 3:**

- Expressions Mocha got wrong give the right result: `-math.sin(90) * 30` is `-30` instead of `0`, and `1e3` is `1000` instead of `0`. [Why mochafloats?](../why_mochafloats.md) has the full list.
- MoLang evaluates like Bedrock where Mocha didn't: `v.x = c ? 5 : 6` assigns `5` or `6` instead of `c`, strings compare by their text, `??` keeps a `0`, `math.round(-2.5)` is `-3`, and the random functions include both bounds. See [MoLang that evaluates like Bedrock](../why_mochafloats.md#molang-that-evaluates-like-bedrock).
- Syntax Mocha accepted, such as `1 +` or a trailing comma in `math.abs(1,)`, is a parse error.
- Results are floats, so very large or very precise values round differently: `16777217` becomes `16777216`, and `0.1 + 0.2` is `0.3` instead of `0.30000000000000004`.

**From mochafloats 5 or earlier:**

- mochafloats 5.0.1 evaluates like mochafloats 6.0, so everything in [Upgrading to 6.1](./upgrading_to_6_1.md) applies: the same table of Bedrock results, syntax errors, compiled functions and Java bindings.
- Before 5.0.1, a minus or `!` in front of a function call evaluated to `0`: `-math.sin(90) * 30` was `0` instead of `-30`, and `!math.abs(0)` was `0` instead of `1`.

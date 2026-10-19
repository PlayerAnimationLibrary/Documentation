---
sidebar_position: 1
description: "How to add mochafloats to a Gradle or Maven project, and which module to pick."
---

import MochaFloatsVersion from '@site/src/components/MochaFloatsVersion';

# Installation

## Requirements

mochafloats needs **Java 24 or newer**: every module is compiled for Java 24, and the compiler uses the ClassFile API that became final in that release.
Minecraft 26.1 and newer already runs on Java 25.

The latest version is <MochaFloatsVersion />.

## Which module do I need?

| If you want to…                                              | Depend on          |
|--------------------------------------------------------------|--------------------|
| Parse MoLang, inspect the syntax tree or send it over the network | `parser`      |
| Evaluate MoLang                                              | `runtime`          |
| Evaluate MoLang **and** compile it to bytecode               | `runtime-compiler` |

Every module pulls in the ones below it (`runtime-compiler` → `runtime` → `parser` → `lexer`), so declare only one.

:::tip
If your mod already depends on [PlayerAnimationLibrary](/pal/intro), you already have mochafloats: PAL exposes `runtime` as an API dependency and ships `lexer`, `parser` and `runtime` inside its jar.
Don't bundle a second copy. If you also need the compiler, add `runtime-compiler` with the same version PAL uses.
:::

## Gradle

`gradle.properties`:

```properties
mochafloats_version = <latest version from above>
```

`build.gradle` / `build.gradle.kts` (the snippet works in both the Groovy and the Kotlin DSL):

```gradle
repositories {
    mavenCentral()
    maven {
        name = "RedlanceMinecraft"
        url = uri("https://repo.redlance.org/public")
    }
}

dependencies {
    implementation("org.redlance.mochafloats:runtime:${property("mochafloats_version")}")
}
```

Swap `runtime` for `parser` or `runtime-compiler` according to the table above.

## Maven

```xml
<repositories>
    <repository>
        <id>redlance</id>
        <url>https://repo.redlance.org/public</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>org.redlance.mochafloats</groupId>
        <artifactId>runtime</artifactId>
        <version>6.1.0</version> <!-- the latest version from above -->
    </dependency>
</dependencies>
```

## Transitive dependencies

- `parser` depends on Netty's `netty-buffer`, which it uses for the [network format](../features/serialization.md). Minecraft already ships Netty.
- The POMs also list `org.jetbrains:annotations` and `com.google.j2objc:j2objc-annotations`. They only contain annotations and aren't needed at runtime.

Nothing else: there's no Javassist or other bytecode library.

## Bundling it inside a Minecraft mod

If your mod ships mochafloats inside its own jar (jar-in-jar), embed the mochafloats modules themselves and nothing they depend on:

- `lexer`, `parser` and `runtime` — plus `runtime-compiler` if you compile expressions.
- **Not** Netty: Minecraft provides it, so disable transitive dependencies for the embedded artifacts.

With Fabric Loom, for example:

```groovy
dependencies {
    implementation("org.redlance.mochafloats:runtime:${property("mochafloats_version")}")

    include("org.redlance.mochafloats:lexer:${property("mochafloats_version")}") { transitive = false }
    include("org.redlance.mochafloats:parser:${property("mochafloats_version")}") { transitive = false }
    include("org.redlance.mochafloats:runtime:${property("mochafloats_version")}") { transitive = false }
}
```

In the Kotlin DSL the closure is `{ isTransitive = false }`.

On NeoForge, use your build plugin's jar-in-jar configuration (`jarJar` in ModDevGradle) the same way.
The jars declare `FMLModType: GAMELIBRARY` in their manifest, so NeoForge loads them next to your mod, and compiled functions can implement your mod's interfaces — something that crashes with Mocha ([#27](https://github.com/unnamed/mocha/issues/27)).

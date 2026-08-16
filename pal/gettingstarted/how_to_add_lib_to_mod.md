---
sidebar_position: 1
sidebar_label: "Adding the library"
description: "How to add PlayerAnimationLibrary to your Gradle project."
---

import MavenVersion from '@site/src/components/MavenVersion';

# How to add the library to your mod's project

## Versions

Pick the PAL version that matches the Minecraft version you are targeting (the latest versions are fetched automatically):

| Minecraft Version | PAL Version                          | Status      |
|-----------------|--------------------------------------|-------------|
| 26.2            | <MavenVersion mcVersion="26.2" />    | Supported   |
| 26.1.X          | <MavenVersion mcVersion="26.1" />    | Supported   |
| 1.21.11         | <MavenVersion mcVersion="1.21.11" /> | Supported   |
| 1.21.9-10       | <MavenVersion mcVersion="1.21.9" />  | Unsupported |
| 1.21.8          | <MavenVersion mcVersion="1.21.8" />  | Unsupported |
| 1.21.7          | <MavenVersion mcVersion="1.21.7" />  | Unsupported |
| 1.21.1          | <MavenVersion mcVersion="1.21.1" />  | Supported   |

## Gradle properties

`gradle.properties`:

```properties
pal_version = <latest version from the table above>
```

## Maven repository

`build.gradle` / `build.gradle.kts`:

```gradle
repositories {
    mavenCentral()
    maven {
        name = "RedlanceMinecraft"
        url = uri("https://repo.redlance.org/public")
    }
}
```

## Dependencies

Add the dependency for the loader you are using.

:::note
The snippets below are written so they work in both the Groovy and the Kotlin DSL.
In the Kotlin DSL you can also pull the property out once and interpolate it directly:

```kotlin
val pal_version: String by project

dependencies {
    implementation("com.zigythebird.playeranim:PlayerAnimationLibFabric:$pal_version")
}
```
:::

:::info
Minecraft is no longer obfuscated starting from 26.1, so there is nothing left to remap and Loom dropped its remapping configurations.
On 26.1 and newer use the plain Gradle configurations, on older versions keep using the `mod` ones:

| 26.1+            | 1.21.11 and older   |
|------------------|---------------------|
| `implementation` | `modImplementation` |
| `api`            | `modApi`            |
:::

### Fabric

```gradle
// 26.1+
implementation("com.zigythebird.playeranim:PlayerAnimationLibFabric:${property("pal_version")}")

// 1.21.11 and older
modImplementation("com.zigythebird.playeranim:PlayerAnimationLibFabric:${property("pal_version")}")
```

### NeoForge

```gradle
implementation("com.zigythebird.playeranim:PlayerAnimationLibNeo:${property("pal_version")}")
```

### Architectury — common

```gradle
// 26.1+
api("com.zigythebird.playeranim:PlayerAnimationLibCommon:${property("pal_version")}")
implementation("com.zigythebird.playeranim:PlayerAnimationLibCommon:${property("pal_version")}")

// 1.21.11 and older
modApi("com.zigythebird.playeranim:PlayerAnimationLibCommon:${property("pal_version")}")
implementation("com.zigythebird.playeranim:PlayerAnimationLibCommon:${property("pal_version")}")
```

### Architectury — NeoForge

```gradle
// 26.1+
implementation("com.zigythebird.playeranim:PlayerAnimationLibNeo:${property("pal_version")}")

// 1.21.11 and older
modImplementation("com.zigythebird.playeranim:PlayerAnimationLibNeo:${property("pal_version")}")
```

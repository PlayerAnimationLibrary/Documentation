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

`build.gradle`:

```groovy
repositories {
    mavenCentral()
    maven {
        name = "RedlanceMinecraft"
        url = "https://repo.redlance.org/public"
    }
}
```

## Dependencies

Add the dependency for the loader you are using.

### Fabric

```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibFabric:$pal_version"
```

### NeoForge

```groovy
implementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$pal_version"
```

### Architectury — common

```groovy
modApi "com.zigythebird.playeranim:PlayerAnimationLibCommon:$pal_version"
implementation "com.zigythebird.playeranim:PlayerAnimationLibCommon:$pal_version"
```

### Architectury — NeoForge

```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$pal_version"
```

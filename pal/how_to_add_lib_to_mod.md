---
sidebar_position: 2
description: "How to add PlayerAnimationLibrary to your Gradle project."
---

# How to add the library to your mod's project

Gradle Properties:
```properties
pal_version = 1.1.3+alpha.2+mc.1.21.11
```
There is also a 1.21.1 version!: `pal_version = 1.1.3+mc.1.21.1`
And a 1.21.9-10 version!: `pal_version = 1.1.3+mc.1.21.9`
There is also a 1.21.7-8 version, but it's no longer supported, so I don't recommend using it.

Maven Repository:
```groovy
mavenCentral()
maven {
    name = "RedlanceMinecraft"
    url = "https://repo.redlance.org/public"
}
```

Architectury Common:
```groovy
modApi "com.zigythebird.playeranim:PlayerAnimationLibCommon:$rootProject.pal_version"
implementation "com.zigythebird.playeranim:PlayerAnimationLibCommon:$rootProject.pal_version"
```

Architectury NeoForge:
```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$rootProject.pal_version"
```

Fabric:
```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibFabric:$project.pal_version"
```

NeoForge:
```groovy
implementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$project.pal_version"
```
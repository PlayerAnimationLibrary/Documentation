---
sidebar_position: 2
description: "How to add PlayerAnimationLibrary to your Gradle project."
---

import MavenVersion from '@site/src/components/MavenVersion';

# How to add the library to your mod's project

Gradle Properties (latest versions are fetched automatically):

| Minecraft Version | PAL Version |
|---|---|
| 1.21.11 | <MavenVersion mcVersion="1.21.11" /> |
| 1.21.9-10 | <MavenVersion mcVersion="1.21.9" /> |
| 1.21.1 | <MavenVersion mcVersion="1.21.1" /> |

```properties
pal_version = <latest version from the table above>
```

:::warning
The 1.21.7-8 version is no longer supported, so I don't recommend using it.
:::

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
modApi "com.zigythebird.playeranim:PlayerAnimationLibCommon:$pal_version"
implementation "com.zigythebird.playeranim:PlayerAnimationLibCommon:$pal_version"
```

Architectury NeoForge:
```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$pal_version"
```

Fabric:
```groovy
modImplementation "com.zigythebird.playeranim:PlayerAnimationLibFabric:$pal_version"
```

NeoForge:
```groovy
implementation "com.zigythebird.playeranim:PlayerAnimationLibNeo:$pal_version"
```

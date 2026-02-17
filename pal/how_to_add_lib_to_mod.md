---
sidebar_position: 2
description: "How to add PlayerAnimationLibrary to your Gradle project."
---

import MavenVersion from '@site/src/components/MavenVersion';

# How to add the library to your mod's project

Gradle Properties (latest versions are fetched automatically):

| Minecraft Version | PAL Version | Status |
|---|---|---|
| 1.21.11 | <MavenVersion mcVersion="1.21.11" /> | Supported |
| 1.21.9-10 | <MavenVersion mcVersion="1.21.9" /> | Unsupported |
| 1.21.8 | <MavenVersion mcVersion="1.21.8" /> | Unsupported |
| 1.21.7 | <MavenVersion mcVersion="1.21.7" /> | Unsupported |
| 1.21.1 | <MavenVersion mcVersion="1.21.1" /> | Supported |

```properties
pal_version = <latest version from the table above>
```

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

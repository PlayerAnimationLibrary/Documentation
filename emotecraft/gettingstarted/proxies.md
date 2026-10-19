---
sidebar_position: 5
description: "Configuring Emotecraft behind Velocity, BungeeCord and other proxies."
---

# Proxies
This section covers what you need to configure to run Emotecraft behind a proxy (Velocity, BungeeCord, etc.).

Emotecraft synchronizes emotes between players using plugin messages (custom payloads). Every emote — including [custom ones](./customemotes.md) — is sent over the network in full, and an emote can be larger than the default plugin message size limit some proxies and server cores enforce. Without this fix affected players may be kicked with a `Payload may not be larger than ... bytes` error.

:::warning
By default many proxies and Bukkit-based cores limit **every** plugin message to `32767` bytes.

In Minecraft `32767` bytes is the maximum size of an **unregistered** payload. Mod payloads (like the ones Emotecraft uses) are **registered**, and registered channels are allowed a much larger size — equal to the standard vanilla limit of `1048576` bytes (1 MiB). The fixes below simply lift the `32767` cap for these registered channels.
:::

## Velocity

Velocity caps the maximum **serverbound** plugin message payload at `32767` bytes by default, which is too small for larger emotes. Raise it to `1048576` bytes (1 MiB, the vanilla limit) by adding the following JVM argument when starting the proxy:

```
-Dvelocity.max-plugin-message-payload-size=1048576
```

For example:

```
java -Dvelocity.max-plugin-message-payload-size=1048576 -jar velocity.jar
```

:::info
`velocity.max-plugin-message-payload-size` sets the limit for **both** directions at once. The clientbound limit is already `1048576` by default, but setting both keeps things working even if those defaults change in a future Velocity version.
:::

## BungeeCord / Waterfall

BungeeCord has the same problem as Velocity — it caps **serverbound** plugin messages at `32767` bytes ([source](https://github.com/SpigotMC/BungeeCord/blob/master/protocol/src/main/java/net/md_5/bungee/protocol/packet/PluginMessage.java)) — but unlike Velocity this limit is **hardcoded and cannot be changed** (no config option or JVM argument exists, see [#3509](https://github.com/SpigotMC/BungeeCord/issues/3509)).

:::warning
There is currently no way to fix this on BungeeCord. If you need larger emotes to work behind a proxy, use **Velocity** instead.
:::

A [pull request (#3571)](https://github.com/SpigotMC/BungeeCord/pull/3571) that would add a similar configurable limit has been opened, but it is **not merged yet**.

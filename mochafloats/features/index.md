---
description: "What mochafloats does beyond interpreting MoLang: compiling it to bytecode and sending it over the network."
---

# Features

Beyond interpreting MoLang, mochafloats can:

- [Compile expressions to bytecode](./compiling.md) — turn hot expressions into JVM classes that run as fast as hand-written Java.
- [Send expressions over the network](./serialization.md) — write parsed expressions to a Netty `ByteBuf` and read them back without parsing the text again, or print them as MoLang.

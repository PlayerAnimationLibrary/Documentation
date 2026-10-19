---
sidebar_position: 2
sidebar_label: "Network format"
description: "Writing parsed MoLang expressions to a Netty ByteBuf and reading them back, and printing them as text."
---

# Sending expressions over the network

The `parser` module can write parsed expressions to a Netty `ByteBuf` and read them back.
The receiving side gets a ready syntax tree: it never parses text, so it can't hit a syntax error.

Minecraft's `FriendlyByteBuf` is a `ByteBuf`, so you can pass the packet buffer directly.

```java
List<Expression> expressions = MolangParser.parseAll("math.sin(q.anim_time * 360) * 30");

// sender
ExprBytesUtils.writeExpressions(expressions, buf);

// receiver
List<Expression> received = ExprBytesUtils.readExpressions(buf);
float value = molang.eval(received);
```

`writeExpression` and `readExpression` do the same for a single expression.
Evaluating an expression doesn't change it, so one parsed list can be written to many players and shared between interpreters.

PlayerAnimationLibrary's binary animation format, which is what it sends over the network, stores every keyframe value this way.

## The format

Every expression is one byte with its type, followed by its contents:

| Id | Expression                         | Contents                                   |
|----|------------------------------------|--------------------------------------------|
| 0  | Unary (`-x`, `!x`, `return x`)     | operator, expression                       |
| 1  | Conditional (`c ? a : b`)          | three expressions                          |
| 2  | String                             | string                                     |
| 3  | `break` / `continue`               | operator                                   |
| 4  | Name (`math`, `v`)                 | string                                     |
| 5  | Number                             | 4-byte float                               |
| 6  | Block (`{ ... }`)                  | list of expressions                        |
| 7  | Call                               | expression, list of arguments              |
| 8  | Binary (`a + b`, `a = b`, ...)     | operator, two expressions                  |
| 9  | Array index (`a[i]`)               | two expressions                            |
| 10 | Property access (`a.b`)            | expression, string                         |

Strings are UTF-8 with a [VarInt](https://minecraft.wiki/w/Java_Edition_protocol/Data_types#VarInt_and_VarLong) length in front, lists are a VarInt count followed by the elements, and operators are a single byte.

- The format has no version number, and operators are stored by their position in mochafloats' operator lists. Make sure both sides use the same mochafloats version.
- It saves parsing, not bandwidth: the result is usually a little longer than the source text.

`VarIntUtils` and `ProtocolUtils` are public too, if you want the same VarInts, strings and lists in your own packets.

## Printing expressions as text

`toString()` on a parsed expression prints it in MoLang syntax, and `ExpressionListUtils.toString(list)` joins a whole script with `;`:

```java
List<Expression> expressions = MolangParser.parseAll("v.a = 2; return math.sin(q.anim_time * 50) * 45;");
ExpressionListUtils.toString(expressions); // v.a=2;return (math.sin(q.anim_time*50)*45)
```

The printed text keeps the parentheses the expression needs — `(1 + 2) * 3` prints as `(1+2)*3` — so parsing it again gives the same expression.
It isn't the original text, though: spaces are gone, and parentheses that don't change the meaning may be added or left out. Keep the source if you want to show people what they wrote.

---
description: "Information about emote creation, limitations, and additional features."
---

# Creating Emotes

This section includes information about emote creation, limitations, and additional features.

# Creating text components
All the text you write in the `author`, `name` and `description` fields is a text component of Minecraft that supports formatting, translations, etc.
To decorate text, use [Text Component Generator](https://misode.github.io/text-component/), it will also help you create badges later on.

# Additional features

## MoLang
Emotes made in Blockbench or Blender can compute keyframe values while they play instead of baking them into keyframes, which is how you react to the player's state or build motion that never repeats itself.
See [the page on MoLang](./molang.md).

## Badges (1.21.4+)
You can use [text components](/emotecraft/creatingemotes/) to create badges. You can have multiple of them!
Here's a part of an emote file with badges:
```json5
{
    "name": "A super cool emote with badges",
    "bages": [
        {
            "text": "a red badge with regular text",
            "color": "#ff0000"
        },
        {
            "translate": "badge.key",
            "fallback": "Green badge with translatable text",
            "color": "#00ff00"
        }
    ],
    "emote": {...}
}
```

# Limitations
- The max size of the emote packet is limited to 1mb (32kb in older versions)

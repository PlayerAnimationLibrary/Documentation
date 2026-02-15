---
sidebar_position: 2
description: "How to create emotes using Blockbench."
---

# Creating Emotes With Blockbench

:::note

This is not a tutorial on how you can use Blockbench as a whole.  
If you don't know how to use Blockbench then you need to find a way to learn that yourself.

:::

First you need to install the GeckoLib Animation Utils plugin in Blockbench.  
Then grab a .bbmodel from our [GitHub](https://github.com/KosmX/emotes/tree/dev/blender).  
Then just open it and get started!

# Extra data
To specify the author, description, or anything else, you must use the `player_animation_library` key in your animation JSON:

```json5
{
  "format_version": "1.8.0",
  "animations": {
    "animation_name": {
      "player_animation_library": {
        "name": "My animation",
        "description": "My first animation",
        "author": "dima_dencep"
      },
      "bones": {...}
    }
  },
  "geckolib_format_version": 2
}
```

You can store whatever data you want in it, and PAL will load them!  
Though Emotecraft only uses data it's interested in, like the data in the example.  
If no name is specified in the extra data then the animation name specified in Blockbench is used.

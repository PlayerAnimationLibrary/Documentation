---
sidebar_position: 4
description: "How to add custom pivot points and bones to emotes."
---

# Custom Pivot Points/Bones
You can add custom bones to the Blockbench model AS LONG AS THEY ARE A CHILD OF THE BODY BONE.
For example you could add a hip bone that rotates all the bones except the legs around well... the hips.
But for this to work you have to register the new bone you have created by adding something like this to the animation JSON:
```json5
{
  "model": {
    "bone_name": {
      "pivot": [0, 12, 0]
    }
  },
  "parents": {
    "right_arm": "bone_name",
    "left_arm": "bone_name",
    "torso": "bone_name",
    "head": "bone_name"
  }
}
```
You can either add this to the root of the JSON or under a specific animation.
Replace `bone_name` with the name of your custom bone.
Replace the bones in parents with whatever bones are the children of your custom bone.
And last but not least replace the pivot value with the pivot point of your custom bone.
You can add as many custom bones as you want, and even have custom bones with other custom bones as their children.
You could also add a bone with no children as some sort of marker.

:::warning

If you have read the fading in/out page of the wiki you know that `endTick` uses the easing of the last keyframe.
Well, this does not apply to custom bones.
So if the bones affected by a custom bone have a keyframe their easings will be used, if not then it will default to in out sine.

:::

## Custom Model Bones

Custom bones can also have their own 3D model attached. This allows you to render custom geometry that moves with the bone during animations.

To add a model to a custom bone, include `texture` and `elements` fields alongside `pivot` in the `model` section:

```json5
{
  "model": {
    "bone_name": {
      "pivot": [0, 12, 0],
      "texture": "<base64 encoded PNG>",
      "elements": [
        {
          "from": [0, 0.25, 0],
          "to": [16, 0.25, 16],
          "faces": {
            "down": { "uv": [0, 16, 16, 0], "texture": "#texture", "tintindex": 0 },
            "up": { "uv": [0, 0, 16, 16], "texture": "#texture", "tintindex": 0 }
          }
        }
      ]
    }
  },
  "animations": {
    "my_animation": {
      "loop": true,
      "bones": {
        "bone_name": {
          "rotation": {
            "vector": [0, "q.anim_time * 20", 0]
          }
        }
      }
    }
  }
}
```

- `texture` — a base64-encoded PNG image used as the texture for the model.
- `elements` — an array of block model elements, using the same format as [Minecraft block models](https://minecraft.wiki/w/Tutorials/Models#Block_models). Each element can have `from`, `to`, `faces`, and `rotation` fields.

:::info

`texture` and `elements` are optional. If they are not provided, the bone will act as a regular pivot bone without any visible model.

:::

### Custom Emote Bones Editor

Instead of manually writing the `texture` and `elements` fields, you can use the [Custom Emote Bones Editor](/ceb_editor.html) to attach existing Minecraft models (.json or .bbmodel) to bones in your animation.

The editor allows you to:
1. Load your emote JSON
2. Load a Minecraft model (.json or .bbmodel)
3. Map textures (automatic for .bbmodel files with embedded textures)
4. Select a target bone
5. Merge the model into the bone and build a texture atlas automatically
6. Save the resulting JSON

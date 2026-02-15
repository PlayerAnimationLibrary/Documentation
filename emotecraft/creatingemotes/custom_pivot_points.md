---
sidebar_position: 4
description: "How to add custom pivot points and bones to emotes."
---

# Custom Pivot Points/Bones
You can add custom bones to the Blockbench model AS LONG AS THEY ARE A CHILD OF THE BODY BONE.   
For example you could add a hip bone that rotates all the bones except the legs around well... the hips.  
But for this to work you have to register the new bone you have created by adding something like this to the animation JSON:
```json5
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
  },
```
You can either add this to the root of the JSON or under a specific animation.  
Replace `bone_name` with the name of your custom bone.  
Replace the bones in parents which whatever bones are the children of your custom bone.  
And last but not least replace the pivot value with the pivot point of your custom bone.  
You can add as many custom bones as you want, and even have custom bones with other custom bones as their children.  
You could also add a bone with no children as some sort of marker.  

:::warning

If you have read the fading in/out page of the wiki you know that `endTick` uses the easing of the last keyframe.  
Well, this does not apply to custom bones.  
So if the bones affected by a custom bone have a keyframe their easings will be used, if not then it will default to in out sine.  

:::
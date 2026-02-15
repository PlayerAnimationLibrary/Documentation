---
sidebar_position: 1
description: "How to create emotes using Blender rigs."
---

# Creating Emotes With Blender

To make emotes in Blender, you need to use one of the available rigs on the Emotecraft's [GitHub](https://github.com/KosmX/emotes/tree/dev/blender). Please read the readme.    
This guide is based on the `emote_creator_bend_item_scale` one as it has more features. The process will be roughly the same with other rigs.    
It is expected that you are already familiar with Blender in some way. If you are not, please read the [Blender Documentation](https://docs.blender.org/manual/en/latest/) first. I recommend reading `User Interface`, `Editors`, `Scenes & Objects` and `Animation` sections.

# How do I make emotes??
You place all the keyframes you want on the body parts, go to the `Export` tab, change the contents of the variables for your liking and run the script. Your emote will be placed in the same directory as the rig.    

:::warning
All keyframes on tick 0 are ignored, they must be on tick 1 and above!!!
Items are animated with the `rightItem` and `leftItem` objects, not the sword models!
:::

Press F12 to make an icon for your emote. You can set up the camera however you want.

# You may not
- Change relations between body parts (See the Tricks section for a hint on doing that anyway)
- Scale bend objects (scale their parents instead)

# Limitations
- `Bezier` interpolation is replaced with `QUAD`
- `Automatic` easing is replaced with `INOUT`
- The script reads keyframes only, so you can't use `Graph Editor`, `Drivers` and `Nonlinear Animation` (You have to bake animation data that uses those editors)
- Scaled item's position gets exported incorrectly (Location needs to be divided by scale on corresponding axes, but it can't be done well without baking)

# Tricks
Baking the animation is your best friend. It allows to use nearly any animation feature in Blender.
Baking the animation enables you to use `Bezier` interpolation and `Automatic` easing as it gets baked into keyframes that the script can read. The same with `Graph Editor`, `Drivers` and `Nonlinear Animation` editors.

# Changing parts' hierarchy
You can add a new object and make a body part follow it with the `Copy Transforms` constraint. Now it is independent! Animate this new object, bake animation on the original part so it actually has frames on it, export the emote and see the magic appear in the game!

# You can use armatures!
Now repeat the process for every part, attach the support objects to an armature via the `Armature` constraint. This allows you to have IK and other useful features of armatures.

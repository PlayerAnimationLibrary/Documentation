---
sidebar_position: 1
description: "How to create emotes using Blender rigs."
---

# Creating Emotes With Blender

To make emotes in Blender, you need to use one of the available rigs on Emotecraft's [GitHub](https://github.com/KosmX/emotes/tree/dev/blender). Please read the README.md.    
This guide is based on the `emote_creator` one as it has more features.  
It is expected for you to already be familiar with Blender in some way. If you are not, please read the [Blender Documentation](https://docs.blender.org/manual/en/latest/) first. I recommend reading the `User Interface`, `Editors`, `Scenes & Objects` and `Animation` sections.  

# How do I make emotes??
You animate, then go to the `Export` tab, change the contents of the variables to your liking and run the script. Your emote will be placed in the same directory as the rig.  
To make the animation loop, check the `Cyclic Animation` box in the action properties.  
The range of frames that gets exported is defined by the `start` and `end` fields in the action properties.  
`loopTick` is set to the start frame of the scene. Find out more about it in the [looping](./looping.md) section of the wiki.  
The name of the file will be the same as the name of the active action.  

:::warning
For the animation to be exported for an axis, there has to be at least one keyframe placed on it!
:::

If you don't want a bone to be exported, comment it from the export_bones list in the script. If you want to add [custom pivot bones](./custom_pivot_points.md), you have to add them to the list.  
Default rotation of the custom pivot bones should be aligned with the world axes.

The icon is created on export automatically. In the `Export` tab you can place the camera and set the frame for an icon.  

There is a switch in bone properties to enable vanlla mode, so the limbs imitate bending without actually being bent. IK sliders are also in bone properties.  
There is a custom property on the head that makes it look at the `head_goal` bone.  
There are bone groups so you can show or hide some parts of the rig.  

# You can
- Add new bones -- they will be exported as [custom pivot bones](./custom_pivot_points.md)
- Change the hyerarchy of the bones (If you change the parent of a limb, also change the parent of the respective bone with the `_vanilla` suffix)
- Use constraints and fcurve modifiers
- Change the framerate

# You may not
- Apply any translation to the bend bones other than pitch rotation. (for now)
- Use any rotation mode other that `XYZ`

# Limitations
- Drivers don't get exported.
- Easings may look incorrect, because they work differently in Blender compared to the game.



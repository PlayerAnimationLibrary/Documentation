---
sidebar_position: 1
description: "How to create emotes using Blender rigs."
---

# Creating Emotes With Blender

To make emotes in Blender, you need to use the `emote_creator` rig from Emotecraft's [GitHub](https://github.com/KosmX/emotes/tree/dev/blender). Please read the README.md. 
It is expected for you to already be familiar with Blender in some way. If you are not, please read the [Blender Documentation](https://docs.blender.org/manual/en/latest/) first. I recommend reading the `User Interface`, `Editors`, `Scenes & Objects` and `Animation` sections.  

# How do I make emotes?
Firstly, when you open the project you have to run the script in the bottom of the screen. It adds new fields and buttons to the Action panel of Action Editor so you can setup and export your emote. You can [register](https://docs.blender.org/manual/en/5.2/editors/text_editor.html#text-menu) the script so it runs automatically when you open the project.  

Now you animate, and When you are done, open the Action tab of the Action Editor. Here you can set the emote name, description, author, badges, save directory etc.  

To make an animation loop, check the `Cyclic Animation` box. When you do, the `Hold on last frame` checkbox for setting [looping](./looping.md) mode to `hold_on_last_frame` will appear.  
By default the range of frames that gets exported is `0 - scene.end_frame`. If you want a different range, check the `Manual Frame Range` checkbox and set the `start` and `end` fields to the values you want. They must be integers(otherwise they will be rounded down on export).
`loopTick` is set to the scene's start frame. Find out more about it in the [looping](./looping.md) section of the wiki.  

The name of the file will be the same as the name of the active action.  

:::warning
For the animation to be exported for an axis, there has to be at least one keyframe placed on it!  
:::

If you add new bones to the armature, that you want to export as [custom pivot bones](./custom_pivot_points.md), you need to add them to the Pivot Bones list with the `+` button. 
Default rotation of the custom pivot bones should be aligned with the world axes.  

The icon is created on export automatically and added to the emote json. In the `Icon` tab you can place the camera and set the frame for an icon.  

There is a switch in `settings` bone properties to enable vanlla mode, so the limbs imitate bending without actually being bent. IK sliders are also in `settings` bone properties.  
There is a custom property on the head that makes it look at the `head_goal` bone.  
There are bone groups so you can show or hide some parts of the rig. (this wont affect the emote in the game)  
:::tip
If you want to have multiple emotes in the same blend file, create new actions(don't forget to add a fake user to them!). If you want emotes with different bone structures in the same file, you can make a full copy of the scene and change the rig there, so you have both bone structures in the same file.
You can append actions from your other blend files of the rig if you have them (for example when the rig gets updated)
:::

Make sure you have selected the armature and you are in the pose mode. Click the export button in the Action panel and your emote should be in the folder you selected!

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

# MoLang
Since this rig exports in the Blockbench format, you can replace any exported keyframe value with a MoLang expression and have it computed while the emote plays.  
See [MoLang](./molang.md) for how to write them.  

# Blockbench compatibility
This rig exports emotes in the same format as Blockbench does, so if you are following some rules, you can get the animation to be able to be imported to Blockbench:  
1. When you place a keyframe place on on all the 3 axes. For example if you change location, put a keyframe on x, y, and z. Same with rotation and scale.  
2. Don't use bezier interpolation.  
3. You'll have to add custom pivot bones to the Blockbench rig -- body_control, waist and other bones you added yourself -- if you use them.  

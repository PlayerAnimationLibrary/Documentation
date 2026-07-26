---
sidebar_position: 6
description: "How to animate the hand in first person."
---

# Animating the first person hand.
You can set the first person mode in the controller by using the `setFirstPersonMode` function.  
It takes an enum, with four possible values.  
`NONE`: Changes nothing.  
`VANILLA`: Currently does nothing, left over from legacy stuff. (might be implemented again later)  
`THIRD_PERSON_MODEL`: This is where the fun begins, enables PAL first person animations.  
`DISABLED`: Forces first person animation to be off, even when other animations are using it.  

The way `THIRD_PERSON_MODEL` mode works is instead of animating the actual first person hands, it starts rendering parts of the third person model.  
This may be disappointing to some, but thankfully there are options to make this look good!  

So great, now you have enabled first person animations! Here are a few things you can tweak about it:  

The first thing you can change is the first person mode configuration, changed using the `setFirstPersonConfiguration` method.  
It is a class with 5 booleans that lets you change three things:  
A) Whether an item is rendered or not.  
B) Whether the actual arm is rendered or not.  
C) Whether the armor is rendered or not.  

Then we have the follows camera config, set by the `setFirstPersonFollowsCamera` method.  
It's pretty self-explanatory, by default the arms render where they are supposed to be in the world while in third person, but this makes them follow the camera and stay in frame at all times.  
When using this mode the hands will probably be too low down too be in frame, so you also want to use the `FirstPersonOffsetModifier`. (Read more [here](./modifiers.md))  

Then we have the first person transition length, set by the `setFirstPersonTransitionLength` method.  
When the value given is above zero it makes it so that during the transition the vanilla first person arm slowly moves out of the frame, before the PAL one appears.  
The value is measured in ticks.  

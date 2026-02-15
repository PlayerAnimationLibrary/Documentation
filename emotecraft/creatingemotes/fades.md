---
sidebar_position: 5
description: "How to configure fade in and fade out for emote animations."
---

# Fading in/out
Our animations support properties called `endTick` and `beginTick`.  
To add these properties to Blockbench animations, check out the extra data section of the Blockbench wiki page.  
All of these properties are in ticks. (Each second being 20 ticks)  
They allow you to fade in and out of the default pose.  
`beginTick` is the time it takes to fade in from the default pose to the animation.  
The `animation_length` in Blockbench anims or `stopTick` in Blender ones is when the animation will fully end.  
`endTick` is when the animation starts fading to the default pose, and by the end of the animation the default pose will be reached.  
`beginTick` fades into the first keyframe and `endTick` fades from the last keyframe, so if you have a keyframe at tick 0 and at the final tick no fading will be done.
`endTick` uses the easing of the last keyframe, but `beginTick` defaults to in out sine.  (If it gets requested I might add custom `beginTick` easings)  

:::important

Blockbench automatically generates a keyframe at second 0 which will cause `beginTick` not to work!  
You must remove it manually.  

:::


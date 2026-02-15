---
sidebar_position: 6
description: "How to configure animation looping in Blockbench formats."
---

# Looping (For Blockbench formats)
This section includes information on the different ways you can loop an animation.

## Return to tick
This method comes first because it was added by us for the Bedrock format   
It was ported from playerAnimator and has the same functionality.  
This makes it so the animation loops back to the specified time in the animation instead of the beginning.  
Unlike what the name suggested the time provided should be in seconds not ticks.  
If the `loopTick` key is specified in the JSON then the `loop` key is ignored.


```json5
{
  "loopTick": 0.4
}
```

## Hold on last frame
As the name suggests, it makes the animation "hold" on the last frame.  
The animation will remain paused on the last frame and won't end unless the animation is cancelled.  

```json5
{
  "loop": "hold_on_last_frame"
}
```

## Play once
Using this method, the animation won't loop; it will just play once.  
This is the default loop type and will be chosen if no loop type is specified.

```json5
{
  "loop": false
}
```

## Loop
The most boring method, the animation simply starts from the beginning when it ends.

```json5
{
  "loop": true
}
```

---
sidebar_position: 4
description: "Emotecraft client and server commands, and server permissions."
---

# Commands

## Client commands
These commands are registered on the client and **are not sent to the server**.

- `/emotes-client play <emote>` — play an emote
- `/emotes-client stop` — stop the current emote

## Server commands
These commands are registered on the server; you may need permissions to execute them.

- `/emotes play <emote> <player> <forced>` — play an emote
- `/emotes stop <player>` — stop the current player's emote
- `/emotes reload` — reload emotes

## Server permissions
- `emotes.play.player` - to execute the `/emotes play` command
- `emotes.stop.player` - to execute the `/emotes stop` command
- `emotes.stop.forced` - to execute the `/emotes stop` if the emote is forced
- `emotes.play.showhidden` - allows to see "hidden" emotes in autocomplete
- `emotes.reload` - to execute the `/emotes reload` command

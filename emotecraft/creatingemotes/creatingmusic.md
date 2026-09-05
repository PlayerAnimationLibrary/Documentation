---
sidebar_position: 3
description: "How to give an emote a sound, and how to prepare the .opus file it needs."
---

# Creating Music for Emotes

An emote can carry its own sound. Put an `.opus` file in the emotes folder next to the emote and give it the
same name, and Emotecraft plays it whenever the emote plays &mdash; for you and for everyone who sees you.

```text
emotes/
  wave.json
  wave.opus
```

The sound travels with the emote, so other players hear it without having to download anything themselves.

## What .opus is

Nothing special, and nothing invented for this mod. Opus is an ordinary audio format, the same one Discord and
most voice chats use, and `.opus` is simply an audio file holding it. Emotecraft asks for it because it stays
small: a few hundred kilobytes for a whole song, which is what makes sending the sound along with the emote
possible at all.

Playing one back depends on your system:

| | |
|---|---|
| Windows 10 and 11 | opens as is |
| Linux, Android | opens as is |
| macOS | QuickTime and Music cannot, [VLC](https://www.videolan.org/vlc/) can |
| Anywhere | drag the file into a Chrome or Firefox window |

That browser trick is the quickest way to check a file without installing anything, and the converter below
lets you listen to the result before you download it at all.

## Making the file

The easiest way is the **[Emote Sound Converter](/opus-converter)**. Drop in any audio file, choose how it
should sound, and download the result. It runs entirely in your browser, nothing is uploaded anywhere, and it
will not let you make a file the mod would reject.

If you would rather do it yourself, [ffmpeg](https://ffmpeg.org/) does the same job:

```bash
ffmpeg -i song.mp3 -c:a libopus -b:a 32k -vbr constrained -ac 1 -ar 48000 wave.opus
```

The sound has to be **mono**. Everything else below is a limit rather than a requirement.

## Looping

By default the sound plays once, even if the emote itself repeats forever. To make it loop, add a
`LOOPSTART` tag saying which sample it should jump back to. There are 48000 samples in a second, so
`LOOPSTART=96000` restarts from the two second mark:

```bash
ffmpeg -i song.mp3 -c:a libopus -b:a 32k -vbr constrained -ac 1 -ar 48000 \
  -metadata LOOPSTART=96000 wave.opus
```

Use `LOOPSTART=0` to simply start over from the beginning. A later value is for tracks with an intro that
should only be heard once. The converter has a checkbox for this and works the number out for you.

The sound and the animation loop independently, each on its own length, so they drift apart over time unless
they happen to line up.

## Limits

| | |
|---|---|
| Channels | mono only |
| Size | 1 MB, shared with the emote itself |
| Bitrate | 96 kbps, and low enough to fit the size limit |
| Length | 10 minutes |

The size limit is the one you will actually run into: it is the largest packet a Minecraft server will pass
along, and the animation has to fit in it too. At 32 kbps that is roughly four and a half minutes of music,
which is plenty for most emotes. If the sound does not fit, the emote still plays &mdash; just silently for
everyone else.

## Volume

Emotecraft measures how loud each sound is and evens them out, so that a quiet emote and a loud one sit at
the same level. Do not normalise or amplify the file yourself; leave it as it is. Players who prefer the
original loudness can turn this off with **Normalize the volume of emote sounds** in the options.

If the file carries an `R128_TRACK_GAIN` tag, that is used instead of measuring, which saves a little work
when the emote loads.

## Note Block Studio (legacy)

Older versions used [Note Block Studio](https://noteblock.studio/) songs saved as `\{nameOfEmoteFile\}.nbs`.
Current versions no longer play them, but they are still passed along: keep the `.nbs` next to the emote and
players on an older version of the mod will hear it, while everyone else hears the `.opus`. Shipping both is
safe.

# Useful links
- [Emote Sound Converter](/opus-converter) - Turn any audio file into an emote sound, in your browser.
- [Note Block World](https://noteblock.world/) - The largest public community centered around Minecraft note blocks.
- [Note Block Tool](https://github.com/RaphiMC/NoteBlockTool/releases/latest) - Tool for importing, exporting, batch manipulating and playing Minecraft note block songs.

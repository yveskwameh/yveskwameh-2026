Self-hosted music for the Music window. Empty until Yves adds a file.

What to drop here:
- MP3, which every browser plays. M4A/AAC also works; OGG and FLAC do not, on Safari.
- Keep it under about 3MB. 192kbps VBR is plenty behind a UI sound.
- Name it plainly, lowercase, no spaces: avengers.mp3

Then list it in src/data/tracks.ts and it appears in the Music window. Nothing is
fetched until the visitor presses play, because the <audio> element has preload="none".

The lock-screen hint uses the short Kenney menu cue from `sfx/menu.m4a`.
Saying so here because the file carries no metadata that would tell you, and the next
person to look at an untagged voice clip in a public repo would reasonably wonder.

It is the one piece of audio the site hosts, it is never fetched until the visitor clicks
"Turn it on", and it never plays without that click. Keep it a few seconds and well under
a megabyte.

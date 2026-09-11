# Sounds

Every sound on the site is CC0 from [Kenney](https://kenney.nl), so there is nothing to
attribute and nothing to pay. Soft clicks and pops from **Interface Sounds** for the
shell, 8-bit blips from **Digital Audio** for the game and the chase.

Files live in `public/audio/sfx/`, one `.m4a` per sound, 21 of them, about 132KB together.

## The rule that matters

**Nothing is fetched until the visitor asks for sound.** Not the player, not one audio
file. The gate on the lock screen asks once, the answer is stored in `localStorage.snd`,
and `src/scripts/lazy.ts` only imports the player when that answer is `on`. Check it with
the network panel: choose "Continue muted" and there is not a single request to
`/audio/`. That is non-negotiable 2 in CLAUDE.md, and it is the reason all of this is
lazy rather than convenient.

## Where things are

| File | What it does |
|---|---|
| `src/data/sfx.ts` | The map. Which sound each click and hover makes, and how loud. |
| `src/scripts/sfx.ts` | The player. Web Audio, lazy, decodes each file once. |
| `src/scripts/snd.ts` | The setting. The gate, the menu bar speaker, the `snd` event. |
| `src/scripts/lazy.ts` | The one place the player is imported from. |
| `public/audio/sfx/*.m4a` | The sounds. |

## Making a sound from anywhere

```ts
document.dispatchEvent(new CustomEvent('sfx', { detail: 'win' }));
```

That is the whole API. Nothing needs to import the player, so nothing drags it onto the
page load. If sound is off, or the player never loaded, the event goes nowhere and no code
has to check.

## The map

Clicks and hovers are matched by CSS selector in `src/data/sfx.ts`, first match wins.
Anything that matches nothing still gets `tap`, because a click with no sound reads as a
broken click once the rest of the site is making noise.

| Name | Fires on | Source |
|---|---|---|
| `tap` | any click nothing else claimed | `click_002` |
| `button` | `.btn`, buttons, links | `select_002` |
| `open` | icons, dock, anything `[data-open]` | `open_002` |
| `close` | window close, Escape | `close_002` |
| `menu` | menu bar, right-click menus | `toggle_002` |
| `dock` | a dock item | `select_003` |
| `dockDrop` | dragging a dock icon out and it springing back | `drop_003` |
| `hoverBtn` `hoverIcon` `hoverDock` `hoverMenu` | hovering each of those | `tick_001` `tick_002` `tick_004` `pluck_001` |
| `flee` | the unlock button dodges | `phaserUp1`, trimmed to 0.28s |
| `stuck` | the unlock button gives up | `lowDown` |
| `unlock` | the desktop opens | `powerUp3` |
| `place` `house` | your X, then Yves's O | `pepSound1` `pepSound3` |
| `cheat` | Yves changes the board | `phaserDown1` |
| `win` `deny` `reset` | he wins, denies an appeal, starts again | `powerUp7` `lowThreeTone` `phaserUp3` |
| `react` | an emoji sent or received | `pepSound5` |

Hovers are rate limited to one every 90ms and never twice for the same element. Without
that, crossing a row of dock icons sounds like a swarm.

## Swapping a sound

Drop a new file in with the same name and it is done. No code change.

Kenney ships Ogg Vorbis, which Safari cannot decode, so anything from there needs
converting first:

```sh
ffmpeg -i in.ogg -ac 1 -ar 44100 -c:a aac -b:a 64k public/audio/sfx/<name>.m4a
```

Mono, because these are blips and nobody is listening in stereo. 64k, because above that
the file grows and a 40ms click sounds identical. Add `-t 0.3` to trim anything long that
fires often.

## Turning it off

The speaker in the menu bar, at any time. It writes the same flag the gate does and drops
the master gain to zero, so what is already loaded goes quiet immediately. Someone who
chose "Continue muted" and later changes their mind gets the player fetched at that point,
not before.

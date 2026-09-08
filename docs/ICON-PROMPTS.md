# Icon generation prompts

Prompts for the seven desktop icons in `ICON-SPEC.md`, plus the two dock system tiles.

## Read this first

Image models are bad at pixel art in a specific way: they will not respect a 32x32 grid,
they will not stay inside a 16 colour palette, and they will anti-alias everything. Treat
what comes back as a **concept sketch to trace over**, not a finished asset.

The workflow that actually works:

1. Generate at 1024x1024 with the prompt below. Ask for four variations.
2. Pick the one whose silhouette reads best when you squint at it.
3. Open it in Figma or Aseprite next to a 32x32 frame and redraw it on the grid by hand.
   Tracing a reference is much faster than drawing from nothing, and you keep the palette.
4. Export per `ICON-SPEC.md`: PNG at @2x and @3x, nearest neighbour, never smooth.

If you would rather skip generation entirely, the descriptions double as drawing briefs.

## Style preamble

Paste this in front of every icon prompt.

```
32x32 pixel art icon in the style of Windows 98 and classic Mac OS desktop icons,
rendered large and crisp with hard square pixels and no anti-aliasing, no blur, no
gradients, no drop shadow, flat colour only. Solid 1px black outline around the whole
silhouette. Light source is top-left: 1px white highlight along the top and left inner
edges, mid-grey shading along the bottom and right. One base colour, one highlight and
one shadow per material, nothing more. Centred on a plain transparent background with a
little clear margin. Restricted to this 16 colour palette only: black #000000, dark grey
#808080, light grey #C0C0C0, white #FFFFFF, navy #000080, blue #0000FF, teal #008080,
cyan #00FFFF, maroon #800000, red #FF0000, olive #808000, yellow #FFFF00, green #008000,
lime #00FF00, purple #800080, magenta #FF00FF. The silhouette must stay readable at 16px.
```

## The seven desktop icons

**computer.png** — About Yves
```
Subject: a chunky beige desktop computer seen three-quarters from the front, a boxy CRT
monitor sitting on a wide horizontal case. The case and bezel are light grey #C0C0C0 with
white top and left edges so they read as beige. The screen is navy #000080 with a single
cyan #00FFFF diagonal glint in the upper left corner. A small green #00FF00 power LED on
the case front. Two thin dark grey vents on the case.
```

**folder.png** — Work
```
Subject: a closed manila document folder seen head-on, tab on the left third of the top
edge. Body is yellow #FFFF00 with olive #808000 shading along the bottom and right, and a
white highlight along the top edge. A single olive crease line across the lower third to
suggest thickness.
```
Also draw `folder-open.png` for hover: the same folder tilted open, front flap leaning
forward, three white paper edges peeking out of the top.

**prefs.png** — Services
```
Subject: a control panel faceplate, a light grey #C0C0C0 rectangle with a 1px black
outline and a white top-left bevel. On it: two horizontal slider tracks in dark grey with
a small blue #0000FF square handle on each, sitting at different positions, and one round
knob at the right with a black indicator line pointing up-left. A tiny green #00FF00 LED
in the top right corner.
```

**notes.png** — Feedback
```
Subject: a small stack of square sticky notes seen head-on. The top note is yellow
#FFFF00 with its bottom-right corner curling up to show an olive #808000 underside. Two
more notes peek out beneath, offset a pixel or two down and right. Three short dark grey
horizontal dashes on the top note suggest handwriting.
```

**music.png** — Music
```
Subject: a compact disc seen head-on at a slight tilt, light grey #C0C0C0 base with a
white highlight arc on the upper left and a rainbow sheen across the lower right made of
three clean bands of purple #800080, magenta #FF00FF and cyan #00FFFF. Dark grey centre
ring with a black centre hole.
```

**mail.png** — Mail
```
Subject: a white envelope seen head-on, flap side up and closed, with a round red #FF0000
wax seal at the centre of the flap. The envelope is white with light grey #C0C0C0 shading
along the bottom and right and a 1px black outline. The top edge of a letter peeks out
above the flap as a thin white strip. Maroon #800000 shading on the lower half of the seal.
```

**trash.png** — Trash, empty
```
Subject: an empty wire-mesh waste basket seen from slightly above, tapering narrower at
the bottom. Built from a light grey #C0C0C0 vertical wire pattern with dark grey #808080
gaps between wires so it reads as mesh, a thicker rim around the top opening, and a dark
navy #000080 shadow inside the opening to show it is empty.
```
Also draw `trash-full.png`: the same basket with crumpled paper balls poking out of the
top, white and light grey, one yellow #FFFF00 among them.

## The dock icons

Both are drawn now. The prompt is kept for redraws.

These two sit bare in the dock with no tile behind them, so the background must be fully
transparent. That matters more than usual here: the dock glass sits over a beach photo,
and any baked-in white square will show as an obvious block. Use the style preamble
above, then this, and add the line about transparency at the end.

**images** — Images
```
Subject: a small stack of two photographs, the top one square and face up, tilted very
slightly, with a white border around it like an instant print. Inside the photo: a cyan
#00FFFF sky across the top half, a green #008000 hill rising from the bottom left, and a
small yellow #FFFF00 sun in the top right corner. The photo underneath peeks out from
behind the top one at the lower right, showing only its white edge and a light grey
#C0C0C0 shadow side. 1px black outline around the whole stack.

The background must be fully transparent. No white square, no backdrop, no card, no
rounded tile behind the subject, nothing but the artwork itself on transparency.
```

If you regenerate **trash** to match, use the same closing line about transparency.

### Getting the transparency right in Figma

Every export so far has come through with the frame background baked in: the desktop set
arrived white, the images icon arrived pink. Set the frame's fill to none before exporting
and the step below is not needed. If a white background does end up baked in,
run it through the same script:

```sh
python3 tools/strip-icon-background.py public/icons/images.png
```

It clears only white connected to the outer edge, so white inside the artwork, the photo
border here, survives.

## After generating

Redraw on the grid, then check the whole set together at 48px and again at 16px. The test
in `ICON-SPEC.md` rule 6 is the one that matters: no icon should carry more visual weight
than the rest. If the folder looks twice as heavy as the envelope, thin the folder.

---
title: Example Project
client: Example Client
year: 2026
summary: One line on what changed for the client.
role: UX/UI design, Webflow build
stack: [Figma, Webflow]
url: https://example.com
cover: /images/projects/example.avif
banner: /images/projects/example-1.avif
filename: example-project.webflow
featured: true
---

Files starting with `_` are ignored (see the pattern in content.config.ts). Copy this one,
drop the underscore, and write the case study in plain markdown.

The shape, set by car-guys.md and yves-desktop.md: open on the problem, then a section per
thing you actually made, then the result. Four or five `##` headings, and a shot under
each of the middle ones. It is a design case study, so the pictures carry as much of it
as the writing does.

Images go in public/images/projects as PNGs named `<slug>-1.png` for the banner and then
`-2` upward for each shot in the body, in the order they appear. Run
`python3 tools/project-images.py` for a report and `--write` to convert them, which also
rewrites these paths to .avif. Every shot in the body is a raw `<img>` tag on its own line
with explicit width and height, because markdown image syntax cannot carry them and rule 4
requires them.

A note to yourself that should not reach the published HTML goes in a link reference, not
an HTML comment. An HTML comment is readable by anyone who views source.

[//]: # (Like this one. It renders to nothing.)

## The problem

What was in the way, in two or three sentences. No hype, no em dashes.

## What you made

One section per real piece of work, named after the thing rather than the phase.

<img src="/images/projects/example-2.avif" alt="What this shot argues, not what the file is called" width="720" height="450" loading="lazy" decoding="async" />

## Result

What is true now. Only claims you can point at. If nothing is measured, say what changed
instead of inventing a number.

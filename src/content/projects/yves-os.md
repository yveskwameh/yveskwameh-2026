---
title: "YvesOS"
client: "Personal"
year: 2026
summary: "This site. A portfolio built as a desktop, with a lock screen, a dock, and windows you open yourself."
role: "Design and build"
stack: ["Astro", "TypeScript", "Cloudflare"]
url: "https://yveskwameh.2026-portfolio.workers.dev"
cover: "/images/projects/yves-os.avif"
banner: "/images/projects/yves-os-1.avif"
filename: "yves-os.astro"
featured: false
---

## The problem

A design portfolio that describes how someone thinks about interfaces, in paragraphs, is
asking to be taken on trust. I would rather the site be the argument.

## The lock screen

It opens on a lock screen instead of a home page, and it asks one thing: whether you want
sound. Nothing plays until you answer, and the answer is remembered for the rest of the
visit. The unlock button runs away from the cursor, so Enter is there for anyone who would
rather not play.

<img src="/images/projects/yves-os-2.avif" alt="The lock screen, with the sound question answered and the unlock button waiting" width="720" height="450" loading="lazy" decoding="async" />

## The desktop

Icons you can drag and rename, a dock, right click menus, a working Mail composer, and nine
photographs from Port Harcourt that fly out of the Images icon and can be dragged back into
it. Every window is real HTML at build time, so opening one fetches nothing.

<img src="/images/projects/yves-os-3.avif" alt="Three windows: the Work browser, About Yves, and Services" width="720" height="450" loading="lazy" decoding="async" />

## On a phone

The same desktop rebuilt for touch. The icons become a grid, and a window is a bottom sheet
that rises over a scrim, covers the dock, and swipes down to dismiss. Dragging is off below
640, because there is nowhere on a phone to drag a window to.

<img src="/images/projects/yves-os-4.avif" alt="The desktop at 1440, 768 and 393, with the icon grid reflowing" width="720" height="450" loading="lazy" decoding="async" />

## Result

It is the argument rather than a description of one. Someone can drag the icons, open the
windows, lose at the game, and judge the work by using it instead of reading about it. It
holds under 10KB of JavaScript on load, because each app's code is only fetched the first
time its window opens.

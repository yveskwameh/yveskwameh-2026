---
title: "YvesOS"
client: "Personal"
year: 2026
summary: "This site. A portfolio built as a desktop, with a lock screen, a dock, and windows you open yourself."
role: "Design and build"
stack: ["Astro", "TypeScript", "Cloudflare"]
url: "https://yveskwameh.2026-portfolio.workers.dev"
cover: "/images/projects/yves-os.png"
banner: "/images/projects/yves-os-1.png"
filename: "yves-os.astro"
featured: false
---

## The problem

A design portfolio that describes how someone thinks about interfaces, in paragraphs, is
asking to be taken on trust. I would rather the site be the argument.

## What I did

Built it as a desktop. A lock screen, icons you drag, windows you open, a dock, right
click menus, a working Mail composer. No framework: static HTML from Astro, plain
TypeScript for the parts that move, plain CSS with every value in one tokens file.

The rule I set was that nothing loads that the visitor did not ask for. Each app's code is
fetched the first time its window opens, so the desktop arrives with only the desktop.
Music builds its Spotify player on click and never before.

<img src="/images/projects/yves-os-2.png" alt="The Work browser, laid out like System Settings" width="720" height="450" loading="lazy" decoding="async" />

## Result

It is the argument rather than a description of one. Someone can drag the icons, open the
windows, lose at the game, and judge the work by using it instead of reading about it.

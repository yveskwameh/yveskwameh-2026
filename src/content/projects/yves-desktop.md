---
title: "Yves Desktop"
client: "Personal"
year: 2026
summary: "This site. A portfolio built as a desktop, with a lock screen, a dock, and windows you open yourself."
role: "Design and build"
stack: ["Astro", "TypeScript", "Cloudflare"]
url: "https://yveskwameh.com"
cover: "/images/projects/yves-desktop.avif"
banner: "/images/projects/yves-desktop-1@720.avif"
bannerSrcset: "/images/projects/yves-desktop-1@720.avif 720w, /images/projects/yves-desktop-1@1440.avif 1440w, /images/projects/yves-desktop-1@2160.avif 2160w"
filename: "yves-desktop.astro"
featured: false
---

## The problem

A design portfolio that describes how someone thinks about interfaces, in paragraphs, is
asking to be taken on trust. I would rather the site be the argument.

The risk in that idea is obvious. An interface built to be admired is usually slow, and a
portfolio that takes four seconds to show anything has argued the opposite of what it meant
to. So the whole thing is built to one rule: nothing loads that the visitor did not ask
for, and the page arrives under 10KB of JavaScript.

## The lock screen

It opens on a lock screen instead of a home page, and it asks one thing: whether you want
sound. Nothing plays until you answer, and the answer is remembered for the rest of the
visit. The voice clip is not even fetched unless you say yes.

The unlock button runs away from the cursor. That is a joke, and jokes have to have an exit,
so Enter works for anyone who would rather not play.

<img src="/images/projects/yves-desktop-2@720.avif" alt="The lock screen, with the clock and the unlock button that moves" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-2@720.avif 720w, /images/projects/yves-desktop-2@1440.avif 1440w, /images/projects/yves-desktop-2@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## The desktop

Icons you can drag and rename, a dock, right click menus. The icons remember where you put
them and what you called them until you clean up, which resets both.

<img src="/images/projects/yves-desktop-3@720.avif" alt="The desktop, with draggable icons and the dock" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-3@720.avif 720w, /images/projects/yves-desktop-3@1440.avif 1440w, /images/projects/yves-desktop-3@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

Nine photographs from Port Harcourt live inside the Images icon in the dock. They fly out
when it is pressed, scatter, and can be picked up and dropped back into it.

<img src="/images/projects/yves-desktop-1@720.avif" alt="The nine prints flown out of the Images dock icon and scattered on the desk" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-1@720.avif 720w, /images/projects/yves-desktop-1@1440.avif 1440w, /images/projects/yves-desktop-1@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## The windows

Every window is real HTML at build time, hidden with a class rather than fetched. Opening
one costs no request. What is fetched on first open is that app's behaviour, and only
that app's, which is what keeps the desktop itself down to the desktop.

Work is laid out like System Settings, a rail of case studies beside one case study.

<img src="/images/projects/yves-desktop-4@720.avif" alt="The Work window, a rail of case studies beside one of them" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-4@720.avif 720w, /images/projects/yves-desktop-4@1440.avif 1440w, /images/projects/yves-desktop-4@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

About is a bio beside a reel of photographs that loops without a seam.

<img src="/images/projects/yves-desktop-5@720.avif" alt="About Yves, the bio beside the looping portrait reel" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-5@720.avif 720w, /images/projects/yves-desktop-5@1440.avif 1440w, /images/projects/yves-desktop-5@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

Services is a set of grouped disclosures, so six offers read as a short list until one is
opened.

<img src="/images/projects/yves-desktop-6@720.avif" alt="Services, six offers as grouped disclosures" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-6@720.avif 720w, /images/projects/yves-desktop-6@1440.avif 1440w, /images/projects/yves-desktop-6@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

Feedback scrolls client quotes past, and the game is a game of tic tac toe you are not
meant to win.

<img src="/images/projects/yves-desktop-8@720.avif" alt="Feedback, client quotes scrolling past" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-8@720.avif 720w, /images/projects/yves-desktop-8@1440.avif 1440w, /images/projects/yves-desktop-8@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

<img src="/images/projects/yves-desktop-7@720.avif" alt="Tic Tac Toe, rigged, with a conversation beside it" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-7@720.avif 720w, /images/projects/yves-desktop-7@1440.avif 1440w, /images/projects/yves-desktop-7@2160.avif 2160w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## On a phone

The same desktop rebuilt for touch rather than shrunk. The icons become a grid.

<img class="tall-lg" src="/images/projects/yves-desktop-9@560.avif" alt="The desktop at tablet width, icons reflowed into a grid" width="560" height="747" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-9@560.avif 560w, /images/projects/yves-desktop-9@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

<img class="tall" src="/images/projects/yves-desktop-10@420.avif" alt="The desktop on a phone, the icon grid and the dock" width="420" height="840" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-10@420.avif 420w, /images/projects/yves-desktop-10@840.avif 840w" sizes="(max-width: 640px) 100vw, 420px" />

A window stops being a window and becomes a bottom sheet: it rises from the bottom edge over
a scrim, covers the dock instead of sitting above it, and swipes down to dismiss. Dragging
and resizing are off below 640, because there is nowhere on a phone to drag a window to.

<img class="tall" src="/images/projects/yves-desktop-11@420.avif" alt="A window on a phone, risen from the bottom as a sheet over a scrim" width="420" height="840" loading="lazy" decoding="async" srcset="/images/projects/yves-desktop-11@420.avif 420w, /images/projects/yves-desktop-11@840.avif 840w" sizes="(max-width: 640px) 100vw, 420px" />

## Result

It is the argument rather than a description of one. Someone can drag the icons, open the
windows, lose at the game, and judge the work by using it instead of reading about it.

The rule held. The page arrives with 10,135 bytes of JavaScript, which is measured on every
build rather than estimated, and each app's code is fetched the first time its window opens
and not before.

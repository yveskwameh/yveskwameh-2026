# 2026 Portfolio · yveskwameh.com

Live at https://yveskwameh.2026-portfolio.workers.dev until the custom domain is
attached. Source at https://github.com/yveskwameh/yveskwameh-2026 (private).

Yves Kwameh's personal portfolio rebuilt as a retro operating system.
Read `docs/BRIEF.md` before any design or content work. Read `README.md` for the project map.

## Owner
Yves Kwameh, strategic UX/UI designer and no-code developer, Port Harcourt, Nigeria.
Strong in Figma/Webflow/Framer, newer to Astro and Cloudflare: explain choices briefly when introducing a new tool or pattern.

## Stack (decided, do not change without asking)
- Astro 7, `output: 'static'`, no adapter, no SSR
- Vanilla TypeScript for all client behaviour. No React/Vue/Svelte unless Yves approves
- Plain CSS, all visual values in `src/styles/tokens.css`
- Cloudflare Workers static assets via `wrangler.jsonc`. **Deploy is a push to `main`**: GitHub is connected to Cloudflare Workers Builds, which builds and deploys on every push. `npm run deploy:manual` still works but is break-glass, since it ships the working folder rather than a commit
- One Worker, `worker/index.ts`, serving a single `/ws` route for the live cursors, backed by a Durable Object. Static assets are matched first and only unmatched paths reach it, so the site is still fully static: no Astro adapter, no SSR, `output: 'static'` unchanged. Test it with `npm run preview`, which runs wrangler rather than the Astro dev server. `astro dev` cannot serve `/ws`, so cursors are simply absent there
- Node 22, npm

## Non-negotiables
1. Speed first. Target Lighthouse 100 across the board on mobile. Client JS **on page load** stays under 10KB: an app's code is fetched when its window opens, and does not count until then. Measure with `python3 tools/js-budget.py` after `npm run build`, never by eye. Nothing loads on page load that the visitor did not ask for (audio, video, embeds, third-party scripts)
2. Music comes from one Spotify playlist in Control Center, built the first time that panel opens and not before, through Spotify's own iframe API so the desktop knows whether it is playing and can pause it. There is no Music window. Plus the window soundtracks in `public/audio` that Yves holds the rights to, listed in `src/data/tracks.ts`. Opening Work starts one and opening Feedback starts the other; they run full length and loop, with the fade at each end baked into the file so `<audio loop>` reads as a fade and repeat. The visitor cannot pick a track, only pause, from the speaker panel in the menu bar. Every `<audio>` carries `preload="none"`, so nothing is fetched until a window asks for it. **All of it is gated on the lock screen answer**: no sound plays unless the visitor chose "Enter with sound", and the volume slider, where zero is the mute switch, is how they change their mind. The lock screen voice clip is fetched only after the same opt-in. Nothing ever plays without a click first
3. Windows are real HTML at build time, shown/hidden with CSS classes. Do not fetch window content at runtime
4. Images: webp/avif, explicit width/height, lazy unless above the fold. Pixel icons use `.pixel` class
7. UI glyphs come from Pixelarticons via `<Icon name="..." />` (inline SVG, currentColor). Add new ones to `tools/sync-icons.mjs`, never hand-draw a glyph that already exists there. Desktop icons are Yves-drawn PNGs per `docs/ICON-SPEC.md`; never use extracted Windows or Mac OS icons
5. Mobile is a first-class layout: icon grid + bottom-sheet windows, drag disabled under 640px
6. Case studies are markdown in `src/content/projects`, validated by `src/content.config.ts`

## Writing rules for any copy in the site
- Standard English only, no Nigerian Pidgin in written copy
- No em dashes. Use commas, "so", "because", "but", or a new sentence
- Plain and matter-of-fact. No crafted copywriter lines, no hype
- Short. Two sentences beats five

## Conventions
- Components: `src/components/os` (shell), `windows` (chrome), `apps` (window contents)
- Scripts: one small file per behaviour in `src/scripts`. Desktop-wide behaviour is imported by the component that needs it. A single window's behaviour is NOT: it goes in the `APPS` map in `src/scripts/lazy.ts` and is fetched the first time that window opens, so it costs nothing on load. Every dynamic import in the project lives in that one file on purpose, because Vite injects a ~1.3KB preload helper into whichever chunk contains one, and one chunk pays for it once
- Data that is not content (icons, links, dock) lives in `src/data/*.ts`
- Run `npm run build` before saying a task is done. A warning about an empty projects collection is expected until case studies are added

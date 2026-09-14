# Yves Desktop

Yves Kwameh's portfolio, built as a retro operating system. A lock screen, a desktop you
can drag icons around, windows that open, a dock, right-click menus, and everyone on the
site at once can see everyone else's cursor.

Astro, fully static, no framework, under 10KB of JavaScript on arrival. Deployed to
Cloudflare Workers static assets, with one small Worker for the live cursors.

**Live: https://yveskwameh.com**

The domain has moved. `site` in `astro.config.mjs` is the one place the host is written
down, so every canonical link, `og:url`, sitemap entry and JSON-LD `@id` follows it.
`docs/DOMAIN-MOVE.md` has the rest of the day, including the parts only the Cloudflare
dashboard and Search Console can do.

Goal: zero server cost, zero framework JavaScript on the page, fast everywhere.

## Stack
- **Astro 7** · static output, no adapter
- **Vanilla TypeScript** for the OS behaviour (drag, windows, boot, clock, music). ~3KB total, no React runtime
- **Plain CSS** with design tokens in `src/styles/tokens.css`
- **Cloudflare Workers (static assets)** via `wrangler.jsonc`

## Get running
```sh
nvm use            # Node 22
npm install
npm run dev        # http://localhost:4321
```

## Keys and secrets

```sh
cp .env.example .env      # then paste the Web3Forms key in
```

The one variable is `PUBLIC_WEB3FORMS_KEY`, for the Mail window. Without it the composer
still opens, it just shows the email address instead of sending, and the build prints a
warning saying so.

**Read this before adding a second key.** This site has no server. It builds to plain
files, so anything the page needs at runtime is in the page, and anyone can read it with
view-source. Astro is explicit about this and refuses to support secret variables in
client code at all, because there is no safe way to send one to a browser. Putting a key
in `.env` does not hide it. What it does is keep it out of the repo and its history, so
it is not sitting in a public GitHub repo for a scraper, and rotating it is one line.

That is fine for this key, because a Web3Forms access key is meant to be public. It is an
alias for an inbox rather than a credential, and the worst anyone can do with it is send
Yves an email, which they could do anyway.

A key that really is secret, a payment key or an email-sending API key, must never reach
the browser. That needs something server side to hold it, which here would mean adding a
Cloudflare Worker in front of the form. That is a stack change, so agree it first.

For deploys, set the same variable in the Cloudflare dashboard (Settings → Variables and
Secrets) so the build there has it too.

## Deploy

**Push to `main` and Cloudflare builds and deploys it.** That is the whole workflow.

```sh
git add -A && git commit -m "what changed" && git push
npm run indexnow      # optional, after a deploy that changed pages
```

Live at **https://yveskwameh.com**. A deploy uploads the static files AND the Worker in `worker/`, so the
live cursors go up with the site.

`npm run deploy:manual` still exists and still works, but it is break-glass now. It pushes
whatever is in your folder, including changes you have not committed, so it can put
something live that exists in no commit. Prefer a push.

### Things that will bite you once

- **Build variables live in three places** and nothing keeps them in sync: your local
  `.env`, the Cloudflare build variables, and the GitHub Actions secret. Rotate the
  Web3Forms key and you change all three.
- **Never set `NODE_ENV=production`** as a build variable. `wrangler` is a devDependency,
  so `npm ci` would skip it and `npx wrangler deploy` would quietly fetch a floating
  latest instead of the pinned version.
- **Never delete the `migrations` block** from `wrangler.jsonc`. Once a migration tag is
  set, every later deploy has to carry one, and removing it breaks all of them.
- **No preview URLs.** Cloudflare does not generate them for Workers that own a Durable
  Object, and this one does. Branch checks run in GitHub Actions instead.

### Deploying by hand, if you ever need to

```sh
npx wrangler login     # must grant write scopes
npm run deploy:manual
```

If that fails with `Authentication error [code: 10000]`, the token came back read-only.
`npx wrangler logout && npx wrangler login` fixes it.

## Credits

- [Space Mono](https://fonts.google.com/specimen/Space+Mono) by Colophon Foundry, under
  the SIL Open Font License. Licence text in `public/fonts/OFL.txt`.
- [Pixelarticons](https://pixelarticons.com/) by Gerrit Halfmann, MIT.
- Interface and 8-bit sounds by [Kenney](https://kenney.nl/assets), CC0. Nothing to
  attribute, credited anyway. See `docs/SOUNDS.md`.
- [Astro](https://astro.build) and [Cloudflare Workers](https://workers.cloudflare.com/).
- The tool logos in `src/icons/stack` are trademarks of their respective owners,
  reproduced to identify the tools used. No endorsement implied.

Code is MIT. The case studies, photographs, drawn icons and voice recording are not.
See `LICENSE`.

## Project map
```
src/
  pages/            routes. index = the desktop, work/[id] = one page per case study, 404
  layouts/Base      the <html> shell, lean <head>
  components/
    os/             BootScreen, MenuBar, Desktop, DesktopIcon, Dock   (the shell)
    windows/Window  the single window chrome every app uses
    apps/           what lives inside a window: AboutApp, ProjectsApp, ...
  scripts/          small client-side TS: boot, clock, drag, window-manager, music
  styles/           tokens.css (all visual decisions) + global.css
  data/             site.ts (identity/links), desktop.ts (icons), dock.ts (stack)
  content/projects  case studies as markdown, validated by content.config.ts
public/
  icons/            pixel icons (png @2x) and stack logos (svg)
  images/           webp/avif only
  fonts/            self-hosted woff2, one display font
  cursors/          optional retro cursors
wrangler.jsonc      Cloudflare config, points at /dist
```

## Adding a case study
Copy `src/content/projects/_example.md`, rename without the underscore, fill the frontmatter.
It appears in the Work folder and gets its own URL at `/work/<filename>/`. Then run
`python3 tools/draw-og.py` to draw its share card, and it also picks itself up in the
sitemap, `llms.txt` and the JSON-LD without anything else being touched.

## Icons
- UI glyphs: [Pixelarticons](https://pixelarticons.com) (MIT). `node tools/sync-icons.mjs` copies the ones listed into `public/icons/ui`. Use `<Icon name="wifi" size={16} />`
- Desktop icons: drawn by Yves, spec in `docs/ICON-SPEC.md`, generation prompts in `docs/ICON-PROMPTS.md`
- Stack logos: exported from Figma into `public/icons/stack`, inlined by `<StackIcon name="figma" label="Figma" />`. Dock order lives in `src/data/dock.ts`

## Search and social
`src/layouts/Base.astro` emits the title, description, canonical link, Open Graph and
Twitter Card tags for every page. Pages override what they need:

- `title` and `description` are what a search result shows
- `ogTitle` and `ogDescription` are what a LinkedIn or X card shows, and default to the
  two above. Only the home page sets them, because a feed and a search result are read
  for different reasons
- `image` is the share picture, `type` is `website` or `article`, `noindex` keeps a page
  out of search. The 404 is the only page that uses the last one

The share pictures are **placeholders**. `python3 tools/draw-og.py` draws
`public/og/default.png` plus one card per case study in `public/og/work/`, all at
1200x630, which is the size every platform wants. Run it after adding a case study.
Replace any PNG with the real design and no code changes: `work/[id].astro` uses a case
study's card if the file exists and falls back to the default if it does not.

Also emitted, all built from `site` so they follow the domain on their own:

- `/sitemap-index.xml` and `/sitemap-0.xml`, from `@astrojs/sitemap`. The five indexable
  pages, no 404, no `priority` or `changefreq`, no invented `lastmod`
- `/robots.txt`, from `src/pages/robots.txt.ts`. Search and AI answer engines allowed,
  training-only crawlers disallowed behind one constant in that file. Note Cloudflare
  serves a managed robots.txt too and appends its Content Signals Policy to ours
- `/llms.txt`, generated from the case studies. Google ignores it; the AI engines do not
- JSON-LD from `src/data/schema.ts`: Person, WebSite and ProfilePage on the home page,
  CreativeWork and BreadcrumbList on each case study, joined by `@id`

`npm run indexnow` tells Bing, Yandex, Naver and Seznam that pages changed. Run it after
a deploy that changed something. The `<hex>.txt` file in `public/` is the ownership proof
it needs, which is why it is committed. It is not a secret.

Both the canonical link and the image URL are built from `site` in `astro.config.mjs`,
so that value has to stay true. **`docs/DOMAIN-MOVE.md` is the whole checklist for the day
that changes.** After it changes, re-share any link already posted, because the scrapers
cache the card they first saw.

## Speed rules (keep these)
1. No UI framework on the page. Astro islands only if something truly needs React later.
2. Images: webp/avif, sized, `loading="lazy"` unless above the fold.
3. One self-hosted font, preloaded. Body copy uses system-ui until Inter is added.
4. Spotify embed and any video load on interaction, never on page load.
5. Windows are real HTML at build time, not fetched. Good for SEO, instant to open.
6. Check with `npm run build` then Lighthouse on the preview. Target: 100/100/100/100.

## Next
- [ ] Draw the real Open Graph cards, replacing `public/og/default.png` and `public/og/work/*.png`
- [ ] Draw the 7 desktop icons (docs/ICON-SPEC.md)
- [ ] Decide whether the 5 bare stack marks get their own rounded tiles, like higgsfield already has
- [ ] Remaining apps: Trash, and Images in the dock (About Yves, Work, Services, Feedback, Mail and Tic Tac Toe are built; Music is no longer a window, the playlist is in Control Center)
- [ ] Theme switcher (desktop colour) in View menu
- [ ] Mobile: icon grid + bottom-sheet windows (CSS is stubbed in Window.astro)
- [ ] Hover-dim effect: when a window is focused, dim the rest (heyclicky style)

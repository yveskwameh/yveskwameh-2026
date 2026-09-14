# Moving to yveskwameh.com

The site lives at `yveskwameh.2026-portfolio.workers.dev` until the custom domain is
attached. `yveskwameh.com` is still on Netlify serving the previous site, so nothing in
this repo points at it yet.

This is the whole day, in order. Step 1 is the only code change.

## 1. One line

```js
// astro.config.mjs
site: 'https://yveskwameh.com',
```

That one value is the root of the canonical link, `og:url`, `og:image`, the sitemap, the
`Sitemap:` line in robots.txt, every absolute URL in `llms.txt`, and every `@id` in the
JSON-LD. Change it, build, and all of them follow. Nothing else in `src/` hard-codes a
host, on purpose. Confirm with:

```sh
npm run build
grep -rl "workers.dev" dist/ || echo "clean"
```

## 2. Release the domain from Netlify first

Do this before pointing DNS. If Netlify still holds the domain, the two fight and the
certificate will not issue.

## 3. Attach it in Cloudflare

Workers and Pages, `yveskwameh`, Settings, Domains and Routes. Add both:

- `yveskwameh.com`
- `www.yveskwameh.com`

Then add a zone Redirect Rule sending `www` to the apex, 301. Pick one and keep it: two
hostnames serving the same pages is a duplicate-content problem the canonical link should
not have to clean up.

## 4. Keep the old links working

Anything already shared points at `workers.dev`. Do not turn that host off. Add a host
check at the top of `worker/index.ts` returning a 301 to the same path on the apex when
the request host ends in `.workers.dev`, and set `"run_worker_first": true` in
`wrangler.jsonc` so the Worker sees the request before the static assets do.

After about six months, when the logs show nothing arriving on the old host, set
`"workers_dev": false` and delete both.

**Do not delete the `migrations` block** while doing any of this. Once a migration tag is
set, every later deploy has to carry one.
## 5. Tell the search engines

**Order matters.** Do this only after the `*.workers.dev` 301 in `worker/index.ts` is
deployed. Check with `curl -sI https://yveskwameh.2026-portfolio.workers.dev/` and expect a
301. Submitting or re-scraping before that just teaches everything the old answer again.

### 5a. Add the Domain property, verified by DNS TXT

A Domain property covers every subdomain and both protocols at once, which a URL-prefix
property does not. That is the whole reason to take the DNS route.

1. Open https://search.google.com/search-console and sign in as whoever should own it.
   This is hard to hand over later, so use the account that will still exist in five years.
2. Property dropdown, top left, then **Add property**.
3. Two boxes appear. Take the left one, **Domain**, not URL prefix.
4. Type `yveskwameh.com`. No `https://`, no `www`. Continue.
5. Google shows one TXT record, a string starting `google-site-verification=`. Copy it.
6. In another tab open https://dash.cloudflare.com, pick the `yveskwameh.com` zone, then
   **DNS**, then **Records**, then **Add record**.
   - Type: `TXT`
   - Name: `@`
   - Content: the whole `google-site-verification=...` string, pasted, no quotes added
   - TTL: Auto
   - Save.
7. Confirm it is live before going back:

   ```sh
   dig +short TXT yveskwameh.com
   ```

   The verification string should be in the output. Cloudflare is usually instant.
8. Back in Search Console, press **Verify**. If it fails, wait two minutes and press it
   again rather than changing anything.

**Leave the TXT record in place forever.** Deleting it un-verifies the property, silently,
whenever Google next re-checks.

### 5b. Submit the sitemap

1. In Search Console with the `yveskwameh.com` property selected, go to **Indexing**, then
   **Sitemaps** in the left sidebar.
2. The field is already prefixed with `https://yveskwameh.com/`, so type only:

   ```
   sitemap-index.xml
   ```

3. Submit. Status goes to **Success**. It is an index, so Google follows it to
   `sitemap-0.xml` on its own and ends up with 7 URLs, the desktop plus six case studies.
   The URL count can take a day to appear. Success on the fetch is the part that matters.
4. Optional but worth it on launch day: **URL Inspection**, paste `https://yveskwameh.com/`,
   then **Request indexing**. Do the same for one or two case studies. It is a queue jump
   for a handful of pages, not a bulk tool.

### 5c. The rest

- Do **not** use the Change of Address tool. It is for a site moving away from a domain it
  owns. This is a first launch on the real domain, and the old host was a staging URL.
- Bing Webmaster Tools: import from Search Console rather than verifying by hand again.
- `npm run indexnow` once the new host is live, so Bing, Yandex, Naver and Seznam hear in
  minutes rather than at their next crawl.
- Optional, worth it once the zone exists: Cloudflare Crawler Hints does what IndexNow does
  automatically for the whole zone, and AI Crawl Control enforces at the edge what
  `src/pages/robots.txt.ts` only asks for politely. Cloudflare already serves a managed
  robots.txt on this account carrying the Content Signals Policy, appended to ours rather
  than replacing it, so afterwards run `curl https://yveskwameh.com/robots.txt` and check
  both halves are there.

## 6. Re-share anything already posted

Scrapers cache the first card they see, keyed by the exact URL in the post. A link posted
on the old host keeps showing the old host's card until something forces a re-fetch.

Again: only after the 301 is deployed.

First, find what is out there. Search each network for `workers.dev` on your own profile,
and check anywhere a link normally goes out: LinkedIn posts and the profile Featured
section, X, Instagram bio, WhatsApp messages that still matter, an email signature, a CV.

### 6a. LinkedIn Post Inspector

1. Open https://www.linkedin.com/post-inspector/ and sign in.
2. Paste the **old** URL, the `workers.dev` one exactly as it appeared in the post, and
   press **Inspect**. It re-fetches, follows the 301, and caches the new card against that
   URL.
3. Paste `https://yveskwameh.com/` and inspect that too, so the new URL is warm before
   anything else is shared.
4. Do the same for any case study link that went out, for example
   `https://yveskwameh.com/work/car-guys/`.

Be clear-eyed about what this fixes: it clears the cache so **future** shares are right.
LinkedIn usually keeps the card already rendered into a published post. Where a post
matters, deleting and re-posting with the new URL is the only reliable fix.

### 6b. Facebook Sharing Debugger

Facebook's scraper also serves WhatsApp, Messenger and Instagram link previews, so this one
fixes several at once.

1. Open https://developers.facebook.com/tools/debug/ and sign in. A normal Facebook account
   works; it may ask you to accept the developer terms once.
2. Paste the old `workers.dev` URL and press **Debug**.
3. Press **Scrape Again**. The preview underneath should redraw with the yveskwameh.com
   card. If it still looks stale, press it a second time, which is normal.
4. Repeat for `https://yveskwameh.com/` and any case study URL that was shared.

Unlike LinkedIn, Facebook does update previews in already-published posts once the URL is
re-scraped.

### 6c. X

There is no re-scrape tool any more; the Card Validator was retired. A posted card is
frozen. Delete the post and re-post it with the new URL, or leave it.

## 7. Check it

```sh
curl -s https://yveskwameh.com/robots.txt
curl -s https://yveskwameh.com/sitemap-index.xml
curl -sI https://yveskwameh.2026-portfolio.workers.dev/   # expect 301
```

Then `/seo technical`, `/seo schema`, `/seo sitemap` and `/seo geo` against the new host,
and Google's Rich Results Test on the home page and one case study.

## 8. Update the wording

`README.md` and `CLAUDE.md` both say "Live at ... until the custom domain is attached".
Once it is attached, that sentence is wrong.

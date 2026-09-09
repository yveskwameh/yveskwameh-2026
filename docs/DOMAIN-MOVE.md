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

- Google Search Console: add a **Domain** property, verified by DNS TXT, so it covers
  every subdomain and both protocols at once. Submit
  `https://yveskwameh.com/sitemap-index.xml`.
- Do **not** use the Change of Address tool. It is for a site that is moving away from a
  domain it owns. This is a first launch on the real domain, and the old host is a staging
  URL that should never have been indexed much anyway.
- Bing Webmaster Tools: import from Search Console rather than re-verifying by hand.
- `npm run indexnow` once the new host is live, so Bing, Yandex, Naver and Seznam are told
  in minutes rather than at their next crawl. Edit `tools/indexnow.mjs` only if the key
  file moved.
- Optional, and worth it once the zone exists: Cloudflare's own AI Crawl Control and
  Crawler Hints. Crawler Hints does what IndexNow does, automatically, for the whole zone.
  AI bot controls enforce at the edge what `src/pages/robots.txt.ts` only asks for
  politely. Note that Cloudflare already serves a managed robots.txt on this account
  carrying the Content Signals Policy, appended to ours rather than replacing it, so check
  `curl https://yveskwameh.com/robots.txt` afterwards and confirm both halves are there.

## 6. Re-share anything already posted

Scrapers cache the first card they see, keyed by URL. A link posted on the old host keeps
showing the old host's card forever. Push a re-scrape:

- LinkedIn Post Inspector
- Facebook Sharing Debugger
- X posts have to be deleted and re-posted; there is no re-scrape tool

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

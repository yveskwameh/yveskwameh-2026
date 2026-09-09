#!/usr/bin/env node
/**
 * Tell the IndexNow engines that pages changed.
 *
 * One POST reaches Bing, Yandex, Naver, Seznam and Yep at once. Google does not take
 * part, so this is not a substitute for the sitemap, it is an extra: the difference
 * between those engines noticing a change in minutes and noticing it at their next crawl,
 * which for a small site can be weeks.
 *
 * Run it after a deploy that changed pages:
 *
 *   npm run indexnow                  every URL in the built sitemap
 *   npm run indexnow -- --urls /work/compass/,/     just those, absolute or site-relative
 *   npm run indexnow -- --dry         print what would be sent and stop
 *
 * Reads dist/sitemap-0.xml, so run it after `npm run build`. Node 22 has fetch built in,
 * so there is nothing to install.
 *
 * The key is not a secret. It is a file served from the site root that proves whoever is
 * submitting controls the host, which is why it is committed. Anyone who finds it can
 * only tell Bing to re-crawl pages that are already public.
 */
import { readFileSync, readdirSync } from 'node:fs';

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/* Read the host out of the built sitemap rather than hard-coding it, so this keeps
   working the day `site` changes in astro.config.mjs and nobody remembers this file. */
const SITEMAP = 'dist/sitemap-0.xml';

function fail(msg) {
  console.error(`indexnow: ${msg}`);
  process.exit(1);
}

let xml;
try {
  xml = readFileSync(SITEMAP, 'utf8');
} catch {
  fail(`no ${SITEMAP}. Run \`npm run build\` first.`);
}

const sitemapUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!sitemapUrls.length) fail(`${SITEMAP} has no <loc> entries.`);

const origin = new URL(sitemapUrls[0]).origin;
const host = new URL(origin).host;

/* The key is whichever <32 hex>.txt sits in public/. Found rather than configured, so
   rotating it is one file swap and no code change. */
const keyFiles = readdirSync('public').filter((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f));
if (keyFiles.length !== 1) {
  fail(
    keyFiles.length === 0
      ? 'no IndexNow key file in public/. Expected one <hex>.txt.'
      : `expected one IndexNow key file in public/, found ${keyFiles.length}: ${keyFiles.join(', ')}`,
  );
}
const key = keyFiles[0].replace(/\.txt$/i, '');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args[args.indexOf('--urls') + 1];

const urlList =
  args.includes('--urls') && only
    ? only.split(',').map((u) => new URL(u.trim(), origin).href)
    : sitemapUrls;

const body = { host, key, keyLocation: `${origin}/${key}.txt`, urlList };

console.log(`indexnow: ${urlList.length} URL(s) on ${host}`);
urlList.forEach((u) => console.log(`  ${u}`));

if (dry) {
  console.log('\n--dry, nothing sent. Body:');
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

/* 200 accepted, 202 accepted but the key is still being checked. Both are fine. */
const ok = res.status === 200 || res.status === 202;
console.log(`\nindexnow: HTTP ${res.status} ${res.statusText}`);
if (res.status === 202) console.log('202 means accepted, key validation pending. Normal on a first run.');
if (!ok) {
  console.error(await res.text().catch(() => ''));
  console.error(
    '\n422 usually means the key file is not reachable yet. Deploy first, check\n' +
      `  curl ${origin}/${key}.txt\n` +
      'returns the key, then run this again.',
  );
  process.exit(1);
}

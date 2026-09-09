// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  /* Where this site actually is. Base.astro builds the canonical link, og:url and
     og:image from it, the sitemap and robots.txt build their absolute URLs from it, and
     every @id in the JSON-LD is rooted in it. All of that is wrong if this is wrong: a
     canonical pointing at the wrong host tells Google to index that host instead, and an
     og:image on the wrong host shows a broken card.

     Deliberately NOT yveskwameh.com: that domain is live on Netlify serving the previous
     site, so anything built from it would point at pages showing something else. Change
     this the day the domain moves and everything above follows in one build. The rest of
     that day is written down in docs/DOMAIN-MOVE.md. */
  site: 'https://yveskwameh.2026-portfolio.workers.dev',

  // Fully static build. No adapter needed for Cloudflare Workers static assets.
  output: 'static',

  // Use one public preview address and fail rather than silently moving to another port.
  server: { port: 4321 },
  vite: { server: { strictPort: true } },

  // Prefetch is off for now. It ships 2.5KB of client JS, a quarter of the whole budget,
  // and the only internal links are the four case studies, which are one click from the
  // desktop and already cheap. Worth revisiting when there are more of them.
  // prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  build: {
    // Keeps CSS as separate cached files instead of inlining into every page
    inlineStylesheets: 'never',
  },

  integrations: [
    /* Emits sitemap-index.xml plus sitemap-0.xml, both reachable from robots.txt.

       No `priority` and no `changefreq`: Google ignores both and has said so, and a
       sitemap that argues with itself about which page matters is worse than one that
       does not. No `lastmod` either, because we have no honest value for one. A build
       date would be a fresh lie about every page on every deploy.

       The filter drops the 404, which is noindexed and must never be listed. The .txt
       endpoints go too: robots.txt and llms.txt are served from src/pages, so the
       integration sees them as routes, and neither is an indexable page. */
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('.txt'),
    }),
  ],
});

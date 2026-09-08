// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  /* Where this site actually is. Base.astro builds the canonical link, og:url and
     og:image from it, and every one of those is wrong if this is wrong: a canonical
     pointing at the wrong host tells Google to index that host instead, and an og:image
     on the wrong host shows a broken card. A sitemap would use it too, if one is ever
     added.

     Deliberately NOT yveskwameh.com: that domain is live on Netlify serving the previous
     site, so anything built from it would point at pages showing something else. Change
     this the day the domain moves, and re-share any link that was already shared, because
     the scrapers cache what they saw. */
  site: 'https://yveskwameh.2026-portfolio.workers.dev',
  // Fully static build. No adapter needed for Cloudflare Workers static assets.
  output: 'static',
  build: {
    // Keeps CSS as separate cached files instead of inlining into every page
    inlineStylesheets: 'never',
  },
  // Prefetch is off for now. It ships 2.5KB of client JS, a quarter of the whole budget,
  // and there is nothing to prefetch yet: the only internal links are the case studies
  // and src/content/projects is still empty. Turn it back on with the first case study,
  // when it starts earning its weight.
  // prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});

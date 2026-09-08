// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  /* Where this site actually is. Nothing reads it yet, since the layout emits no canonical
     or og: tags and no sitemap integration is installed, but it is the value all three
     would use, so it is worth being true rather than aspirational.

     Deliberately NOT yveskwameh.com: that domain is live on Netlify serving the previous
     site, so anything built from it would point at pages showing something else. Change
     this the day the domain moves. */
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

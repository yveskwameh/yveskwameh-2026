// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Set to the live domain so canonical URLs and sitemaps are correct
  site: 'https://yveskwameh.com',
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

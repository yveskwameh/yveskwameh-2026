import type { APIRoute } from 'astro';

/**
 * robots.txt, built rather than kept in public/, so the sitemap URL comes from `site` in
 * astro.config.mjs and follows the domain move on its own. A hard-coded absolute URL in a
 * static file is the usual way this breaks: it keeps pointing at the old host for months
 * because nobody remembers a file that never changes.
 *
 * Worth knowing before editing: Cloudflare serves a managed robots.txt of its own on this
 * account, carrying the Content Signals Policy. It appends that policy to the origin's
 * robots.txt rather than replacing it, so what ships live is this file plus their signal
 * block. Their block is comments and content signals; the groups below are ours.
 */

/**
 * Search and answer engines are allowed. Crawlers whose only job is collecting training
 * data are not. Yves asked for the block; the split is what keeps it from costing him
 * anything, because the same companies run separate crawlers for the two jobs and
 * document which is which.
 *
 * Allowed on purpose, and it matters that they stay allowed:
 *   Googlebot, Bingbot, Applebot, DuckDuckBot   ordinary search
 *   OAI-SearchBot                               ChatGPT search results
 *   ChatGPT-User                                someone in ChatGPT opening this site
 *   Claude-SearchBot, Claude-User               the same two jobs for Claude
 *   PerplexityBot, Perplexity-User              the same two for Perplexity
 * These are how the site gets cited in an AI answer at all. Blocking them would be
 * blocking the referral, not the training.
 *
 * Flip this to false to allow everything, and delete nothing.
 */
const BLOCK_AI_TRAINING = true;

/** Verified against each vendor's own crawler documentation, 2026-09-09. */
const AI_TRAINING = [
  'GPTBot',              // OpenAI, foundation model training. Their search bot is separate.
  'ClaudeBot',           // Anthropic, training. Claude-SearchBot and Claude-User are separate.
  'CCBot',               // Common Crawl, the dataset most other models train on
  'Google-Extended',     // Gemini training and grounding. Google states plainly that this
                         // does not affect inclusion or ranking in Google Search, and
                         // AI Overviews there follow Googlebot, not this token.
  'Applebot-Extended',   // Apple AI training. Applebot itself is Siri and Spotlight, and
                         // stays allowed above.
  'Bytespider',          // ByteDance
  'Meta-ExternalAgent',  // Meta
  'Amazonbot',
  'cohere-ai',
  'Diffbot',
  'Omgilibot',
  'PanguBot',
  'Timpibot',
];

export const GET: APIRoute = ({ site }) => {
  // `site` is set in astro.config.mjs. Without it there is no absolute URL to give, and a
  // relative Sitemap line is invalid, so say nothing rather than something wrong.
  const sitemapUrl = site ? new URL('sitemap-index.xml', site).href : '';

  // A blank line after every group, including the last one. A new User-agent line already
  // ends the previous group, so this is for whoever reads the file, not for the parser.
  const training = BLOCK_AI_TRAINING
    ? AI_TRAINING.map((bot) => `User-agent: ${bot}\nDisallow: /\n\n`).join('')
    : '';

  return new Response(
    `${training}User-agent: *
Allow: /
${sitemapUrl ? `\nSitemap: ${sitemapUrl}\n` : ''}`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};

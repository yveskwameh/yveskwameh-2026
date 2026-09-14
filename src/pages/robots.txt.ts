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
 * Every crawler is allowed, training ones included.
 *
 * There used to be a split here: search and answer engines allowed, training-only crawlers
 * blocked. The split worked, because the same companies run separate crawlers for the two
 * jobs and document which is which. It came off because Yves decided being in the models
 * is worth more to him than withholding the pages from them.
 *
 * The names below are kept as the record of which crawler does which job, since that is
 * the part that is tedious to work out again and easy to get wrong. They are only written
 * into the file when BLOCK_AI_TRAINING is true.
 *
 * Never blocked in either mode, and it matters that they stay that way:
 *   Googlebot, Bingbot, Applebot, DuckDuckBot   ordinary search
 *   OAI-SearchBot                               ChatGPT search results
 *   ChatGPT-User                                someone in ChatGPT opening this site
 *   Claude-SearchBot, Claude-User               the same two jobs for Claude
 *   PerplexityBot, Perplexity-User              the same two for Perplexity
 * These are how the site gets cited in an AI answer at all. Blocking them would be
 * blocking the referral, not the training.
 *
 * Currently false: nothing is blocked. Yves asked for the block to come off entirely, so
 * the training crawlers are allowed as well as the search and answer ones. He knows what
 * that means, that his writing and images can end up in a training set and that a crawl
 * cannot be recalled later, and he wants to be in the models as well as in the answers.
 *
 * The list below stays because the switch is the point: flip this back to true and the
 * block returns exactly as it was, with the documentation intact. Nothing has to be
 * rewritten from memory.
 */
const BLOCK_AI_TRAINING = false;

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

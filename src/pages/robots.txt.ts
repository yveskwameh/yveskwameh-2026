import type { APIRoute } from 'astro';

/**
 * robots.txt, built rather than kept in public/, so the sitemap URL comes from `site` in
 * astro.config.mjs and follows the domain move on its own. A hard-coded absolute URL in a
 * static file is the usual way this breaks: it keeps pointing at the old host for months
 * because nobody remembers a file that never changes.
 *
 * This file is the whole answer again, but it was not always, and that is worth knowing
 * before editing.
 *
 * Cloudflare can serve a managed robots.txt of its own and prepend it to this one. It was
 * on. On 2026-09-14 this file shipped zero Disallow lines while the live robots.txt had
 * nine, none of them ours: GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended,
 * Bytespider, meta-externalagent, Amazonbot and Cloudflare's own renderer, plus
 * `Content-Signal: search=yes,ai-train=no,use=reference`. So flipping BLOCK_AI_TRAINING
 * below changed nothing anyone could see, and the reason was two settings away in the
 * dashboard rather than anywhere in this repo.
 *
 * Turned off the same day, in the zone's Security settings: `is_robots_txt_managed` to
 * false under "Manage your robots.txt", and `ai_bots_protection` to disabled under
 * "Block AI bots". Verified after: zero Disallow lines, no Content-Signal, and GPTBot,
 * ClaudeBot, CCBot, Google-Extended and PerplexityBot all served 200 at the edge.
 *
 * The lesson survives the fix. After any change here, `curl https://yveskwameh.com/robots.txt`
 * and read what actually ships. If a block reappears that is not in this file, it came
 * from the zone, not from Astro.
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

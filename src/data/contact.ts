/**
 * Where the Mail window posts.
 *
 * Read this before moving the key anywhere: on a static site there is no such thing as a
 * secret key in the browser. This site builds to plain files with no server, so anything
 * the page needs at runtime is in the page, and view-source shows it. Astro says the same
 * thing in its own docs, which is why it refuses to support "secret client" variables at
 * all: there is no safe way to send one to a browser.
 *
 * So the .env file is NOT hiding this key. What it does is keep it out of the repository
 * and its history, so the key is not sitting in a public GitHub repo for a scraper to
 * find, and so rotating it is one line in one place rather than a commit.
 *
 * That is fine here, because a Web3Forms access key is meant to be public. It is an alias
 * for an inbox, not a credential: the worst anyone can do with it is send Yves an email,
 * which they could already do. Web3Forms filters spam, and a honeypot field in MailApp
 * catches bots.
 *
 * A key that is genuinely secret, a payment or an email-sending API key, must never reach
 * the browser at all. That needs a server to hold it, which for this project would mean a
 * Cloudflare Worker in front of the form, and that is a stack change to agree first.
 */
/* PUBLIC_ on purpose. In Astro that prefix means "this is allowed to reach the browser",
   which is exactly what happens to it, so naming it anything else would be pretending. */
const accessKey: string = import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '';

/**
 * With no key the composer still renders, completely and convincingly, and the visitor
 * only finds out it was never going to send after they have written the whole message.
 * That is a lost enquiry from a stranger who will not write it twice.
 *
 * Locally that is a warning, because a missing .env should not block work on anything
 * else. In CI it is a hard failure, because that output goes straight to visitors and
 * nobody reads the logs of a build that went green. Workers Builds and GitHub Actions
 * both set CI=true, so one condition covers both.
 *
 * This runs in Astro's frontmatter, which is Node at build time, so process is there.
 * The guard on it is for safety rather than need.
 */
if (!accessKey && typeof process !== 'undefined' && process.env?.CI) {
  throw new Error(
    'PUBLIC_WEB3FORMS_KEY is not set, so the contact form would ship unable to send. ' +
    'Set it as a build variable in Cloudflare (Settings > Builds) and as a GitHub Actions ' +
    'secret. See .env.example.',
  );
}

export const contact = {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey,
} as const;

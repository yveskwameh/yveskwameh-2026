import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

/**
 * /llms.txt, to the spec at llmstxt.org: one H1, a blockquote summary, then H2 sections
 * of `- [name](url): note` lines.
 *
 * What it is for, honestly: this site is a desktop. The case studies are real HTML at
 * build time and every one has its own URL, so a crawler can read them, but the home page
 * reads as an operating system rather than as a list of work. This file is the plain-text
 * version of "here is what is on this site and where", for a model that has one shot at
 * understanding it.
 *
 * Google ignores llms.txt and has said so. It costs one generated file and no bytes on
 * any page, and the GEO audits ask for it, so it is here on those terms and not as a
 * ranking lever.
 *
 * Generated rather than written, so it cannot drift from the case studies, and so every
 * URL follows the domain move like everything else built from `site`.
 */
export const GET: APIRoute = async ({ site: base }) => {
  const projects = await getCollection('projects');
  const abs = (path: string) => (base ? new URL(path, base).href : path);

  /* Newest first. A model reading top to bottom should meet the current work first. */
  const sorted = [...projects].sort((a, b) => b.data.year - a.data.year);

  const body = `# ${site.name}

> ${site.role}, based in ${site.location}, Nigeria, working with clients in any time zone.
> Yves designs in Figma and builds in Webflow, Framer and Astro. This site is his
> portfolio, built as a retro operating system: the case studies open as windows on a
> desktop, and each one also has its own page, listed below.

## Case studies

${sorted
  .map((p) => `- [${p.data.title}](${abs(`/work/${p.id}/`)}): ${p.data.client}, ${p.data.year}. ${p.data.summary}`)
  .join('\n')}

## About

- [${site.name}](${abs('/')}): the desktop itself, with the About, Work, Services, Feedback and Contact windows on it.

## Optional

- [Sitemap](${abs('/sitemap-index.xml')}): every indexable page.
- [Contact](mailto:${site.email}): the fastest way to reach Yves.
${site.socials.map((s) => `- [${s.name}](${s.url})`).join('\n')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

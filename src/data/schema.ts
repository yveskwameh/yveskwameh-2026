/**
 * JSON-LD builders. Structured data is how a search engine learns that "Yves Kwameh" is a
 * person with a job and a location rather than a string that appears a lot on one page,
 * and it is what an AI answer quotes when it names a source.
 *
 * Every builder takes the site URL and returns a plain object. Nothing here reads
 * Astro.site for itself, so the whole file is testable and the domain move stays a
 * one-line change in astro.config.mjs.
 *
 * Two rules worth keeping:
 *   1. Every URL is absolute. A relative URL in JSON-LD is either ignored or resolved
 *      against whoever scraped it, and both are wrong.
 *   2. Nothing is invented. No dateModified we cannot prove, no aggregateRating, no award
 *      counts. Structured data that does not match the page is the one kind that earns a
 *      penalty rather than nothing.
 *
 * The @id values are how the graph joins up: the Person is declared once on the home page
 * and referred to by @id from every case study, so a crawler reading three pages
 * understands it is reading about one person, not three.
 */
import { site } from './site';

/** Absolute URL from a site-relative path. */
const abs = (base: URL | string, path: string) => new URL(path, base).href;

/** Stable identifiers, so cross-page references resolve to the same node. */
export const ids = {
  person: (base: URL | string) => `${new URL('/', base).href}#person`,
  website: (base: URL | string) => `${new URL('/', base).href}#website`,
};

/** Who Yves is. Declared in full on the home page, referenced by @id everywhere else. */
export function person(base: URL | string) {
  return {
    '@type': 'Person',
    '@id': ids.person(base),
    name: site.name,
    url: new URL('/', base).href,
    /* jobTitle is the plain-language answer to "what does he do", and the one a knowledge
       panel reads. It is deliberately the long form, not the short lock-screen label. */
    jobTitle: site.role,
    description:
      'Yves Kwameh is a strategic UX/UI designer and no-code developer in Port Harcourt, ' +
      'Nigeria, working with clients in any time zone. He designs in Figma and builds in ' +
      'Webflow, Framer and Astro.',
    image: abs(base, site.avatar),
    email: `mailto:${site.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location,
      addressCountry: 'NG',
    },
    /* sameAs is the strongest identity signal there is: it ties this page to profiles a
       search engine already trusts. Straight from the same list the lock screen renders,
       so the two can never drift. */
    sameAs: site.socials.map((s) => s.url),
    knowsAbout: [
      'UX design',
      'UI design',
      'Product design',
      'Design systems',
      'Figma',
      'Webflow',
      'Framer',
      'Astro',
      'No-code development',
    ],
  };
}

/** The site itself. */
export function website(base: URL | string) {
  return {
    '@type': 'WebSite',
    '@id': ids.website(base),
    name: site.name,
    alternateName: 'Yves Desktop',
    url: new URL('/', base).href,
    description:
      'The portfolio of Yves Kwameh, built as a retro operating system. Open the windows ' +
      'on the desktop to read the case studies.',
    inLanguage: 'en',
    author: { '@id': ids.person(base) },
    publisher: { '@id': ids.person(base) },
  };
}

/**
 * The home page is a profile page: its subject is a person, not an article. This is the
 * type Google documents for exactly that, and it is what lets the Person above be read as
 * the point of the page rather than a mention on it.
 *
 * No dateCreated or dateModified. Google accepts both here and we have neither honestly.
 */
export function profilePage(base: URL | string) {
  return {
    '@type': 'ProfilePage',
    '@id': `${new URL('/', base).href}#profilepage`,
    url: new URL('/', base).href,
    name: `${site.name}, ${site.title.toLowerCase()}`,
    isPartOf: { '@id': ids.website(base) },
    mainEntity: { '@id': ids.person(base) },
  };
}

/** What a case study needs from its frontmatter. Kept loose so content.config.ts owns the schema. */
type Project = {
  id: string;
  data: {
    title: string;
    client: string;
    year: number;
    summary: string;
    role: string;
    stack: string[];
    cover: string;
    url?: string;
  };
};

/**
 * A case study is a CreativeWork, not an Article.
 *
 * Article wants a publish date and an author byline, and treats the page as reporting.
 * These are records of work done in a given year, which is all we can say truthfully: the
 * frontmatter has a year and no date, and inventing 1 January to satisfy a schema is
 * exactly the kind of thing that makes structured data worthless. A bare year is valid
 * ISO 8601, so datePublished stays honest.
 *
 * `image` takes the card drawn for this case study when one exists, and the cover
 * otherwise. The caller decides, because only it can check the filesystem.
 */
export function caseStudy(base: URL | string, p: Project, image?: string) {
  const url = abs(base, `/work/${p.id}/`);
  return {
    '@type': 'CreativeWork',
    '@id': `${url}#work`,
    name: p.data.title,
    headline: p.data.title,
    description: p.data.summary,
    url,
    mainEntityOfPage: url,
    image: abs(base, image ?? p.data.cover),
    datePublished: String(p.data.year),
    inLanguage: 'en',
    author: { '@id': ids.person(base) },
    creator: { '@id': ids.person(base) },
    /* The client is the party the work was made for, which is what `sourceOrganization`
       means here. Named rather than linked, because most of them have no canonical URL in
       the frontmatter. */
    sourceOrganization: { '@type': 'Organization', name: p.data.client },
    keywords: p.data.stack.join(', '),
    isPartOf: { '@id': ids.website(base) },
    ...(p.data.url ? { sameAs: p.data.url } : {}),
  };
}

/** Home > the page. Two levels is all this site has, and both are real URLs. */
export function breadcrumbs(base: URL | string, trail: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(base, path),
    })),
  };
}

/**
 * Wrap a set of nodes in one @graph. One script tag per page rather than several, because
 * a graph is what lets the nodes reference each other by @id, and because a crawler that
 * chokes on one block should not lose the rest.
 */
export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

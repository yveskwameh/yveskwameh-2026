/**
 * What Yves sells. Drafted from his Upwork profile and confirmed by him, so every line
 * here is something he has actually done and would take on tomorrow.
 *
 * The first two are the same job down two different routes, which is why they are named
 * for the route rather than for the outcome: a client arrives already knowing whether
 * they want Webflow or whether they need something Webflow cannot do, and the fastest
 * thing the page can do is let them recognise themselves.
 *
 * `gets` is the deliverable list. Keep it concrete and keep it to things that are handed
 * over: a file, a site, a list. "Great communication" is not a deliverable.
 */
export type Service = {
  /** Used for the radio id, so it has to be unique and URL safe. */
  id: string;
  name: string;
  /** One or two sentences. What it is, in his voice. */
  what: string;
  /** What the client walks away holding. */
  gets: string[];
};

export const services: Service[] = [
  {
    id: 'no-code',
    name: 'No code design and build',
    what: 'Webflow or Framer. I design it in Figma and build it myself, so nothing gets lost in the handoff and you are not paying two people for one website. Send me a design you already have and I will just build it.',
    gets: [
      'The Figma file',
      'The built site',
      'A CMS your team can publish from without calling a developer',
      'Clean classes another developer can pick up later',
    ],
  },
  {
    id: 'front-end',
    name: 'Front end design and build',
    what: 'For what Webflow cannot do. Astro, React or Next.js, TypeScript and plain CSS, with the same person on the design and the build so the two do not drift apart.',
    gets: [
      'The Figma file',
      'The built front end',
      'Components your developers can carry on with',
    ],
  },
  {
    id: 'product-ui',
    name: 'Product and dashboard UI',
    what: 'Screens for SaaS products, web apps and dashboards. Flows and wireframes first, then the high fidelity design.',
    gets: [
      'User flows and wireframes',
      'Final screens in Figma',
      'Every state written down, rather than left to the developer to guess',
    ],
  },
  {
    id: 'landing',
    name: 'Landing pages',
    what: 'One page built around one action.',
    gets: [
      'The page designed and built',
      'Responsive',
      'Sections ordered to lead to that action',
    ],
  },
  {
    id: 'design-systems',
    name: 'Design systems',
    what: 'Components and variables that still work when the file grows.',
    gets: [
      'A component set with real variants and states',
      'New pages assembled out of parts that already exist',
    ],
  },
  {
    id: 'fixes',
    name: 'Fixing a site you already have',
    what: 'Speed, Core Web Vitals, on page SEO structure, and UX fixes where the site is losing people.',
    gets: [
      'A list of what is wrong, in the order I would fix it',
      'Then the fixes',
    ],
  },
];

/** Sits under the list. His own words from the Upwork profile, trimmed. */
export const howIWork =
  'Business goal first, then the UX structure, then the design, then the build. If something in the design will not translate cleanly to the web, I tell you before I build it, not after.';

/**
 * What Yves sells, written from the client's side of the table.
 *
 * The first version of this file listed what Yves does. That is the wrong half of the
 * trade. Nobody buys a Figma file: they buy a site their team can run without paying a
 * developer every time a price changes, or a landing page that sells the thing it was
 * built to sell. So every service leads with `outcome`, which is what the client walks
 * away able to do, and only then says what the work is and what gets handed over.
 *
 * The deliverables stay, because a promise with nothing under it is worth nothing, and a
 * client comparing two quotes needs to see what is actually in the box. They are the
 * evidence, not the pitch.
 *
 * Three groups, named for the situation the client arrives in rather than for the craft.
 * Somebody lands here already knowing whether they need a site built, a product designed,
 * or a site that is losing them money looked at, and the fastest thing this window can do
 * is let them recognise themselves.
 *
 * Two rules for anything added here. No claim that cannot be kept: no percentages, no
 * "double your conversions", nothing that turns into an argument later. And `gets` stays
 * concrete, a file, a site, a list. "Great communication" is not a deliverable.
 */
export type Service = {
  /** Used for the radio id, so it has to be unique and URL safe. */
  id: string;
  name: string;
  /**
   * What the client can do afterwards that they could not do before, in one line and in
   * their terms. This is the first thing shown, on the closed row, so a visitor who never
   * opens anything still learns what each service is for.
   */
  outcome: string;
  /** One or two sentences. What the work actually is, in his voice. */
  what: string;
  /** What the client walks away holding. */
  gets: string[];
  /**
   * Anchors, both optional and both deliberately empty.
   *
   * These are Yves's numbers and nobody else's. A timeframe or a starting price invented
   * here becomes a figure a client holds him to, so they stay blank until he gives them
   * and the window simply renders nothing in the meantime. Fill them and the row shows
   * them, no other change needed.
   *
   *   timeline: 'Usually 2 to 3 weeks'
   *   from:     'From $1,500'
   */
  timeline?: string;
  from?: string;
};

export type ServiceGroup = {
  id: string;
  /** The client's situation, not the discipline. */
  label: string;
  services: Service[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: 'build',
    label: 'You need a site built',
    services: [
      {
        id: 'no-code',
        name: 'No code design and build',
        outcome: 'A site your team can update without calling a developer.',
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
        outcome: 'Nothing gets dropped between the design and the build.',
        what: 'For what Webflow cannot do. Astro, React or Next.js, TypeScript and plain CSS, with the same person on the design and the build so the two do not drift apart.',
        gets: [
          'The Figma file',
          'The built front end',
          'Components your developers can carry on with',
        ],
      },
      {
        id: 'landing',
        name: 'Landing pages',
        outcome: 'A page that does the one job you built it for.',
        what: 'One page built around one action. I work out what has to be true before somebody will take that action, then order the page so they meet those things in that order.',
        gets: [
          'The page designed and built',
          'Responsive',
          'Sections ordered to lead to that action',
        ],
      },
    ],
  },
  {
    id: 'product',
    label: 'You need a product designed',
    services: [
      {
        id: 'product-ui',
        name: 'Product and dashboard UI',
        outcome: 'Screens your developers can build without guessing.',
        what: 'Screens for SaaS products, web apps and dashboards. Flows and wireframes first, then the high fidelity design, so the structure is agreed before anybody argues about a colour.',
        gets: [
          'User flows and wireframes',
          'Final screens in Figma',
          'Every state written down, rather than left to the developer to guess',
        ],
      },
      {
        id: 'design-systems',
        name: 'Design systems',
        outcome: 'New pages get assembled from parts that already exist.',
        what: 'Components and variables that still work when the file grows, so the tenth page costs less than the first one did.',
        gets: [
          'A component set with real variants and states',
          'New pages assembled out of parts that already exist',
        ],
      },
    ],
  },
  {
    id: 'fix',
    label: 'You have a site that is not working',
    services: [
      {
        id: 'fixes',
        name: 'Fixing a site you already have',
        outcome: 'Find where the site is losing people, then fix it.',
        what: 'Speed, Core Web Vitals, on page SEO structure, and UX fixes where the site is losing people. You see the list before I touch anything, so you can stop at the audit if that is all you wanted.',
        gets: [
          'A list of what is wrong, in the order I would fix it',
          'Then the fixes',
        ],
      },
    ],
  },
];

/** Flat, for anything that wants the whole list rather than the groups. */
export const services: Service[] = serviceGroups.flatMap((g) => g.services);

/** Sits under the list. His own words from the Upwork profile, trimmed. */
export const howIWork =
  'Business goal first, then the UX structure, then the design, then the build. If something in the design will not translate cleanly to the web, I tell you before I build it, not after.';

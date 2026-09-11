/**
 * What Yves sells. This is a sales page, so it is written as one.
 *
 * The first version listed what Yves does, which is the wrong half of the trade. Nobody
 * buys a Figma file. They buy their way out of something: a marketing team that waits on
 * engineering to change a price, a design that shipped looking like a cousin of itself, a
 * landing page quietly spending the ad budget and returning nothing.
 *
 * So each service names that thing and then shows why it does not happen here. That is
 * the value equation underneath, raise the outcome and the belief it will actually
 * happen, lower the time and the effort, without the framework ever showing on the page.
 * The fears are researched rather than assumed, and the specificity is what does the
 * persuading: anybody can promise a better website, and only somebody who has done the
 * work knows the long name breaks the layout.
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
 * Two rules for anything added here, and they are what keep this from reading like every
 * other agency page. No claim that cannot be kept: no percentages, no "double your
 * conversions", nothing that turns into an argument on a call. And `gets` stays concrete,
 * a file, a site, a list. "Great communication" is not a deliverable.
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
   * Anchors. Both optional: leave either out and the row simply does not show it.
   *
   * The figures below are a starting point Yves asked to see rather than numbers he gave,
   * pitched at a Top Rated freelancer doing design and build. They are the one thing on
   * this page a client will hold him to on a call, so they are his to correct, and
   * correcting one is a single line here.
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
        outcome: 'Change a price or publish a page without waiting on anybody.',
        what: 'If changing one line on your site means emailing someone and waiting, that is the thing this fixes. Webflow or Framer, designed in Figma and built by me, so nothing is lost between the two and you are not paying two people for one website. Your team gets a CMS they will actually use, which is the difference between a site that stays current and one that quietly goes stale. Send me a design you already have and I will just build it.',
        gets: [
          'The Figma file',
          'The built site',
          'A CMS your team can publish from without calling a developer',
          'Clean classes another developer can pick up later',
        ],
        timeline: 'Usually 2 to 3 weeks',
        from: 'From $1,500',
      },
      {
        id: 'front-end',
        name: 'Front end design and build',
        outcome: 'What you approved in Figma is what goes live.',
        what: 'A design gets approved, somebody else builds it, and what ships looks like a cousin of it. One person on both ends means there is nobody to hand it to and nothing to lose in the passing. Astro, React or Next.js, TypeScript and plain CSS, for the things Webflow cannot do, and your developers get code they can carry on with rather than something only I understand.',
        gets: [
          'The Figma file',
          'The built front end',
          'Components your developers can carry on with',
        ],
        timeline: 'Usually 3 to 4 weeks',
        from: 'From $2,000',
      },
      {
        id: 'landing',
        name: 'Landing pages',
        outcome: 'The traffic you paid for stops leaving on the first screen.',
        what: 'A page that looks good and converts nothing is an expensive page, because it is spending your ad budget either way. So I start from the one action, work out what somebody has to believe before they will take it, and order the page so they meet those things in that order. The ad and the page say the same thing, and it loads fast enough that nobody leaves before it does.',
        gets: [
          'The page designed and built',
          'Responsive',
          'Sections ordered to lead to that action',
        ],
        timeline: 'About a week',
        from: 'From $600',
      },
    ],
  },
  {
    id: 'product',
    label: 'You need a product designed',
    services: [
      {
        id: 'product-ui',
        name: 'Product, dashboard and mobile UI',
        outcome: 'Nobody has to guess what the screen does when it is empty or it breaks.',
        what: 'What goes wrong after a handoff is rarely the happy path. It is the states nobody drew: empty, loading, error, too much data, the name that is far too long. I draw those. Flows and wireframes first so the structure is settled before anybody argues about a colour, then the screens, for SaaS products, web apps, mobile apps and dashboards.',
        timeline: 'Usually 2 to 4 weeks',
        from: 'From $1,800',
        gets: [
          'User flows and wireframes',
          'Final screens in Figma',
          'Every state written down, rather than left to the developer to guess',
        ],
      },
      {
        id: 'design-systems',
        name: 'Design systems',
        outcome: 'The tenth screen costs less than the first one did.',
        what: 'A file that works at twenty screens and falls apart at two hundred is the normal way this goes, and by then it is cheaper to start again than to fix. Components and variables built to survive the product growing, with real variants and states rather than a folder of detached copies. After it, a new page is assembly rather than another design job.',
        gets: [
          'A component set with real variants and states',
          'New pages assembled out of parts that already exist',
        ],
        timeline: 'Usually 2 to 3 weeks',
        from: 'From $1,000',
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
        outcome: 'Find out what is actually wrong before anybody sells you a rebuild.',
        what: 'A rebuild is the most expensive answer and it is not always the right one. I go through speed, Core Web Vitals, on page SEO structure and the places the site is losing people, then hand you the list before I touch anything. You can stop at the list if that is all you wanted, and take it to whoever you like.',
        gets: [
          'A list of what is wrong, in the order I would fix it',
          'Then the fixes',
        ],
        timeline: 'Audit in 3 days',
        from: 'From $400',
      },
    ],
  },
];

/** Flat, for anything that wants the whole list rather than the groups. */
export const services: Service[] = serviceGroups.flatMap((g) => g.services);

/** Sits under the list. His own words from the Upwork profile, trimmed. */
export const howIWork =
  'Business goal first, then the UX structure, then the design, then the build. If something in the design will not translate cleanly to the web, I tell you before I build it, not after.';

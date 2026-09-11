/**
 * What clients said. Every one of these is already published on yveskwameh.com, so the
 * permission question is settled before it gets here.
 *
 * Three came through Upwork. Their `role` says so rather than naming a company, because
 * the site labelled them "Contractor" and they are clients, not contractors.
 *
 * Nothing in this file is written by anyone but the person credited. If a quote ever
 * needs shortening, cut whole sentences from the end and never rewrite the middle: a
 * testimonial that has been edited for flow is not a testimonial any more.
 *
 * The star ratings are deliberately absent. Upwork does not expose review text or scores
 * through its API and the site blocks scraping, so there is no honest source for a number
 * next to these. The Job Success Score in `record` is the one measured figure available.
 */
export type Quote = {
  name: string;
  /** Job title and company, or how the work came about. */
  role: string;
  quote: string;
  /**
   * File in public/images/feedback, 96px square avif. Optional: a quote without one
   * falls back to the person's initials rather than to a stock face.
   */
  avatar?: string;
};

export const feedback: Quote[] = [
  {
    name: 'Matthew Haimm',
    role: 'Creative Dir. & Founder, Minerva Creative Co.',
    avatar: 'matthew.avif',
    quote: 'Yves joined us in our early-stage after a cold DM, and within a year he became the Swiss Army knife every startup needs.',
  },
  {
    name: 'Richard Tamunotonye',
    avatar: 'richard.avif',
    role: 'Founder, Productsio',
    quote: 'I have worked with Yves for over three years, and his skill, dedication, and problem-solving consistently stand out.',
  },
  {
    // No photograph yet. Falls back to initials until Yves sends one.
    name: 'Sid Jain',
    role: 'via Upwork',
    quote: 'Working with Yves was effortless. He delivered everything assigned on schedule, communicated clearly, and ensured the final result exceeded expectations.',
  },
  {
    name: 'Viktor Dimitrievski',
    avatar: 'viktor.avif',
    role: 'via Upwork',
    quote: 'Yves transformed our webpage with a fresh, modern design that matched our requirements perfectly.',
  },
  {
    name: 'Victory Achionye',
    avatar: 'victory.avif',
    role: 'via Upwork',
    quote: 'Yves is genuinely brilliant! He got the job done and will definitely hire again!',
  },
  {
    name: 'Samuel Sabastine',
    avatar: 'samuel.avif',
    role: 'Creative Director, Sab Logo',
    quote: 'Yves communicates clearly, brings fresh ideas, and stays patient under pressure.',
  },
];

/**
 * The measured record, from the Upwork profile on 11 September 2026. Update these by hand
 * when they move, and only from the profile itself: no rounding up, no "over 30".
 */
export const record = [
  ['100%', 'Job Success Score on Upwork'],
  ['30', 'jobs delivered'],
] as const;

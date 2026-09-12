/**
 * Two sets of photographs, in two different places, for two different reasons.
 *
 * `portraits` are of Yves, pulled from the About section of his previous site. They are
 * the ones that carry his face, so they belong in the About window next to his name.
 * All six are square, which is how that site cropped them.
 *
 * `prints` are by Yves: nine photographs of Port Harcourt taken on his phone, streets and
 * nature, no client and no brief. They used to be in the About window and he moved them
 * out: a photograph he took is not about him, it is something he made, so it sits on the
 * desktop like a print left on a desk, white border and all, and the visitor can drag it
 * around. That is the E direction from the second round of wireframes (Figma 280:17).
 *
 * Every print is portrait, eight at 3:4 and `sunset-on-the-main-road` close to square.
 * Ratios are kept: nothing here is cropped, so each carries its own width and height.
 *
 * Files. Portraits ship at 320 and 800, offered through srcset; the About grid shows them
 * about 151 wide so the browser takes the 320. Prints ship at 240, which is more than a
 * 112px print needs on a 2x screen, plus the 1400 master for the day something shows one
 * properly. The prints are on the desktop, so unlike a window they load with the page,
 * but under 640px the whole layer is display: none and a background inside display: none
 * is never fetched, so the phone pays nothing and the mobile Lighthouse target holds.
 */
export type Portrait = {
  /** File stem under /images/about, without the size suffix. */
  slug: string;
  alt: string;
};

export type Print = {
  /** File stem under /images/prints, without the size suffix. */
  slug: string;
  alt: string;
  /** Of the 1400 master. The 240 has the same ratio. */
  w: number;
  h: number;
  /** Starting place on the desktop: left as a percentage of its width, top in px. */
  x: number;
  y: number;
  /** Degrees. A print left on a desk is never quite straight. */
  r: number;
};

export const portraits: Portrait[] = [
  { slug: 'face-02', alt: 'Yves in the audience at a conference, wearing a Lightning Speaker lanyard' },
  { slug: 'face-03', alt: 'Yves on a sofa speaking into a microphone on a panel' },
  { slug: 'face-04', alt: 'Yves in front of the speakers board at an event, with his own name on it' },
  { slug: 'face-01', alt: 'Yves standing on the turf at DevFest' },
  { slug: 'face-05', alt: 'Yves and four friends in a selfie at an event' },
  { slug: 'face-06', alt: 'Yves from behind at his desk, working across a monitor and a laptop' },
];

/*
 * Positions keep clear of the icon columns on the left (they end near 212px) and of the
 * dock reserve at the bottom. Left is a percentage so the scatter spreads with the
 * screen rather than bunching in one corner on a wide one. Top is pixels so nothing lands
 * under the dock on a short one. The visitor drags them anywhere after that.
 */
export const prints: Print[] = [
  { slug: 'bridge',                  alt: 'A bridge over water with a yellow railing running the length of it', w: 1050, h: 1400, x: 30, y: 36,  r: -6 },
  { slug: 'palm-avenue',             alt: 'A dirt path running between two lines of palm trees',                w: 1050, h: 1400, x: 42, y: 22,  r: 4 },
  { slug: 'sky-over-the-wires',      alt: 'Clouds over low rooftops, with a power line crossing the sky',        w: 1050, h: 1400, x: 55, y: 48,  r: 6 },
  { slug: 'market-day',              alt: 'A market street crowded with umbrellas, buses and people',            w: 1050, h: 1400, x: 68, y: 26,  r: -4 },
  { slug: 'roofline-at-dusk',        alt: 'The roofline of a building against a dusk sky',                       w: 1050, h: 1400, x: 81, y: 60,  r: 5 },
  { slug: 'hibiscus',                alt: 'A red hibiscus held in a hand',                                       w: 1050, h: 1400, x: 88, y: 260, r: -3 },
  { slug: 'cormorant',               alt: 'A cormorant standing on a post at the edge of a field',               w: 1054, h: 1400, x: 36, y: 300, r: 3 },
  { slug: 'bird-on-the-water',       alt: 'A dark bird on rippled open water',                                   w: 1054, h: 1400, x: 52, y: 340, r: -5 },
  { slug: 'sunset-on-the-main-road', alt: 'Sunset over a main road, with a billboard frame above the buildings', w: 1268, h: 1400, x: 70, y: 310, r: 4 },
];

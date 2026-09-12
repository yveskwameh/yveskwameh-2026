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
 * desktop like a print left on a desk, white border and all. They are one pile, shuffled
 * on top of each other in one place rather than scattered across the whole desk, and
 * hovering one opens it in a Quick Look panel the way the space bar does on macOS. The
 * visitor can also drag any of them out of the pile.
 *
 * Every print is portrait, eight at 3:4 and `sunset-on-the-main-road` close to square.
 * Ratios are kept: nothing here is cropped, so each carries its own width and height.
 *
 * Files. Portraits ship at 320 and 800, offered through srcset; the About grid shows them
 * about 131 wide so the browser takes the 320. Prints ship at 240 for the pile, which is
 * more than a 120px print needs on a 2x screen, and the 1400 master is what Quick Look
 * shows, fetched only when a print is hovered. The pile is on the desktop, so unlike a
 * window it loads with the page, but under 640px the whole layer is display: none and a
 * background inside display: none is never fetched, so the phone pays nothing.
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
  /** Offset from the pile's origin, in px. The origin itself is set in os/Prints.astro. */
  dx: number;
  dy: number;
  /** Degrees. A print dropped on a pile is never straight. */
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
 * The pile. Offsets are small and the angles are big, which is what makes nine prints
 * read as one dropped stack rather than a neat fan. Later entries sit on top, so the last
 * one here is the one you see first.
 */
export const prints: Print[] = [
  { slug: 'bridge',                  alt: 'A bridge over water with a yellow railing running the length of it', w: 1050, h: 1400, dx: -44, dy: 36,  r: 9 },
  { slug: 'palm-avenue',             alt: 'A dirt path running between two lines of palm trees',                w: 1050, h: 1400, dx: 48,  dy: -4,  r: -5 },
  { slug: 'sky-over-the-wires',      alt: 'Clouds over low rooftops, with a power line crossing the sky',        w: 1050, h: 1400, dx: -8,  dy: -30, r: 7 },
  { slug: 'market-day',              alt: 'A market street crowded with umbrellas, buses and people',            w: 1050, h: 1400, dx: 12,  dy: 40,  r: -12 },
  { slug: 'roofline-at-dusk',        alt: 'The roofline of a building against a dusk sky',                       w: 1050, h: 1400, dx: -36, dy: -10, r: 4 },
  { slug: 'hibiscus',                alt: 'A red hibiscus held in a hand',                                       w: 1050, h: 1400, dx: 40,  dy: 22,  r: 10 },
  { slug: 'cormorant',               alt: 'A cormorant standing on a post at the edge of a field',               w: 1054, h: 1400, dx: -22, dy: 18,  r: -3 },
  { slug: 'bird-on-the-water',       alt: 'A dark bird on rippled open water',                                   w: 1054, h: 1400, dx: 26,  dy: -14, r: 6 },
  { slug: 'sunset-on-the-main-road', alt: 'Sunset over a main road, with a billboard frame above the buildings', w: 1268, h: 1400, dx: 0,   dy: 0,   r: -8 },
];

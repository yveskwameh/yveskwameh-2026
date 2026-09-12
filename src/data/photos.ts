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
 * desktop like a print left on a desk, white border and all. They are one loose pile in
 * one place, spread enough that every one can be seen and overlapping enough to read as
 * a pile, and hovering one opens it in a Quick Look panel the way the space bar does on
 * macOS. The visitor can also drag any of them out of the pile.
 *
 * Every print is portrait, eight at 3:4 and `sunset-on-the-main-road` close to square.
 * Ratios are kept: nothing here is cropped, so each carries its own width and height.
 *
 * Files. Portraits ship at 320 and 800, offered through srcset; the About reel shows them
 * around 300 tall so a 2x screen takes the 800. Prints ship at 240 for the pile, which is
 * enough for a 136px print on a 2x screen, and the 1400 master is what Quick Look shows,
 * fetched only when a print is hovered. The pile is on the desktop, so unlike a window it
 * loads with the page, but under 640px the whole layer is display: none and a background
 * inside display: none is never fetched, so the phone pays nothing.
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
 * The pile, spread tall rather than wide. Offsets run about 165px across and 415px down
 * for 136px prints, which makes the whole spread 300 wide by 600 tall. That width is the
 * point: the Quick Look panel opens centred and about 550 wide, and the pile has to sit
 * entirely to the right of it or the panel covers prints the visitor is trying to reach.
 * The origin in os/Prints.astro is measured from the right edge for the same reason.
 * Later entries sit on top: the two in the middle go first so they sit behind, and the
 * ones on the edges, which have the most room to be seen, go last.
 */
export const prints: Print[] = [
  { slug: 'sunset-on-the-main-road', alt: 'Sunset over a main road, with a billboard frame above the buildings', w: 1268, h: 1400, dx: 10,  dy: -20,  r: 2 },
  { slug: 'roofline-at-dusk',        alt: 'The roofline of a building against a dusk sky',                       w: 1050, h: 1400, dx: 0,   dy: 90,   r: -4 },
  { slug: 'sky-over-the-wires',      alt: 'Clouds over low rooftops, with a power line crossing the sky',        w: 1050, h: 1400, dx: -70, dy: -200, r: -3 },
  { slug: 'market-day',              alt: 'A market street crowded with umbrellas, buses and people',            w: 1050, h: 1400, dx: 80,  dy: -160, r: 5 },
  { slug: 'bridge',                  alt: 'A bridge over water with a yellow railing running the length of it', w: 1050, h: 1400, dx: -60, dy: -60,  r: -6 },
  { slug: 'bird-on-the-water',       alt: 'A dark bird on rippled open water',                                   w: 1054, h: 1400, dx: 94,  dy: 10,   r: 6 },
  { slug: 'hibiscus',                alt: 'A red hibiscus held in a hand',                                       w: 1050, h: 1400, dx: 70,  dy: 130,  r: -8 },
  { slug: 'palm-avenue',             alt: 'A dirt path running between two lines of palm trees',                w: 1050, h: 1400, dx: -50, dy: 200,  r: 4 },
  { slug: 'cormorant',               alt: 'A cormorant standing on a post at the edge of a field',               w: 1054, h: 1400, dx: 60,  dy: 215,  r: -2 },
];

/**
 * The photographs in the About window.
 *
 * These are Yves's own, taken on his phone. Streets, landscapes and nature, no client and
 * no brief, which is the reason the last paragraph of the About copy gives for them being
 * there at all. They are not portraits of him and the window should never be built as if
 * they were.
 *
 * Every one is portrait. Eight are 3:4 and `sunset-on-the-main-road` is close to square,
 * which is the only reason the grid uses `align-items: start` instead of a fixed
 * aspect-ratio: forcing that one into 3:4 would crop the sides off it, and nothing in this
 * window is cropped. It sits last on purpose, so the short cell is the bottom right one
 * and reads as the shape of the photograph rather than as a gap in the layout.
 *
 * Two files each. The grid shows them about 151 CSS pixels wide, so the browser takes the
 * 420 and the whole set costs 210KB rather than 944. The 1400 is there for the day
 * something shows one properly. Rebuild both with the scripts noted in the commit.
 *
 * Nothing here is fetched on page load. The window is closed, the images are lazy, and a
 * lazy image inside a hidden window is not requested until the window opens.
 */
export type Photo = {
  /** File stem under /images/about. Both sizes share it. */
  slug: string;
  /** Describes the photograph, for somebody who cannot see it. Not a title. */
  alt: string;
  /** Of the 1400 file, for the width descriptor and to reserve the space. */
  w: number;
  h: number;
  /** Of the 420 file. Ratios are the same, the rounding is not. */
  smallW: number;
  smallH: number;
};

export const photos: Photo[] = [
  {
    slug: 'bridge',
    alt: 'A bridge over water with a yellow railing running the length of it',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'palm-avenue',
    alt: 'A dirt path running between two lines of palm trees',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'sky-over-the-wires',
    alt: 'Clouds over low rooftops, with a power line crossing the sky',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'market-day',
    alt: 'A market street crowded with umbrellas, buses and people',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'roofline-at-dusk',
    alt: 'The roofline of a building against a dusk sky',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'hibiscus',
    alt: 'A red hibiscus held in a hand',
    w: 1050, h: 1400, smallW: 420, smallH: 560,
  },
  {
    slug: 'cormorant',
    alt: 'A cormorant standing on a post at the edge of a field',
    w: 1054, h: 1400, smallW: 420, smallH: 558,
  },
  {
    slug: 'bird-on-the-water',
    alt: 'A dark bird on rippled open water',
    w: 1054, h: 1400, smallW: 420, smallH: 558,
  },
  {
    // Last on purpose. See the note above: this is the one that is not 3:4.
    slug: 'sunset-on-the-main-road',
    alt: 'Sunset over a main road, with a billboard frame above the buildings',
    w: 1268, h: 1400, smallW: 420, smallH: 464,
  },
];

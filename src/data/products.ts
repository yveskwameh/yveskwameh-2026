/**
 * Things Yves has built for himself, on the shelf on the desktop.
 *
 * Adding one is one entry here plus its icon. Take the 512px icon from the product's own
 * web manifest, keep the master in assets/products/<id>.png, and write the shipped copy
 * with `sips -s format avif -Z 168 assets/products/<id>.png --out public/images/products/<id>.avif`.
 * 168 is three times the 56px the shelf draws it at, so it stays sharp on a 3x phone.
 *
 * These are real app icons, not Yves-drawn ones. ICON-SPEC covers the desktop's own icons,
 * and a product's icon is its brand, so it is shown as the product ships it.
 *
 * `embed` says whether the product lets this site show it inside the Browser window. A
 * site refuses by sending `frame-ancestors` or `X-Frame-Options`. A browser cannot tell a
 * page that a frame was refused, so a script cannot detect it reliably. That is why it is
 * written down here. Check before turning it on:
 *
 *   curl -sI https://the.product | grep -iE 'frame-ancestors|x-frame-options'
 *
 * It needs to allow https://yveskwameh.com or send neither. When `embed` is false the
 * window shows a plain way out to the real site instead of a refused frame.
 *
 * On a phone none of this applies: the shelf item is a link, and it opens the real site
 * in a new tab, where a PWA can also be installed.
 */
export type Product = {
  id: string;
  name: string;
  url: string;
  /** What it is, in a few words. Shown on the shelf tag and the start page. */
  line: string;
  status: 'Live' | 'In progress';
  embed: boolean;
};

export const products: Product[] = [
  {
    id: 'pennivault',
    name: 'pennivault',
    url: 'https://pennivault.xyz/',
    line: 'Monthly budgeting',
    status: 'Live',
    embed: true,
  },
  {
    id: 'daraxando',
    name: 'Dara X&O',
    url: 'https://daraxando.yveskwameh.com/',
    line: 'Tic tac toe, online',
    status: 'Live',
    embed: true,
  },
];

export const productIcon = (id: string) => `/images/products/${id}.avif`;

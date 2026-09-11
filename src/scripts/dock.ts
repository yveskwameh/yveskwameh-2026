/**
 * macOS-style dock magnification, driven by pointer distance rather than :hover.
 *
 * CSS :hover can only answer "is the pointer on this icon", so the effect died in the
 * gaps between icons and only the immediate neighbours could ever grow. This measures
 * the pointer against every icon centre, so the whole dock responds the moment the
 * cursor crosses into it, and the bulge follows the pointer smoothly.
 *
 * Nothing here reads layout. That is the important part, and it is what fixed the dock
 * snapping to full size on the first hover. Measuring each icon with
 * getBoundingClientRect on every frame reads positions that are themselves mid-resize,
 * so the bulge chased its own tail, and the only way to stop that was to forbid
 * transitions while the pointer was over the dock, which is exactly what made the first
 * frame a jump. Positions are computed instead, from geometry cached once at rest, so
 * they are stable, a transition is safe, and entry eases the way exit already did.
 *
 * Sizes are written as a --size custom property. The CSS falls back to the resting size
 * when it is absent, so with JS off the dock is simply static.
 *
 * Fetched on the first mouse movement anywhere on the page, so it has landed long before
 * the pointer reaches the dock. See scripts/lazy.ts.
 */
const MAX = 2;      // biggest an icon gets, as a multiple of its resting size
const REACH = 2.8;  // how far the bulge spreads, in resting icon widths

export function init() {
  const dock = document.querySelector<HTMLElement>('.dock');
  const bar = dock?.querySelector('ul');
  if (!dock || !bar) return;
  // Touch has no pointer to follow, and reduced motion should not get a moving dock
  if (!matchMedia('(hover: hover)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = [...bar.querySelectorAll<HTMLElement>('.dock__item')];
  if (!items.length) return;

  /**
   * Measure the resting size rather than reading --dock-icon. That token is a clamp(),
   * and an unregistered custom property hands back its literal text, not a resolved
   * length, so parsing it yields NaN and every tile collapses.
   */
  let base = 0;
  let home: number[] = [];   // each icon's centre while the dock sits at rest
  const rest = () => {
    for (const it of items) it.style.removeProperty('--size');
    const boxes = items.map((it) => it.getBoundingClientRect());
    base = boxes[0].width;
    home = boxes.map((r) => r.left + r.width / 2);
  };
  rest();
  addEventListener('resize', rest, { passive: true });

  dock.classList.add('is-live');

  // Cosine falloff: full size directly under the pointer, easing to nothing at the edge
  // of reach. Softer shoulders than a linear ramp, which is what makes it feel like macOS.
  const size = (d: number, reach: number) =>
    base * (1 + (MAX - 1) * (d >= reach ? 0 : (Math.cos((d / reach) * Math.PI) + 1) / 2));

  /**
   * Where the icons actually end up once they have grown.
   *
   * The bar is centred by translateX(-50%), so it widens evenly about its middle: the
   * left edge backs off by half the total growth, and every icon is then pushed right by
   * whatever the icons before it gained. That is enough to place all of them from the
   * resting centres alone, and it holds no matter what sits between them, because the
   * divider never changes size and so adds nothing to the running total.
   */
  const place = (s: number[]) => {
    let grown = 0;
    for (let i = 0; i < s.length; i++) grown += s[i] - base;
    let run = -grown / 2;
    return s.map((v, i) => {
      const c = home[i] + run + (v - base) / 2;
      run += v - base;
      return c;
    });
  };

  const draw = (x: number) => {
    const reach = base * REACH;
    /* Twice, because the two answers depend on each other: how big an icon gets depends
       on how far it is from the pointer, and how far it is from the pointer depends on
       how big everything got. The first pass sizes from the resting centres, which are
       wrong by up to an icon width out at the ends of a widened bar, and the second
       re-sizes from where those sizes actually put things. Two passes is close enough
       that the remaining error is invisible, and it costs no layout read. */
    let s = home.map((c) => size(Math.abs(x - c), reach));
    s = place(s).map((c) => size(Math.abs(x - c), reach));
    for (let i = 0; i < items.length; i++) items[i].style.setProperty('--size', `${s[i]}px`);
  };

  let raf = 0;
  dock.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || dock.classList.contains('is-dragging')) return;
    const x = e.clientX;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => draw(x));
  });

  dock.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    dock.classList.add('is-resting');   // settle back a little slower than it tracks
    for (const it of items) it.style.removeProperty('--size');
    setTimeout(() => dock.classList.remove('is-resting'), 240);
  });
}

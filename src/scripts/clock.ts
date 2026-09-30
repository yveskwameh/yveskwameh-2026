/**
 * Menu bar clock: "Sun 6 Sep  10:42" style, updates every minute.
 *
 * Two child spans rather than one string, so a phone can hide the date with a media query.
 * Doing that in script would mean the clock knowing about viewport widths and re-checking
 * on every resize, to save one span.
 *
 * Addressed by index rather than by selector or data attribute. Both cost real bytes here:
 * two querySelector calls with null guards pushed the on-load budget to 8 bytes of
 * headroom. The markup right below this in MenuBar.astro is the only caller and it always
 * renders exactly these two, in this order.
 */
export function startClock(el: HTMLElement | null) {
  if (!el) return;
  const k = el.children;
  const tick = () => {
    const d = new Date();
    k[0].textContent = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    k[1].textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 60_000);
}

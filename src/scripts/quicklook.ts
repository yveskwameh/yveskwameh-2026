/**
 * Quick Look for the pile of prints on the desktop.
 *
 * Hover a print and the panel opens on it. Move off the print, or off the panel, and it
 * closes after a short grace so the pointer can cross the gap between the two. Click a
 * print and the panel is pinned: it stays until the close light, Escape, or a click
 * anywhere else. That is the macOS space bar preview, with hover standing in for the
 * space bar because a desktop icon has no keyboard focus to press it on.
 *
 * The panel is already in the page (os/Prints.astro). This only points it at a print:
 * src, real width and height so the box is right before the file lands, alt, and the
 * file name in the bar. The 1400 master is fetched here and nowhere else, one at a time,
 * only when a print is actually hovered.
 *
 * Fetched on the first pointer movement, with drag, never on page load. See lazy.ts.
 */
export function init() {
  const layer = document.querySelector<HTMLElement>('.prints');
  const ql = document.getElementById('ql');
  if (!layer || !ql) return;
  const img = ql.querySelector('img')!;
  const title = ql.querySelector<HTMLElement>('.ql__title')!;

  let shown: HTMLElement | null = null;
  let pinned = false;
  let timer = 0;

  const show = (p: HTMLElement) => {
    clearTimeout(timer);
    if (shown !== p) {
      shown = p;
      img.width = +p.dataset.w!;
      img.height = +p.dataset.h!;
      img.alt = p.getAttribute('aria-label') || '';
      img.src = `/images/prints/${p.dataset.slug}.avif`;
      title.textContent = `${p.dataset.slug}.avif`;
    }
    ql.hidden = false;
  };
  const hide = () => { clearTimeout(timer); ql.hidden = true; shown = null; pinned = false; };
  // 200ms is enough to cross from a print to the panel and back, and short enough that
  // the panel is gone before the pointer reaches anything else.
  const soon = () => { if (!pinned) { clearTimeout(timer); timer = setTimeout(hide, 200); } };
  const printAt = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>('.print');

  // Hover, mouse only. A finger has no hover, and a pen's is not what a pen means.
  layer.addEventListener('pointerover', (e) => {
    const p = printAt(e);
    if (p && e.pointerType === 'mouse' && !p.classList.contains('is-dragging')) show(p);
  });
  layer.addEventListener('pointerout', (e) => {
    const to = e.relatedTarget as HTMLElement | null;
    if (!to?.closest('.print, .ql')) soon();
  });
  ql.addEventListener('pointerenter', () => clearTimeout(timer));
  ql.addEventListener('pointerleave', soon);

  // A drag is starting: the panel would only sit over the place the print is going.
  layer.addEventListener('pointermove', (e) => { if (e.buttons && !pinned) hide(); });

  // Click pins. drag.ts swallows the click that ends a drag, so a moved print never pins.
  layer.addEventListener('click', (e) => {
    const p = printAt(e);
    if (p) { show(p); pinned = true; }
  });
  ql.querySelector('[data-ql-close]')!.addEventListener('click', hide);
  document.addEventListener('click', (e) => {
    if (pinned && !(e.target as HTMLElement).closest('.print, .ql')) hide();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ql.hidden) hide(); });

  // Keyboard: tab to a print and it previews, tab away and it goes.
  layer.addEventListener('focusin', (e) => { const p = printAt(e); if (p) show(p); });
  layer.addEventListener('focusout', soon);
}

/**
 * Pulling a tool out of the dock.
 *
 * You can lift any of them, drag it anywhere, and once it is clear of the bar a chip
 * offers to remove it. Let go and it does not go: it flies back into its slot and the tool
 * answers for itself. Nothing is ever removed, and nothing is stored, so there is no state
 * to get wrong and no way for a visitor to break the dock.
 *
 * A copy follows the pointer rather than the item itself, because the item is a flex child
 * of the bar and taking it out of flow would collapse the dock around the gap. The
 * original stays where it is and is simply made invisible, so the bar keeps its shape.
 *
 * Fetched on the first pointer movement. See scripts/lazy.ts.
 */
const OUT = 46;         // how far clear of the bar counts as "pulled out"
const SAY_MS = 2600;    // how long the answer stays up

const $ = (id: string) => document.getElementById(id);

export function init() {
  const dock = document.querySelector<HTMLElement>('.dock');
  const hint = $('dock-hint'), say = $('dock-say');
  if (!dock || !hint || !say) return;

  let item: HTMLElement | null = null;
  let ghost: HTMLElement | null = null;
  let sx = 0, sy = 0, out = false, blockUntil = 0;
  let timer = 0;

  /* Same self-clearing deadline as scripts/drag.ts. A lift ends in a click, and that click
     would open the window the item points at, which is not what the visitor asked for. */
  dock.addEventListener('click', (e) => {
    if (blockUntil && e.timeStamp <= blockUntil) e.stopImmediatePropagation();
    blockUntil = 0;
  }, true);

  dock.addEventListener('pointerdown', (e) => {
    blockUntil = 0;
    const li = (e.target as HTMLElement).closest<HTMLElement>('.dock__item');
    if (!li || e.button !== 0) return;
    item = li; sx = e.clientX; sy = e.clientY; out = false;
    // Capture keeps the drag alive once the pointer leaves the bar, which is the whole
    // point here. It throws for a pointer the browser is not actually tracking, so the
    // lift still works without it rather than dying on the first move.
    try { dock.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ }
  });

  dock.addEventListener('pointermove', (e) => {
    if (!item) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;

    // Nothing happens until the pointer has actually travelled, so a plain click on Images
    // or Trash still opens its window.
    if (!ghost && Math.abs(dx) + Math.abs(dy) < 6) return;

    if (!ghost) {
      const box = item.getBoundingClientRect();
      ghost = document.createElement('div');
      ghost.className = 'dock__ghost';
      ghost.innerHTML = item.innerHTML;
      ghost.style.cssText =
        `position:fixed; z-index:859; pointer-events:none; left:${box.left}px; top:${box.top}px;` +
        `width:${box.width}px; height:${box.height}px;`;
      document.body.appendChild(ghost);
      item.classList.add('is-lifted');
    }

    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;

    // Clear of the bar, in any direction, is what arms the offer.
    const bar = dock.getBoundingClientRect();
    const wasOut = out;
    out = e.clientY < bar.top - OUT || e.clientY > bar.bottom + OUT
       || e.clientX < bar.left - OUT || e.clientX > bar.right + OUT;
    if (out !== wasOut) hint.hidden = !out;
    if (out) { hint.style.left = `${e.clientX}px`; hint.style.top = `${e.clientY}px`; }
  });

  const release = (e: PointerEvent) => {
    if (dock.hasPointerCapture(e.pointerId)) dock.releasePointerCapture(e.pointerId);
    hint.hidden = true;
    if (!item) return;
    const li = item, g = ghost;
    item = null; ghost = null;

    if (!g) { out = false; return; }

    blockUntil = e.timeStamp + 400;

    /* Back to where it came from. The transition is on transform, which is already at an
       offset, so animating it to none is the whole trip. --t-base is zeroed under reduced
       motion, which makes this an instant snap rather than a jump from nowhere. */
    g.style.transition = 'transform var(--t-base) var(--ease)';
    g.style.transform = 'translate(0, 0) scale(1)';
    const done = () => { g.remove(); li.classList.remove('is-lifted'); };
    g.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500);   // in case the transition never fires, e.g. reduced motion

    if (out) {
      say.textContent = li.dataset.quip || 'It stays.';
      say.hidden = false;
      clearTimeout(timer);
      timer = window.setTimeout(() => { say.hidden = true; }, SAY_MS);
      // The sound of an icon refusing to leave. See scripts/sfx.ts for who listens.
      document.dispatchEvent(new CustomEvent('sfx', { detail: 'dockDrop' }));
    }
    out = false;
  };

  dock.addEventListener('pointerup', release);
  dock.addEventListener('pointercancel', release);
}

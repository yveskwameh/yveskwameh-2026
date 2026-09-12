/** Pull a dock item out, then always return its visual copy to the live slot. */
const OUT = 46;
const SAY_MS = 2600;
const $ = (id: string) => document.getElementById(id);

export function init() {
  const dockEl = document.querySelector<HTMLElement>('.dock');
  const hintEl = $('dock-hint'), sayEl = $('dock-say');
  if (!dockEl || !hintEl || !sayEl) return;
  const dock = dockEl, hint = hintEl, say = sayEl;   // narrowing does not reach hoisted fns

  let item: HTMLElement | null = null, ghost: HTMLElement | null = null;
  let pointer = -1, sx = 0, sy = 0, origin: DOMRect | null = null;
  let out = false, blockUntil = 0, timer = 0;

  dock.addEventListener('click', (e) => {
    if (blockUntil && e.timeStamp <= blockUntil) e.stopImmediatePropagation();
    blockUntil = 0;
  }, true);

  function move(e: PointerEvent) {
    if (!item || e.pointerId !== pointer) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) return finish(e, true);
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!ghost && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!ghost) {
      /* Capture here, once a drag has actually begun, and not on the press. A captured
         pointer makes the browser fire the click at the capturing element, which is the
         whole dock, so a plain click on the Images or Trash button never reached the
         button and nothing opened. Six pixels of travel is the line between a click and
         a drag, and only a drag needs the capture. */
      try { dock.setPointerCapture(e.pointerId); } catch {}
      origin = item.getBoundingClientRect();
      ghost = document.createElement('div');
      ghost.className = 'dock__ghost'; ghost.innerHTML = item.innerHTML;
      ghost.style.cssText = `position:fixed;z-index:859;pointer-events:none;left:${origin.left}px;top:${origin.top}px;width:${origin.width}px;height:${origin.height}px`;
      document.body.append(ghost); item.classList.add('is-lifted');
    }
    ghost.style.transform = `translate(${dx}px,${dy}px) scale(1.1)`;
    const bar = dock.getBoundingClientRect();
    out = e.clientY < bar.top - OUT || e.clientY > bar.bottom + OUT || e.clientX < bar.left - OUT || e.clientX > bar.right + OUT;
    hint.hidden = !out;
    if (out) { hint.style.left = `${e.clientX}px`; hint.style.top = `${e.clientY}px`; }
  }

  function finish(e?: PointerEvent, suppress = false) {
    if (!item || (e && e.pointerId !== pointer)) return;
    const li = item, g = ghost, id = pointer, wasOut = out, start = origin;
    item = null; ghost = null; pointer = -1; origin = null; out = false;
    hint.hidden = true; dock.classList.remove('is-dragging');
    if (dock.hasPointerCapture(id)) {
      try { dock.releasePointerCapture(id); } catch {}
    }
    if (!g || !start) return;
    blockUntil = (e?.timeStamp ?? performance.now()) + (suppress ? 400 : 0);
    const slot = li.getBoundingClientRect();
    g.style.transition = 'transform var(--t-base) var(--ease)';
    g.style.transform = `translate(${slot.left - start.left}px,${slot.top - start.top}px) scale(${slot.width / start.width})`;
    let cleaned = false;
    const done = () => {
      if (cleaned) return; cleaned = true; g.remove(); li.classList.remove('is-lifted');
    };
    g.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500);
    if (wasOut) {
      say.textContent = li.dataset.quip || 'It stays.'; say.hidden = false;
      clearTimeout(timer); timer = window.setTimeout(() => { say.hidden = true; }, SAY_MS);
      document.dispatchEvent(new CustomEvent('sfx', { detail: 'dockDrop' }));
    }
  }

  dock.addEventListener('pointerdown', (e) => {
    if (item || e.button !== 0) return;
    const li = (e.target as HTMLElement).closest<HTMLElement>('.dock__item');
    if (!li) return;
    blockUntil = 0; item = li; pointer = e.pointerId; sx = e.clientX; sy = e.clientY;
    out = false; origin = null;
    /* Freeze the shelf before measuring the slot, so magnification cannot move the
       destination while the copy is in flight. */
    dock.classList.add('is-dragging');
    dock.querySelectorAll<HTMLElement>('.dock__item').forEach((i) => i.style.removeProperty('--size'));
    // No capture yet. See move(): a press that never travels has to stay a click.
  });

  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', (e) => finish(e, true), true);
  document.addEventListener('pointercancel', (e) => finish(e), true);
  dock.addEventListener('lostpointercapture', (e) => finish(e as PointerEvent));
  addEventListener('blur', () => finish());
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(); });
}

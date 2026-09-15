/**
 * Pointer drag for icons and window title bars, plus corner resize for windows.
 * No library. Off on narrow screens.
 *
 * Fetched on the first pointer movement, not on page load. See scripts/lazy.ts. The two
 * guards that used to live at the top of this file had to stay eager, because they cancel
 * browser defaults and a cancellation cannot wait for a fetch, so they moved to
 * window-manager.ts.
 */
import { px } from './window-manager';

export function init(selector: string) {
  // A phone has no window to drag and no corner to resize: a window is a bottom sheet
  // there, and the only gesture it wants is the one that puts it away. Same file because
  // it is the same thing, a pointer drag on a window's chrome, and because this module is
  // already fetched on the first pointer move. A separate one would cost the on-load
  // budget an import line for a feature only phones use.
  if (window.matchMedia('(max-width: 640px)').matches) return initSheets();

  // A window dragged to the right edge must not be stranded there when the viewport
  // shrinks. Same bounds as the drag, so it lands exactly where a drag would have.
  addEventListener('resize', () => {
    document.querySelectorAll<HTMLElement>('.window.is-open').forEach((win) => {
      const b = windowBounds(win);
      win.style.left = `${clamp(win.offsetLeft, 0, b.right)}px`;
      win.style.top = `${clamp(win.offsetTop, b.top, b.bottom)}px`;
    });
  });

  document.querySelectorAll<HTMLElement>(selector).forEach((handle) => {
    const target = handle.classList.contains('window__titlebar')
      ? (handle.closest('.window') as HTMLElement) : handle;

    /**
     * `dragging` says this gesture is ours, and it is the whole fix for a bug that made
     * the close button stop working.
     *
     * pointerup is bound to the title bar, and pointerup bubbles up from the traffic
     * lights inside it, so it used to run on a close click too. `moved` is only reset in
     * pointerdown, which returns early for a button press, so after any drag it stayed
     * true: the close click then armed the suppressor below and got eaten by it, and so
     * did every close click after that. Escape too, since that closes by dispatching a
     * synthetic click. Gating on `dragging` means a press we declined to handle also gets
     * a pointerup we decline to handle.
     */
    let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, dragging = false, blockUntil = 0;

    /**
     * A drag ends in a click, and that click would select the icon you just moved or focus
     * the window you just dragged, so it gets swallowed.
     *
     * A timestamp, not a one-shot listener. The one-shot version is what broke the close
     * button: it armed on any pointerup the title bar saw, including one bubbling up from
     * a traffic light, and if the click it was waiting for never arrived it sat there and
     * ate the next one instead. A deadline cannot strand itself. It is cleared by the next
     * press as well as by time, so the worst case is that it expires unused.
     */
    handle.addEventListener('click', (c) => {
      if (blockUntil && c.timeStamp <= blockUntil) c.stopImmediatePropagation();
      blockUntil = 0;
    }, true);

    const end = (e: PointerEvent, suppress: boolean) => {
      if (!dragging) return;
      dragging = false;
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      target.classList.remove('is-dragging');
      /* A print that was picked up stays on top. Prints stack in DOM order and carry no
         z-index, so moving the dropped one to the end of its layer is the whole of it.
         Only prints: icons have nothing to stack over and windows run their own z-index
         through focusWindow. */
      if (moved && target.classList.contains('print')) {
        target.parentElement?.appendChild(target);
        /* Where it was let go, for scripts/prints.ts, which decides whether that was on
           the Images icon in the dock. This file does not know what a dock is. */
        target.dispatchEvent(new CustomEvent('print-drop', { bubbles: true, detail: { x: e.clientX, y: e.clientY } }));
      }
      // 400ms is far longer than the gap between a release and its own click, and far
      // shorter than a person deciding to click something else.
      blockUntil = suppress && moved ? e.timeStamp + 400 : 0;
      moved = false;
    };

    handle.addEventListener('pointerdown', (e) => {
      // Any new press means the previous drag's click is never coming, so stop waiting for
      // it. Before the guard below, so a press on a traffic light clears it too.
      blockUntil = 0;
      /**
       * Guard anything in the chrome that is itself a control, but not the handle.
       *
       * A desktop icon IS a <button>, so a plain closest('button') check matched it and no
       * icon could ever be dragged. Hence the `!== handle` half.
       *
       * `label` is here because leaving it out broke the Work sidebar toggle in a way that
       * does not show up in a synthetic test. Pressing a label started a window drag, the
       * title bar called setPointerCapture, and a captured pointer makes the browser fire
       * the click at the capturing element rather than at what is under the cursor. The
       * label never saw the click and its checkbox never flipped. Same shape as the bug
       * that once ate the close button. Any control put in the title bar from now on needs
       * to be in this list or it will silently do nothing.
       */
      const ctl = (e.target as HTMLElement).closest('button, label, input, a, summary');
      if (ctl && ctl !== handle) return;
      handle.setPointerCapture(e.pointerId);
      ox = target.offsetLeft; oy = target.offsetTop; sx = e.clientX; sy = e.clientY;
      moved = false; dragging = true;
      target.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging || !handle.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const parent = target.offsetParent as HTMLElement;
      // Clamp by the icon's own height, not a fixed 40, so it can roam the whole desktop
      // but never ends up half tucked under the dock.
      const b = target.classList.contains('window') ? windowBounds(target) : null;
      target.style.left = `${clamp(ox + dx, 0, b?.right ?? parent.clientWidth - target.offsetWidth)}px`;
      target.style.top = `${clamp(oy + dy, b?.top ?? 0, b?.bottom ?? parent.clientHeight - target.offsetHeight)}px`;
    });
    handle.addEventListener('pointerup', (e) => end(e, true));
    /* Without this, a drag that ends off the edge of the window never runs `end`, so the
       one-shot suppressor stays armed and eats an unrelated click much later. */
    handle.addEventListener('pointercancel', (e) => end(e, false));
  });

  /**
   * Resize, from any edge or corner.
   *
   * data-resize holds the direction, so one handler covers all eight grips. Dragging a
   * north or west edge has to move the window as well as size it: the opposite edge is the
   * one that must stay put, so the origin shifts by however much the size changed. The
   * min() clamps are applied before that shift, otherwise a window squashed to its minimum
   * would keep creeping across the screen as you kept dragging.
   */
  document.querySelectorAll<HTMLElement>('[data-resize]').forEach((grip) => {
    const win = grip.closest('.window') as HTMLElement;
    const dir = grip.dataset.resize || '';
    let sx = 0, sy = 0, w = 0, h = 0, l = 0, t = 0;
    grip.addEventListener('pointerdown', (e) => {
      grip.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      w = win.offsetWidth; h = win.offsetHeight; l = win.offsetLeft; t = win.offsetTop;
      e.stopPropagation();   // do not also start a window drag
    });
    grip.addEventListener('pointermove', (e) => {
      if (!grip.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const b = windowBounds(win);
      const maxW = b ? b.p.clientWidth - l : innerWidth;
      const maxH = b ? b.bottom + win.offsetHeight - b.top : innerHeight;
      if (dir.includes('e')) win.style.width = `${Math.min(maxW, Math.max(MIN_W, w + dx))}px`;
      if (dir.includes('s')) win.style.height = `${Math.min(maxH, Math.max(MIN_H, h + dy))}px`;
      if (dir.includes('w')) {
        const nw = Math.min(l + w, Math.max(MIN_W, w - dx));
        win.style.width = `${nw}px`;
        win.style.left = `${l + w - nw}px`;
      }
      if (dir.includes('n')) {
        const minTop = b?.top ?? 0;
        const nh = Math.min(t + h - minTop, Math.max(MIN_H, h - dy));
        win.style.height = `${nh}px`;
        win.style.top = `${t + h - nh}px`;
      }
    });
    const drop = (e: PointerEvent) => {
      if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
    };
    grip.addEventListener('pointerup', drop);
    grip.addEventListener('pointercancel', drop);
  });
}

/**
 * Swipe a sheet down to dismiss it, on a phone.
 *
 * Bound to the document rather than to each window, because it has to keep working for a
 * window that has not been opened yet and there are seven of them. The press only counts
 * on the grab handle or the title bar: the body scrolls, and a sheet that slid away every
 * time somebody flicked through a case study would be unusable.
 *
 * While the finger is down the sheet carries `is-swiping`, which turns its transition off
 * so it tracks exactly, and an inline `translate` that is cleared on release. `translate`
 * rather than `transform`, matching the CSS, so the two can never fight over a shorthand.
 *
 * Closing goes through the window's own close light, which is the same route the Escape
 * key takes. Nothing new has to be exported from window-manager.ts and the close path
 * stays one path.
 */
function initSheets() {
  // Past a quarter of its own height, or a flick faster than this, and it goes. NUDGE is
  // what keeps the second rule honest: a few pixels in a couple of milliseconds is a very
  // high speed and not a flick, it is a thumb landing slightly off centre.
  const FAR = 0.25, FAST = 0.5, NUDGE = 40;   // FAST is px per ms
  let sheet: HTMLElement | null = null;
  let id = -1, startY = 0, startAt = 0, dy = 0;

  const put = (v: string) => { if (sheet) sheet.style.translate = v; };

  const end = (e: PointerEvent) => {
    if (!sheet || e.pointerId !== id) return;
    const win = sheet, travelled = dy;
    const speed = travelled / Math.max(1, e.timeStamp - startAt);
    sheet = null; id = -1;
    win.classList.remove('is-swiping');
    if (travelled > win.offsetHeight * FAR || (travelled > NUDGE && speed > FAST)) {
      // Let it finish leaving before the class comes off, or it would vanish mid-flight.
      win.style.translate = '0 100%';
      setTimeout(() => {
        win.style.translate = '';
        win.querySelector<HTMLElement>('[data-close]')?.click();
      }, px(document.documentElement, '--t-base') || 200);
      return;
    }
    win.style.translate = '';   // under the threshold: the CSS springs it back
  };

  document.addEventListener('pointerdown', (e) => {
    if (sheet || e.button !== 0) return;
    const grab = (e.target as HTMLElement).closest?.('.window__grab, .window__titlebar');
    if (!grab) return;
    // Not the traffic lights. Close is a button, and a press on it is not a swipe.
    if ((e.target as HTMLElement).closest('button, a')) return;
    sheet = grab.closest('.window');
    if (!sheet) return;
    id = e.pointerId; startY = e.clientY; startAt = e.timeStamp; dy = 0;
    sheet.classList.add('is-swiping');
  }, { passive: true });

  document.addEventListener('pointermove', (e) => {
    if (!sheet || e.pointerId !== id) return;
    dy = Math.max(0, e.clientY - startY);   // down only: a sheet does not go up
    put(`0 ${dy}px`);
  }, { passive: true });

  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const windowBounds = (win: HTMLElement) => {
  const p = win.offsetParent as HTMLElement;
  const top = px(p, '--window-top');
  return { p, top, right: Math.max(0, p.clientWidth - win.offsetWidth),
    bottom: Math.max(top, p.clientHeight - px(p, '--window-bottom') - win.offsetHeight) };
};
/** Matches min-width / min-height in Window.astro. */
const MIN_W = 280, MIN_H = 160;

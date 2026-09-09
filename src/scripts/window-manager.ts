/**
 * Open / close / minimise / zoom / focus.
 * [data-open=id] opens, [data-close=id] closes. Minimise and zoom are drawn on the window
 * but inactive, so there is nothing here for them.
 * Clicking a window focuses it. Clicking the desktop clears focus (undims the rest).
 */
import { launch } from './lazy';

let z = 10;
const q = (id: string) => document.querySelector<HTMLElement>(`[data-window="${id}"]`);
const openWindows = () => document.querySelectorAll<HTMLElement>('.window.is-open');

/**
 * Put a window in the middle of the desktop, in pixels.
 *
 * Pixels rather than a translate(-50%, -50%), because scripts/drag.ts reads offsetLeft and
 * clamps against parent.clientWidth - offsetWidth. A transform is painted and not laid
 * out, so those numbers would stay at the untransformed position and the window could be
 * dragged half off two edges and stop short of the other two. The corner resize grip would
 * drift out from under the pointer for the same reason. Pixels leave all of that alone,
 * and unlike `inset: 0; margin: auto` they also work for the windows sized by their
 * content rather than by a height prop.
 */
/** A layout token in pixels. The window area lives in tokens.css and is read, not copied. */
export const px = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

function placeWindow(win: HTMLElement) {
  const p = win.offsetParent as HTMLElement | null;
  if (!p) return;
  win.style.left = `${Math.max(0, Math.round((p.clientWidth - win.offsetWidth) / 2))}px`;
  win.style.top = `${px(p, '--window-top')}px`;
}

export function openWindow(id: string) {
  const win = q(id); if (!win) return;
  win.classList.add('is-open');
  placeWindow(win);     // every open: centred across, --window-top below the menu bar
  focusWindow(win);
  launch(id);           // the app's own code, fetched the first time its window opens
}
export function closeWindow(id: string) {
  const win = q(id); if (!win) return;
  win.classList.remove('is-open', 'is-focused');
  syncFocus();
}
export function focusWindow(win: HTMLElement) {
  document.querySelectorAll('.window').forEach((w) => w.classList.remove('is-focused'));
  win.classList.add('is-focused');
  win.style.zIndex = String(++z);
  document.body.classList.add('has-focus');
  syncFocus();
}
/**
 * Keep the body flags in step with what is actually open.
 *
 * `has-focus` dims the unfocused windows; `has-window` fades the scrim in. And closing a
 * window now hands focus to whatever was underneath: without that, every remaining window
 * was left unfocused, which greys all of their traffic lights, so the whole desktop looked
 * dead after one close.
 */
function syncFocus() {
  const open = [...openWindows()];
  document.body.classList.toggle('has-window', open.length > 0);
  if (!document.querySelector('.window.is-focused')) {
    const top = open.sort((a, b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0)).pop();
    if (top) top.classList.add('is-focused');
  }
  document.body.classList.toggle('has-focus', !!document.querySelector('.window.is-focused'));
}

/** Select a desktop icon, the way a single click does on a real desktop. */
function selectIcon(icon: HTMLElement | null) {
  document.querySelectorAll('.icon.is-selected').forEach((i) => i.classList.remove('is-selected'));
  icon?.classList.add('is-selected');
}

export function initWindowManager() {
  /**
   * Kill the browser's native drag before it starts. With the artwork moved to CSS
   * backgrounds there is no image left to drag, but text and the buttons themselves can
   * still start one, and a native drag steals the pointer mid-move.
   *
   * This and the guard below used to live in scripts/drag.ts. They moved here when that
   * became a lazy module: both cancel a browser default, and a cancellation cannot wait
   * for a fetch to land.
   */
  document.addEventListener('dragstart', (e) => e.preventDefault());

  /**
   * Take the "Save image as" entry off the icons. Worth being straight about the limit:
   * this only closes the obvious door. Anything the browser renders it has already
   * downloaded, so the files stay reachable from devtools or by typing the URL. Treat it
   * as tidying the interaction, not as protection.
   */
  document.addEventListener('contextmenu', (e) => {
    // Icons, dock items and any remaining <img>, which is the avatar. Deliberately not
    // the whole page: blocking right-click everywhere costs visitors reload and back for
    // no gain.
    if ((e.target as HTMLElement).closest('.icon, .dock__item, img')) e.preventDefault();
  });

  /**
   * Desktop icons open on double click, like a real desktop, and a single click only
   * selects. Everything else in the OS, menu items and the dock, stays single click.
   * Touch keeps single tap, because that is what a phone home screen does and a double
   * tap there is a zoom gesture.
   */
  const pointer = matchMedia('(hover: hover)').matches;

  document.addEventListener('dblclick', (e) => {
    const icon = (e.target as HTMLElement).closest<HTMLElement>('.icon[data-open]');
    if (icon?.dataset.open) openWindow(icon.dataset.open);
  });

  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const t = el.closest<HTMLElement>('[data-open],[data-close],.window');
    if (!t) {
      // clicked the desktop itself
      if (el.closest('#desktop') === el || el.id === 'desktop') {
        document.querySelectorAll('.window').forEach((w) => w.classList.remove('is-focused'));
        document.body.classList.remove('has-focus');
        selectIcon(null);
      }
      return;
    }
    if (t.dataset.open) {
      // detail 0 means the keyboard fired this, and Enter should open straight away
      const needsDoubleClick = pointer && t.classList.contains('icon') && (e as MouseEvent).detail !== 0;
      if (needsDoubleClick) { selectIcon(t); return; }
      openWindow(t.dataset.open);
    }
    else if (t.dataset.close) closeWindow(t.dataset.close);
    else if (t.classList.contains('window')) focusWindow(t);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Escape inside a field means "I am done with this field", not "throw this window
    // away". Without this, one key would bin a half-written message.
    // Optional call, because a keydown's target is not always an element: one dispatched
    // straight at the document has no closest() and would throw here.
    if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
    document.querySelector<HTMLElement>('.window.is-focused [data-close]')?.click();
  });
}

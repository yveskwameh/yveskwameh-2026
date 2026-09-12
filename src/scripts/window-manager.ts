/**
 * Open / close / minimise / zoom / focus.
 * [data-open=id] opens, [data-close=id] closes. Minimise and zoom are drawn on the window
 * but inactive, so there is nothing here for them.
 * One window is open at a time and a click anywhere outside it closes it, so the desktop
 * behaves like a modal overlay rather than like a real stacking window manager.
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

/**
 * Take the fragment off the address bar without reloading, scrolling or adding a Back
 * entry. `history.replaceState` with pathname + search is the documented way to do it;
 * `location.hash = ''` is a fragment navigation, so it leaves a bare `#` behind and
 * jumps the page to the top.
 *
 * Called whenever a window actually closes. The hash is how a case study is shared, so
 * while the Work window is open it is true, and the moment the window goes away it stops
 * being true: leaving it there meant a visitor could close Work, open the game, and
 * still be reloaded back into Work on a stale case study.
 *
 * Deliberately not in syncFocus, which would be the tidier place: openWindow calls
 * closeOthers BEFORE it marks the new window open, so a deep link would have its own
 * hash wiped a moment before scripts/work.ts got to read it.
 */
const unhash = () => {
  // pathname + search, spelled out. An empty string is tempting and the URL parser agrees
  // with it (new URL('', '/#x') is '/'), but replaceState does not: given an empty url
  // Chrome keeps the current one, fragment and all. Checked in the browser, not assumed.
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
};

export function openWindow(id: string) {
  // An id with no window behind it still launches its app, if the APPS map has one.
  // That is how a dock item can do something other than open a window.
  const win = q(id); if (!win) { launch(id); return; }
  closeOthers(win);     // one at a time: opening anything puts away whatever was already up
  win.classList.add('is-open');
  placeWindow(win);     // every open: centred across, --window-top below the menu bar
  focusWindow(win);
  launch(id);           // the app's own code, fetched the first time its window opens
}
/**
 * Put away every open window, sparing one. The desktop behaves like a modal overlay: one
 * window is open at a time, and a click that lands outside it dismisses it.
 */
function closeOthers(keep?: HTMLElement) {
  openWindows().forEach((w) => { if (w !== keep) { w.classList.remove('is-open', 'is-focused'); unhash(); } });
  syncFocus();
}
export function closeWindow(id: string) {
  const win = q(id); if (!win) return;
  win.classList.remove('is-open', 'is-focused');
  unhash();
  syncFocus();
}
export function focusWindow(win: HTMLElement) {
  // The open ones, not every window on the page: is-focused is only ever put on a window
  // that is open, and closing one takes both classes off together.
  openWindows().forEach((w) => w.classList.remove('is-focused'));
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
  // One lookup, held, rather than asking the document the same question twice.
  let on = document.querySelector('.window.is-focused');
  if (!on) {
    on = open.sort((a, b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0)).pop() || null;
    on?.classList.add('is-focused');
  }
  document.body.classList.toggle('has-focus', !!on);
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

  /**
   * Where the gesture STARTED, which is the half of the dismiss below that a click alone
   * cannot answer. Selecting a paragraph and releasing past the window edge, or dragging a
   * resize grip until the window hits its clamp and the pointer runs off it, both end in a
   * click the document sees outside the window. Neither should throw the window away.
   */
  let fromWindow = false;
  document.addEventListener('pointerdown', (e) => {
    fromWindow = !!(e.target as HTMLElement).closest?.('.window');
  }, true);

  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const t = el.closest<HTMLElement>('[data-open],[data-close],.window');
    // A single click on a desktop icon only selects it, and the dblclick above opens it.
    // detail 0 means the keyboard fired this, and Enter should open straight away.
    const select = pointer && !!t?.classList.contains('icon') && (e as MouseEvent).detail !== 0;
    const opens = select ? undefined : t?.dataset.open;

    /**
     * The dismiss. Anything outside the open window puts it away, which is what makes the
     * desktop read as a modal overlay and keeps the visitor to one window.
     *
     * Three exceptions. A control that is about to open something, because openWindow
     * swaps the two on its own and dismissing here first would flash the bare desktop
     * between them. The menu bar, which is system chrome rather than the desktop:
     * dragging the volume slider or picking a theme used to throw away whatever was open,
     * which also stopped the soundtrack that the slider was there to adjust. macOS does
     * not close a window when you use the menu bar either.
     *
     * And the unmute notice, for the same reason. It arrives unasked on top of whatever
     * somebody is reading, so answering it, either way, threw that window away: the X
     * dismissed the notice and the window under it, and Turn on did the same while
     * turning the sound on. A notification is chrome, not the desktop.
     */
    if (!fromWindow && !el.closest('.window, .menubar, .tray, .notice') && !opens) closeOthers();

    if (opens) openWindow(opens);
    else if (select) selectIcon(t);
    else if (t?.dataset.close) closeWindow(t.dataset.close);
    else if (t?.classList.contains('window')) focusWindow(t);
    else if (el.id === 'desktop') selectIcon(null);
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

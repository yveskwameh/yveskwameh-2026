/**
 * The app launcher.
 *
 * Every window's behaviour is its own file, fetched the first time that window opens and
 * never on page load. The window's HTML is already on the page (built at build time, per
 * rule 3), so nothing visible waits on this: the window opens instantly and its wiring
 * catches up a few milliseconds later.
 *
 * Why one file holds every dynamic import: Vite rewrites `import(x)` into a call to its
 * own preload helper and injects that helper, about 1.3KB of it, into whichever chunk
 * contains the import. One chunk pays it once. Scattering imports across several entry
 * chunks would pay it several times, which is the whole budget. So they all live here,
 * this file is only ever reached from the desktop chunk, and every app after the first
 * is close to free.
 *
 * It bends one convention worth naming: scripts stay one small file per behaviour, but
 * the component that needs a behaviour no longer imports it. This does, on the
 * component's behalf, when its window opens.
 *
 * Two phases on purpose. `warm` only downloads, and runs on hover, press or focus, so on
 * a mouse the file has usually landed before the second click of the double click that
 * opens the window. `launch` is what actually runs the module, and only openWindow calls
 * it. Keeping them apart is what stops hovering the Music icon from mounting the Spotify
 * iframe, which rule 2 forbids.
 */
type App = { init(): void };

/** Window id, exactly as [data-open] and [data-window] spell it, to the app inside it. */
const APPS: Record<string, () => Promise<App>> = {
  contact: () => import('./mail'),
  projects: () => import('./work'),
  music: () => import('./music'),
  game: () => import('./game'),
};

const mods = new Map<string, Promise<App>>();
const started = new Set<string>();

/** Download, but do not run. Safe to call on a hover. */
function warm(id: string) {
  const load = APPS[id];
  if (load && !mods.has(id)) mods.set(id, load());
  return mods.get(id);
}

/** Download if needed, then run it, once. */
export function launch(id: string) {
  if (started.has(id)) return;
  const p = warm(id);
  if (!p) return;
  started.add(id);
  // A failed fetch is forgotten rather than swallowed, so the next open tries again
  // instead of leaving a window that quietly does nothing forever.
  p.then((m) => m.init(), () => { started.delete(id); mods.delete(id); });
}

export function initWarm() {
  const on = (e: Event) => {
    const id = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-open]')?.dataset.open;
    if (id) warm(id);
  };
  // hover covers the mouse, press covers touch, focus covers the keyboard
  for (const t of ['pointerover', 'pointerdown', 'focusin']) {
    document.addEventListener(t, on, { passive: true });
  }

  /* Right-click menus, over an icon, the menu bar, or the bare desktop. Inside a window
     the browser's own menu is the more useful one and stays, because that is where text
     lives and copy and paste matter. The module is fetched on the first right click, so it
     costs nothing until then, and the default is cancelled here rather than in there
     because that cannot wait for a fetch. */
  addEventListener('contextmenu', (e) => {
    const el = e.target as HTMLElement;
    if (!el.closest?.('.icon, .menubar') && el.id !== 'desktop') return;
    e.preventDefault();
    import('./context').then((m) => m.open(e as MouseEvent));
  });

  /* Dragging is not an app either, and it is the largest thing that used to load on
     arrival. It comes down on the first sign of a pointer instead: a mouse has to travel
     to an icon or a title bar before it can drag one, which is far longer than the fetch
     takes, and on touch the first press does the same job. It binds per element, so it can
     only run once the desktop markup exists, which it always does by then.

     The two guards it used to carry, the ones that cancel native image dragging and the
     Save image as menu, now live in window-manager.ts: a cancelled default cannot wait. */
  const dragOnce = { once: true, passive: true } as const;
  const pullDrag = () => {
    import('./drag').then((m) => m.init('.icon, .window__titlebar'));
    import('./dock-drag').then((m) => m.init());
  };
  addEventListener('pointermove', pullDrag, dragOnce);
  addEventListener('pointerdown', pullDrag, dragOnce);

  /* Live cursors. On the same trigger, because someone with no pointer has no cursor to
     share and should never open the socket at all. */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', () => { import('./presence').then((m) => m.init()); },
      { once: true, passive: true });
  }

  /* The dock magnifier is not an app, it belongs to the desktop, so it loads on the first
     sign of a mouse rather than on a window opening. It does nothing on touch or under
     reduced motion, so on those it is never fetched at all. */
  if (matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    addEventListener('pointermove', () => { import('./dock').then((m) => m.init()); },
      { once: true, passive: true });
  }
}

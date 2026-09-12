/**
 * The Images icon in the dock is a stack, the way Downloads is on macOS, and the nine
 * prints live in it.
 *
 * They start stowed. Click the icon and they fly out, one after another, from the icon
 * to their places in the pile. Drag a print onto the icon and it flies back in and is
 * gone from the desk. Click the icon when every print is out and they all go back in.
 * The count on the icon says how many are inside.
 *
 * The flight is a CSS transition on transform. A stowed print sits at its own place on the
 * desk but translated to the icon and scaled to nothing, so removing the class is the
 * flight out and adding it is the flight in. The vector to the icon is measured here and
 * written as two custom properties, because the icon is wherever the dock happens to be.
 *
 * Fetched the first time the icon is clicked, through the APPS map in lazy.ts: openWindow
 * finds no window called images and launches this instead. init runs once, does the first
 * toggle itself, and wires the icon for every click after that. Never on page load.
 */
const STAGGER = 45;
const FLIGHT = 560;

export function init() {
  const layer = document.querySelector<HTMLElement>('.prints');
  const icon = document.querySelector<HTMLElement>('[data-open="images"]');
  if (!layer || !icon) return;
  const count = icon.parentElement?.querySelector<HTMLElement>('.dock__count');
  const prints = () => [...layer.querySelectorAll<HTMLElement>('.print')];
  const stowed = () => prints().filter((p) => p.classList.contains('is-stowed'));

  /** The vector from a print's centre to the icon's centre, written onto the print. */
  const aim = (p: HTMLElement) => {
    const a = p.getBoundingClientRect(), b = icon.getBoundingClientRect();
    p.style.setProperty('--sx', `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
    p.style.setProperty('--sy', `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
  };
  const tally = () => {
    const n = stowed().length;
    if (count) { count.textContent = String(n); count.hidden = n === 0; }
    layer.classList.toggle('is-empty', n === prints().length);
  };

  const flyOut = () => {
    stowed().forEach((p, i) => {
      // Back to its place in the pile before it takes off, in case it was dropped
      // somewhere else on the desk before it was put away.
      p.style.left = ''; p.style.top = '';
      aim(p);
      p.style.transitionDelay = `${i * STAGGER}ms`;
      // The vector has to be laid out before the class comes off, or there is no flight.
      p.getBoundingClientRect();
      p.classList.remove('is-stowed');
    });
    tally();
  };
  const stow = (list: HTMLElement[]) => {
    list.forEach((p, i) => {
      aim(p);
      p.style.transitionDelay = `${i * STAGGER}ms`;
      p.classList.add('is-stowed');
    });
    tally();
  };

  // Click: everything out if anything is in, otherwise everything in.
  //
  // Guarded two ways, because a double click on this icon is the most natural thing on
  // a desktop where every other icon opens on one, and two toggles in a row is out and
  // straight back in, which to the eye is nothing happening. The second click of a
  // double click arrives with detail 2 and is ignored, and so is any click that lands
  // while the last flight is still in the air.
  let last = 0;
  const toggle = (e?: MouseEvent) => {
    if (e && e.detail > 1) return;
    const now = performance.now();
    if (now - last < FLIGHT + STAGGER * 8) return;
    last = now;
    const s = stowed(); if (s.length) flyOut(); else stow(prints());
  };
  icon.addEventListener('click', toggle);
  toggle();

  // A print let go over the icon goes in. drag.ts says where it was let go.
  const overIcon = (x: number, y: number) =>
    document.elementsFromPoint(x, y).some((el) => el === icon || icon.contains(el));
  layer.addEventListener('print-drop', (e) => {
    const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
    const p = e.target as HTMLElement;
    icon.classList.remove('is-target');
    if (overIcon(x, y)) {
      stow([p]);
      // Its place on the desk comes back once it is out of sight, so the next flight
      // out starts from the icon and lands in the pile, not wherever it was dropped.
      setTimeout(() => { p.style.left = ''; p.style.top = ''; }, FLIGHT);
    }
  });
  // The icon says it will take the print while one is held over it.
  layer.addEventListener('pointermove', (e) => {
    if (!e.buttons || !(e.target as HTMLElement).closest('.print.is-dragging')) return;
    icon.classList.toggle('is-target', overIcon(e.clientX, e.clientY));
  });
}

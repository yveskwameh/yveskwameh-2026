/**
 * The desktop right-click menus.
 *
 * Two of them, both real HTML in Desktop.astro so their wording is not charged against the
 * JS budget: one for a desktop icon, one for the bare desktop. This positions whichever
 * fits what was clicked, then handles the items that need code. The items that only open a
 * window or run a menu-bar action carry data-open and data-action, so the listeners that
 * already exist pick those up and there is nothing here for them.
 *
 * Fetched on the first right click and never before. See scripts/lazy.ts.
 */
import { openWindow } from './window-manager';
import { restoreNames } from './actions';

const $ = (id: string) => document.getElementById(id);

let wired = false;
let shown: HTMLElement | null = null;
let target: HTMLElement | null = null;   // the icon the menu was opened on

function hide() {
  if (shown) shown.hidden = true;
  shown = null;
  target = null;
}

/**
 * Renamed icons, in sessionStorage rather than localStorage.
 *
 * A rename was never able to reach the deployed site or another visitor: there is no
 * server and no database, and web storage is per-browser. But localStorage kept the name
 * on that machine forever, which is more permanence than renaming an icon on someone
 * else's desktop deserves. sessionStorage lasts for the tab and goes when it closes, so a
 * reload keeps it and coming back tomorrow does not.
 */
function saved(): Record<string, string> {
  try { return JSON.parse(sessionStorage.names || '{}'); } catch { return {}; }
}

function store(names: Record<string, string>) {
  sessionStorage.names = JSON.stringify(names);
}

/**
 * Rename. The field is a floating input rather than making the label editable in place,
 * because the label lives inside a <button>: a contenteditable there fights the button's
 * own keyboard behaviour, where space and enter mean "activate me" rather than "type".
 * Sitting the input above it side-steps that completely.
 */
function rename(icon: HTMLElement) {
  const label = icon.querySelector<HTMLElement>('.icon__label');
  if (!label) return;
  const box = label.getBoundingClientRect();
  const input = document.createElement('input');
  input.className = 'icon-rename';
  input.value = label.textContent || '';
  input.style.cssText =
    `left:${box.left - 6}px; top:${box.top - 2}px; width:${Math.max(box.width + 12, 76)}px`;
  document.body.appendChild(input);
  input.focus();
  input.select();

  let done = false;
  const finish = (keep: boolean) => {
    if (done) return;                 // blur fires again when we remove the input
    done = true;
    const name = input.value.trim();
    input.remove();
    if (!keep || !name) return;
    label.textContent = name;
    const names = saved();
    // Back to the shipped name means there is nothing to remember any more.
    if (name === icon.dataset.label) delete names[icon.dataset.iconId!];
    else names[icon.dataset.iconId!] = name;
    store(names);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    else if (e.key === 'Escape') finish(false);
    e.stopPropagation();              // Escape here must not also close a window
  });
  input.addEventListener('blur', () => finish(true));
}

/** Put an icon back to the name it shipped with. */
function reset(icon: HTMLElement) {
  const label = icon.querySelector<HTMLElement>('.icon__label');
  if (label) label.textContent = icon.dataset.label || '';
  const names = saved();
  delete names[icon.dataset.iconId!];
  store(names);
}

/**
 * Clean Up Desktop: every icon goes back to where it started, which each one carries in
 * data-home-x / data-home-y, and back to the name it shipped with if the visitor renamed
 * it. Icons are animated back rather than snapped, and the transition is added only for
 * the trip so dragging stays instant.
 *
 * Here rather than in actions.ts, where it used to live, because the name reset is the
 * same `reset` the context menu uses and it writes the same store the rename writes. This
 * file is lazy and actions.ts is not, so the move also took the whole function off the
 * on-load budget. lazy.ts owns the import, as it owns every other one.
 */
export function tidyDesktop() {
  const icons = document.querySelectorAll<HTMLElement>('.icon');
  icons.forEach((icon) => {
    const { homeX, homeY } = icon.dataset;
    icon.classList.add('is-tidying');
    icon.classList.remove('is-selected');
    icon.style.left = `${homeX}px`;
    icon.style.top = `${homeY}px`;
    reset(icon);
  });
  setTimeout(() => icons.forEach((i) => i.classList.remove('is-tidying')), 400);
}

/**
 * Refresh, in the sense Windows means it on the desktop: redraw what is there, do not
 * reload the page. Selection clears, any renamed labels are re-read, and the icons blink
 * so it is visible that something happened.
 */
function refresh() {
  const desk = $('desktop');
  if (!desk) return;
  document.querySelectorAll('.icon.is-selected').forEach((i) => i.classList.remove('is-selected'));
  desk.classList.add('is-refreshing');
  setTimeout(() => {
    restoreNames();
    desk.classList.remove('is-refreshing');
  }, 180);
}

function wire() {
  wired = true;

  document.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest?.<HTMLElement>('[data-ctx]');
    const icon = target;
    // Anything clicked closes the menu, including an item on it.
    if (!(e.target as HTMLElement).closest?.('.ctx')) return hide();
    hide();
    if (!item) return;
    switch (item.dataset.ctx) {
      case 'open': if (icon?.dataset.open) openWindow(icon.dataset.open); break;
      case 'rename': if (icon) rename(icon); break;
      case 'reset': if (icon) reset(icon); break;
      case 'refresh': refresh(); break;
    }
  });

  // Anything that moves the menu out from under the pointer should dismiss it.
  document.addEventListener('pointerdown', (e) => {
    if (!(e.target as HTMLElement).closest?.('.ctx')) hide();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());
  addEventListener('resize', hide, { passive: true });
}

export function open(e: MouseEvent) {
  if (!wired) wire();
  hide();

  const el = e.target as HTMLElement;
  const icon = el.closest?.<HTMLElement>('.icon') || null;
  /* Most specific first. The menu bar is checked before the icon because the bar carries
     an avatar image and the icon test would never match it anyway, but the order is what
     makes adding a fourth menu obvious later. */
  const menu = $(el.closest?.('.menubar') ? 'ctx-menubar' : icon ? 'ctx-icon' : 'ctx-desktop');
  if (!menu) return;

  target = icon;
  menu.hidden = false;

  /* Placed after it is shown, because a hidden element measures zero and the menu would
     then hang off the bottom right of the screen instead of flipping back onto it. */
  const box = menu.getBoundingClientRect();
  const x = Math.min(e.clientX, innerWidth - box.width - 8);
  const y = Math.min(e.clientY, innerHeight - box.height - 8);
  menu.style.left = `${Math.max(8, x)}px`;
  menu.style.top = `${Math.max(8, y)}px`;
  shown = menu;
}

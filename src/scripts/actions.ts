import { lock } from './lock';

/**
 * Menu bar actions, the [data-action] buttons in the View menu.
 */

/**
 * Clean Up Desktop: send every icon back to the position it started at, which each one
 * carries in data-home-x / data-home-y. Icons are animated back rather than snapped, and
 * the transition is added only for the trip so dragging stays instant.
 */
export function tidyDesktop() {
  const icons = document.querySelectorAll<HTMLElement>('.icon');
  icons.forEach((icon) => {
    const { homeX, homeY } = icon.dataset;
    icon.classList.add('is-tidying');
    icon.classList.remove('is-selected');
    icon.style.left = `${homeX}px`;
    icon.style.top = `${homeY}px`;
  });
  setTimeout(() => icons.forEach((i) => i.classList.remove('is-tidying')), 400);
}

/**
 * Put back any desktop icon the visitor renamed, within this tab session.
 *
 * Eager, and it has to be: a rename has to survive a reload, and the module that does the
 * renaming is only fetched on a right click, which may never come. This is the whole cost
 * of the feature on page load.
 *
 * sessionStorage, matching scripts/context.ts, so nothing a visitor types here outlasts
 * their visit.
 */
export function restoreNames() {
  let names: Record<string, string>;
  try { names = JSON.parse(sessionStorage.names || '{}'); } catch { return; }
  for (const el of document.querySelectorAll<HTMLElement>('.icon')) {
    const name = names[el.dataset.iconId!];
    const label = el.querySelector('.icon__label');
    if (name && label) label.textContent = name;
  }
}

export function initActions() {
  restoreNames();
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    switch (btn?.dataset.action) {
      case 'tidy': tidyDesktop(); break;
      case 'lock': lock(); break;
      // 'theme' is still a stub. The palette is an open decision in docs/BRIEF.md, so
      // there is nothing to switch between yet.
    }
  });
}

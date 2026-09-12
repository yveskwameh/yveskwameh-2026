import { lock } from './lock';
import { tidy } from './lazy';

/**
 * Menu bar actions, the [data-action] buttons in the View menu.
 *
 * Clean Up Desktop used to live here and moved to scripts/context.ts, which is lazy, when
 * it grew a second job (putting renamed icons back to their names) and the on-load budget
 * had 34 bytes left. Nobody can clean up a desktop before they have moved a pointer, and
 * the context module is a few hundred bytes fetched on the first right click or the first
 * clean up, whichever comes first. lazy.ts owns the import, as it owns every other one.
 */

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
      case 'tidy': tidy(); break;
      case 'lock': lock(); break;
      // Not a fourth surface. The swatches live in Control Center, so this opens that.
      case 'theme': (document.getElementById('cc') as HTMLDetailsElement).open = true; break;
    }
  });
}

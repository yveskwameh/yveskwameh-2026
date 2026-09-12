/**
 * The Work window.
 *
 * Switching between case studies is CSS, not script: every radio is joined to its row and
 * its pane by a generated `:has()` rule. See ProjectsApp.astro. That means the window
 * works before this file lands, and keeps working if it never does.
 *
 * So this only adds the two things CSS cannot do on its own:
 *
 * 1. The deep link. Arriving at /#work-<id> opens on that case study, and picking one puts
 *    it in the address bar so it can be shared or reloaded.
 * 2. Closing the phone menu. The menu opens from a checkbox and a label, which needs no
 *    script, but nothing in CSS can uncheck a box because someone picked something else.
 *    Without this the menu would stay open over the case study it just opened.
 *
 * Fetched the first time the Work window opens. See scripts/lazy.ts. Nothing here is
 * charged against the on-load budget.
 */
export function init() {
  const box = document.querySelector<HTMLElement>('.settings');
  if (!box) return;

  const want = location.hash.slice(1).replace(/^work-/, '');
  // A loop rather than an attribute selector, so a slug with an awkward character in it
  // cannot break the query.
  if (want) {
    for (const r of box.querySelectorAll<HTMLInputElement>('input[name=work]')) {
      if (r.value === want) r.checked = true;
    }
  }

  /**
   * On a phone the rows live in a closed menu, so their icons are in a display: none
   * subtree and a lazy image there does not start downloading until it is shown. That put
   * a pop-in on the first tap. Asking for them now, when the window has just opened, is
   * early enough to be invisible and late enough to still obey the rule: the page load
   * itself fetches none of this, because this file only runs once someone opens Work.
   */
  for (const img of box.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) img.loading = 'eager';

  const open = document.getElementById('work-open') as HTMLInputElement | null;
  const shut = () => { if (open) open.checked = false; };

  box.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (r.name !== 'work') return;
    history.replaceState(null, '', `#work-${r.value}`);
    shut();               // picking one is the end of picking
  });

  // A press anywhere in the window that is not the picker puts the menu away, which is
  // what a menu is expected to do. Capture, so it still counts when the press lands on
  // something that stops the event on its way up.
  box.addEventListener('pointerdown', (e) => {
    if (open?.checked && !(e.target as HTMLElement).closest?.('.settings__picker')) shut();
  }, true);

  /**
   * Escape closes the menu, and only the menu.
   *
   * Capture on the document, because window-manager.ts listens for Escape too and would
   * otherwise throw the whole window away while a menu was open. A capture listener on
   * the document runs before the event has reached anything, so stopping it here means
   * the first Escape closes the menu and a second one closes the window. That ordering is
   * the point; without it the two features fight over one key.
   */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open?.checked) return;
    shut();
    e.stopPropagation();
  }, true);
}

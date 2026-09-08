/**
 * The Work window.
 *
 * Switching between case studies is CSS, not script: every row is a radio and every pane
 * is the element right after that radio's label, so `:checked + label + pane` picks
 * exactly one. See ProjectsApp.astro. That means the window works before this file lands,
 * and keeps working if it never does.
 *
 * So all this adds is the deep link, which is the one thing CSS cannot do: arriving at
 * /#work-<id> opens on that case study, and picking one puts it in the address bar so it
 * can be shared or reloaded.
 *
 * Fetched the first time the Work window opens. See scripts/lazy.ts.
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

  box.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (r.name === 'work') history.replaceState(null, '', `#work-${r.value}`);
  });
}

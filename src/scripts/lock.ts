/**
 * Lock screen: live clock, an unlock button, and re-lockable from the menu bar.
 * Shown once per session, so a reload mid-visit does not lock you out again.
 *
 * The button used to run away from the cursor and could not be clicked at all until you
 * worked out how to trap it. It was removed on Yves's call after a first time visitor
 * said he would have left rather than keep chasing it. A gate that makes people prove
 * something before they can see the work costs more visitors than the joke was worth, and
 * every visitor it annoys is one who never reaches the case studies. The button is now an
 * ordinary button: click it, tap it, or press Enter or Space.
 */
/** document.getElementById is 24 characters that minifiers cannot shorten, and it appears
 *  several times in this file. Aliasing it is the cheapest real saving here. */
const $ = (id: string) => document.getElementById(id);
const set = (id: string, v: string) => {
  const el = $(id);
  if (el) el.textContent = v;
};

/** Ask for a sound. Whether anything is listening is scripts/sfx.ts's problem, not ours,
 *  which is what keeps the player out of this file and off the page load. */
const sfx = (name: string) => document.dispatchEvent(new CustomEvent('sfx', { detail: name }));

function tick() {
  const now = new Date();
  set('lock-time', now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  set('lock-date', now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
}

export function unlock() {
  const el = $('lock');
  if (!el || el.classList.contains('is-open')) return;
  el.classList.add('is-open');
  sessionStorage.u = '1';
  sfx('unlock');
}

export function lock() {
  const el = $('lock');
  if (!el) return;
  tick();
  el.classList.remove('is-open');
  delete sessionStorage.u;
}

export function initLock() {
  const el = $('lock');
  if (!el) return;

  tick();
  setInterval(tick, 30_000);   // often enough for HH:MM

  if (sessionStorage.u) el.classList.add('is-open');

  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-unlock]')) unlock();
  });
  // The keyboard way in. Still here after the chase was removed, because a lock screen
  // that only answers to a pointer is one a keyboard visitor cannot get past at all.
  document.addEventListener('keydown', (e) => {
    if ($('lock-gate') || el.classList.contains('is-open')) return;
    if (e.key === 'Enter' || e.key === ' ') unlock();
  });
}

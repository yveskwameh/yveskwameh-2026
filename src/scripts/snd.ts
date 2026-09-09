/**
 * Who owns the sound setting.
 *
 * One flag, `localStorage.snd`, written in exactly one place. Two things set it: the gate
 * on a first visit, and the speaker in the menu bar at any time after. Everything that
 * cares listens for the `snd` event rather than reading the flag, so there is one source
 * of truth and no polling.
 *
 * This runs on page load, so it is deliberately small. The player itself is lazy and
 * arrives only once the answer is yes: see the hook in lazy.ts.
 *
 * The gate lived in lock.ts before. It moved here because the menu bar toggle needs the
 * same setter, and two places writing the same key is how they drift.
 */
const $ = (id: string) => document.getElementById(id);

let btn: HTMLElement | null = null;

/** The one writer. Stores the answer, updates the speaker, tells everyone. */
function set(on: boolean) {
  localStorage.snd = on ? 'on' : 'off';
  paint(on);
  document.dispatchEvent(new CustomEvent('snd', { detail: on }));
}

/* aria-pressed carries the state and the label names the control, so a screen reader says
   "Sound, toggle button, pressed" rather than reading out an icon. The title is what a
   mouse sees, and it says what is true now, not what clicking would do. */
function paint(on: boolean) {
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(on));
  btn.title = on ? 'Sound on' : 'Sound off';
}

export function initSound() {
  btn = $('snd');
  paint(localStorage.snd === 'on');
  btn?.addEventListener('click', () => set(localStorage.snd !== 'on'));

  const g = $('lock-gate');
  if (!g) return;
  // Asked once. A stored answer means the gate has done its job and can go.
  if (localStorage.snd) return g.remove();

  g.hidden = false;
  g.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-snd]');
    if (!b) return;
    set(b.dataset.snd === 'on');
    g.remove();
  });
}

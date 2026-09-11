/**
 * Who owns the sound setting.
 *
 * One flag, `localStorage.snd`, written in exactly one place. Two things set it: the gate
 * on a first visit, and the volume slider in the speaker panel, which calls `set` here
 * rather than writing the key itself. Everything that cares listens for the `snd` event
 * rather than reading the flag, so there is one source of truth and no polling.
 *
 * The level lives beside it in `localStorage.vol` and is owned by scripts/panel.ts, which
 * is lazy. The two cannot drift, because zero on the slider is the mute switch: panel.ts
 * calls `set(false)` on the way down through zero and `set(true)` on the way back up. That
 * is also why the speaker no longer toggles anything on click. It opens the panel now.
 *
 * This runs on page load, so it is deliberately small. The player itself is lazy and
 * arrives only once the answer is yes: see the hook in lazy.ts.
 */
const $ = (id: string) => document.getElementById(id);

let btn: HTMLElement | null = null;

/** The one writer. Stores the answer, updates the speaker, tells everyone. */
export function set(on: boolean) {
  localStorage.snd = on ? 'on' : 'off';
  paint(on);
  document.dispatchEvent(new CustomEvent('snd', { detail: on }));
}

/* aria-pressed carries the state and the label names the control, so a screen reader says
   "Sound, toggle button, pressed" rather than reading out an icon. The body flag is what
   the volume glyphs inside both panels read, so every speaker on the page agrees without
   any of them being found by id. The title attribute that used to live here is gone: the
   speaker opens a panel now, and a tooltip over a panel is noise. */
function paint(on: boolean) {
  document.body.classList.toggle('snd-on', on);
  btn?.setAttribute('aria-pressed', String(on));
}

export function initSound() {
  btn = $('snd');
  paint(localStorage.snd === 'on');

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

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

/** The one writer. Stores the answer, updates every speaker, tells everyone. */
export function set(on: boolean) {
  localStorage.snd = on ? 'on' : 'off';
  paint(on);
  document.dispatchEvent(new CustomEvent('snd', { detail: on }));
}

/* One flag on <body>, and every speaker glyph on the page reads it: the one in the menu
   bar and the two inside the panels. None of them has to be found by id, and none can
   disagree with another.

   aria-pressed used to live on the menu bar speaker and is gone. That element is a
   <summary> now, which is a disclosure: its state is aria-expanded and the browser
   already manages it. aria-pressed there was describing a toggle button that no longer
   exists. The title attribute went the same way, because the speaker opens a panel and a
   tooltip over a panel is noise. */
function paint(on: boolean) {
  document.body.classList.toggle('snd-on', on);
}

export function initSound() {
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

/**
 * The menu bar's two panels, and the window soundtracks that hang off them.
 *
 * Lazy. Fetched on the first sign of a pointer, alongside dragging, which is far earlier
 * than anyone can travel to the menu bar and long before a window can be opened, so none
 * of this counts against the on-load budget.
 *
 * Four jobs, one file, because they are one feature: a volume level, a theme, the Control
 * Center clock, and the two tracks. They share a single state object and one paint, which
 * is what stops the two sliders and the two now-playing rows from ever disagreeing.
 *
 * What is deliberately NOT here: deciding where the speaker panel is. That is CSS in
 * MenuBar.astro. This file only sets `body.is-playing`, and the stylesheet works out that
 * a playing track means the panel is the resting state of the corner, that an open menu
 * takes the corner, and that closing that menu hands it back.
 */
import { set as setSound } from './snd';
import { initBattery } from './battery';

type El = HTMLElement;
const q = <T extends Element>(s: string) => document.querySelectorAll<T>(s);
const $ = (id: string) => document.getElementById(id);

/** Every audio element the menu bar shipped, keyed by the window that starts it. */
const byWindow = new Map<string, HTMLAudioElement>();
/** The track currently owning the panel, or null. */
let current: HTMLAudioElement | null = null;
/** 0 to 100. Zero is the mute switch, so this is the only sound state there is. */
let vol = 60;

const stored = () => {
  const n = Number(localStorage.vol);
  // A first visit has no level. Which one it gets depends on the answer at the gate:
  // someone who chose to enter with sound expects to hear something.
  if (Number.isFinite(n) && localStorage.vol !== undefined && localStorage.vol !== '') {
    return Math.min(100, Math.max(0, Math.round(n)));
  }
  return localStorage.snd === 'on' ? 60 : 0;
};

function paint() {
  const playing = !!current && !current.paused;

  for (const r of q<HTMLInputElement>('.vol__range')) {
    r.value = String(vol);
    // No cross-browser pseudo-element paints the filled half of a range, so the track is
    // a gradient and this is where it stops.
    r.style.setProperty('--fill', vol + '%');
  }
  for (const n of q<El>('.vol__pct')) n.textContent = String(vol);

  const title = current ? current.dataset.title! : 'Nothing playing';
  const why = current ? `Because ${current.dataset.label} is open` : 'Open Work or Feedback';
  for (const n of q<El>('.np__title')) n.textContent = title;
  for (const n of q<El>('.np__why')) n.textContent = why;

  for (const b of q<HTMLButtonElement>('.np__toggle')) {
    b.disabled = !current;
    b.setAttribute('aria-pressed', String(playing));
    b.setAttribute('aria-label', playing ? `Pause ${title}` : `Play ${title}`);
  }

  // The class the stylesheet reads to keep the panel up while something is playing.
  document.body.classList.toggle('is-playing', playing);
}

/**
 * Push the level at everything that makes noise, and keep the on/off flag honest.
 *
 * snd.ts owns the flag and this is the only other thing that moves it, which is why the
 * two can never drift: there is one slider, and crossing zero is what flips the switch.
 */
function applyVolume(fromUser: boolean) {
  localStorage.vol = String(vol);
  for (const a of byWindow.values()) a.volume = vol / 100;
  // The click sounds live in sfx.ts, which is a different lazy chunk. An event rather than
  // an import, so neither file has to know the other exists.
  document.dispatchEvent(new CustomEvent('vol', { detail: vol / 100 }));

  if (fromUser) {
    const on = vol > 0;
    if ((localStorage.snd === 'on') !== on) setSound(on);
    if (!on) stop();
    else if (current && current.paused) start(current);
  }
  paint();
}

function start(a: HTMLAudioElement) {
  current = a;
  for (const o of byWindow.values()) if (o !== a) { o.pause(); o.currentTime = 0; }
  if (localStorage.snd !== 'on' || vol === 0) return paint();
  // A rejected play must not leave the panel claiming it is playing, so state is re-read
  // either way. Autoplay policy should never reject here, because reaching this needs a
  // click on the lock screen and another on a window, but a missing codec still can.
  a.play().then(paint, paint);
  paint();
}

function stop() {
  for (const a of byWindow.values()) a.pause();
  paint();
}

/** Which window is open right now, if any. One at a time, per the window manager. */
const openId = () =>
  (document.querySelector('.window.is-open') as El | null)?.dataset.window ?? null;

function syncToWindows() {
  const id = openId();
  const next = id ? byWindow.get(id) ?? null : null;
  if (next === current) return;
  if (!next) { stop(); current = null; return paint(); }
  start(next);
}

export function init() {
  // Title and window label ride on the element, written by the menu bar from
  // src/data/tracks.ts, so the panel's copy has exactly one source.
  for (const a of q<HTMLAudioElement>('audio[data-for]')) byWindow.set(a.dataset.for!, a);

  // Moved off the load path: the meter is drawn full until this says otherwise, and
  // nobody checks their battery in the first second of a page.
  initBattery();

  vol = stored();
  applyVolume(false);

  /* The soundtrack follows whatever window is open. A MutationObserver rather than a hook
     in window-manager.ts, because every route out of a window has to count: the close
     light, Escape, a click on the desktop, and opening a second window. All four end in
     the same class change, and none of them would have fired a custom event. */
  const desk = $('desktop');
  if (desk) {
    new MutationObserver(syncToWindows)
      .observe(desk, { subtree: true, attributes: true, attributeFilter: ['class'] });
    syncToWindows();
  }

  /* Volume. Delegated, so both sliders and any future one are covered by one listener. */
  document.addEventListener('input', (e) => {
    const r = (e.target as El).closest<HTMLInputElement>('.vol__range');
    if (!r) return;
    vol = Number(r.value);
    applyVolume(true);
  });

  /* Pause. Also delegated, for the same reason: the button exists twice. */
  document.addEventListener('click', (e) => {
    const b = (e.target as El).closest<HTMLButtonElement>('.np__toggle');
    if (!b || b.disabled || !current) return;
    if (current.paused) {
      // Pressing play on a muted desktop has to mean "and turn the sound on", or the
      // button would look broken.
      if (vol === 0) { vol = 60; applyVolume(true); return; }
      if (localStorage.snd !== 'on') setSound(true);
      start(current);
    } else {
      current.pause();
      paint();
    }
  });

  /* "Turn on" in the unmute notice. It sets a level rather than flipping a switch,
     because a level is the only sound state there is. */
  document.addEventListener('click', (e) => {
    const b = (e.target as El).closest<El>('[data-vol]');
    if (!b) return;
    vol = Number(b.dataset.vol);
    applyVolume(true);
    // Wave the notice away too. Reaching for the button is already an answer.
    const x = $('notice-x') as HTMLInputElement | null;
    if (x) x.checked = true;
  });

  /* The gate on the lock screen writes the flag directly, so this is how the panel hears
     about it. Also covers a second tab changing its mind. */
  document.addEventListener('snd', () => {
    if (localStorage.snd === 'on' && vol === 0) { vol = 60; applyVolume(false); }
    if (localStorage.snd === 'on') syncToWindows(); else stop();
  });

  /* Control Center's clock is written when it opens rather than ticked. A panel nobody is
     looking at does not need a timer, and it can never be stale when it is on screen. */
  const cc = $('cc') as HTMLDetailsElement | null;
  const stamp = () => {
    const d = new Date();
    const t = $('cc-time'); const s = $('cc-date');
    if (t) t.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (s) s.textContent = d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  };
  cc?.addEventListener('toggle', () => cc.open && stamp());
  stamp();

  /* Theme. The attribute on <html> is the whole mechanism; tokens.css does the rest. The
     inline script in Base.astro has already applied the stored one before first paint, so
     all this does is keep the radios in step and write the answer down. */
  const saved = document.documentElement.dataset.theme || 'day';
  const radio = $(`th-${saved}`) as HTMLInputElement | null;
  if (radio) radio.checked = true;
  for (const r of q<HTMLInputElement>('.sw__radio')) {
    r.addEventListener('change', () => {
      // Day is the default and carries no attribute, so the cleanest state is no state.
      if (r.value === 'day') delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = r.value;
      localStorage.theme = r.value;
    });
  }
}

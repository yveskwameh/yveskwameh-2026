/**
 * Lock screen: live clock, a runaway unlock button, and re-lockable from the menu bar.
 * Shown once per session, so a reload mid-visit does not lock you out again.
 */
/** document.getElementById is 24 characters that minifiers cannot shorten, and it appears
 *  eight times in this file. Aliasing it is the cheapest real saving here. */
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
  reset();               // a re-lock is a fresh round, not a finished one
  el.classList.remove('is-open');
  delete sessionStorage.u;
}

export function initLock() {
  const el = $('lock');
  if (!el) return;

  tick();
  setInterval(tick, 30_000);   // often enough for HH:MM

  if (sessionStorage.u) el.classList.add('is-open');

  // The button is taken out of hit testing by CSS while the game is on, so reaching this
  // at all means it has been won. See the pointer-events note in LockScreen.astro.
  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-unlock]')) unlock();
  });
  // Always available, and the way past for anyone who does not want to play
  document.addEventListener('keydown', (e) => {
    if ($('lock-gate') || el.classList.contains('is-open')) return;
    if (e.key === 'Enter' || e.key === ' ') unlock();
  });

  initRunaway(el);
}

/* ------------------------------------------------------------------ *
 * The runaway unlock button.
 *
 * It never tires. Chasing it around open space forever achieves nothing, which is the
 * point: the round ends because you were clever, not because you were persistent. Two
 * ways to finish it, and both are things you have to work out:
 *   corner   drive it somewhere it is blocked on BOTH axes and it has nowhere left to go
 *   home     after a while the avatar starts pulsing; push the button onto it
 *
 * The push always clears the panic radius, so it never buzzes under the cursor. That is
 * the only reason the radius used to shrink, and with a fixed push it can be fixed too.
 * ------------------------------------------------------------------ */
const R = 140;      // panic radius: it bolts when you are near, not only when you are on it
const PUSH = 190;   // always further than R, so one dodge always breaks contact
const ARM = 8;      // dodges before the clue shows up, so it rewards effort not luck

/** All copy is read off the button's data attributes. See the note in LockScreen.astro:
 *  L = [intro, clue, wonHome, wonCorner, gotIt, opening, touch] */
let L: string[] = [], TAUNTS: string[] = [], CORNERED: string[] = [];

let cta: HTMLElement | null = null;
let face: HTMLElement | null = null;
let ox = 0, oy = 0;
let bx = 0, by = 0, bw = 0, bh = 0;   // untransformed layout box, measured once
let last = 0, began = 0, said = '', n = 0;
let won = false, armed = false, shouted = false, pins = 0;
let mq: MediaQueryList;

const say = (t: string) => cta && (cta.dataset.say = said = t);
const win = (line: string) => {
  won = true;
  cta!.classList.add('is-caught');
  say(line);
  set('lock-label', L[4]);
  sfx('stuck');       // it gives up. Deliberately not the same blip as a dodge.
};

/** Back to a full round. Called on every re-lock. */
function reset() {
  ox = 0; oy = 0; bw = 0; said = ''; began = 0; last = 0; n = 0;
  won = false; armed = false; shouted = false; pins = 0;
  face?.classList.remove('is-target');
  $('lock-shout')?.classList.remove('is-on');
  if (!cta) return;
  cta.classList.remove('is-caught');   // before clearing transform, so it cannot re-fire
  cta.style.transform = '';
  delete cta.dataset.say;
  set('lock-label', L[5]);
}

/** One dodge. Shared by the pointer and by the click guard. */
function flee(px: number, py: number, ts: number, forced = false) {
  if (!cta || won || !mq.matches) return;
  if (!forced && ts - last < 40) return;   // a lunge cannot slip between two samples

  /**
   * Measured once, lazily, never again. Reading the rect every move returns the
   * mid-slide position, so the reconstructed origin drifts on every dodge that lands
   * during a transition. Lazy also means the entrance animation has settled first.
   */
  if (!bw) {
    const r = cta.getBoundingClientRect();
    bx = r.left - ox; by = r.top - oy; bw = r.width; bh = r.height;
  }

  const dx = bx + bw / 2 + ox - px;
  const dy = by + bh / 2 + oy - py;
  const d = Math.hypot(dx, dy) || 1;
  if (!forced && d > R) return;
  last = ts;
  n++;

  const p = PUSH * (0.85 + Math.random() * 0.3);
  // 78px at the top rather than 24 reserves room for the speech bubble above it
  const x0 = 24 - bx, x1 = innerWidth - 24 - bw - bx;
  const y0 = 78 - by, y1 = innerHeight - 24 - bh - by;
  const nx = ox + (dx / d) * p, ny = oy + (dy / d) * p;
  const pinned = (nx < x0 || nx > x1) && (ny < y0 || ny > y1);   // blocked both ways
  ox = nx < x0 ? x0 : nx > x1 ? x1 : nx;
  oy = ny < y0 ? y0 : ny > y1 ? y1 : ny;
  cta.style.transform = `translate(${ox}px,${oy}px)`;
  sfx('flee');        // one blip per dodge. The 40ms guard above already rate limits it.

  if (!began) { began = ts; say(L[0]); return; }

  // The clue. Reverse psychology, so it reads as a joke and still names the target,
  // the goal and the verb in one line. Yves saw the pulse and could not tell it meant
  // anything, which is what this fixes.
  if (n >= ARM && !armed) {
    armed = true;
    face?.classList.add('is-target');
    say(L[1]);
    return;
  }

  if (armed) {
    const a = face?.getBoundingClientRect();
    const l = bx + ox, t = by + oy;
    if (a && l < a.right && l + bw > a.left && t < a.bottom && t + bh > a.top) return win(L[2]);
  }

  // Cornering wins, but not on the first clip of a wall: clipping one corner by accident
  // in the opening seconds would end the joke before it lands. Three pins and it is done.
  if (pinned && ++pins >= 3) return win(L[3]);

  // Pick, then step along on a clash. A retry loop would spin forever on a one-entry
  // pool, and does spin forever if Math.random is ever stubbed.
  const pool = pinned ? CORNERED : TAUNTS;
  let i = (Math.random() * pool.length) | 0;
  if (pool[i] === said) i = (i + 1) % pool.length;
  say(pool[i]);

  shout(ts);
}

/** The escape. Fires 10s after the chase began, not 10s after the page loaded. */
function shout(ts: number) {
  if (shouted || ts - began < 10_000) return;
  shouted = true;
  $('lock-shout')?.classList.add('is-on');
  sfx('menu');
}

function initRunaway(root: HTMLElement) {
  cta = $('lock-cta');
  face = $('lock-avatar');
  if (!cta) return;

  // Read live inside the handler, so turning on reduced motion mid-visit is respected
  mq = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
  // Set before any bail, so the line is never left blank on a phone
  L = cta.dataset.lines!.split('|');
  TAUNTS = cta.dataset.taunts!.split('|');
  CORNERED = cta.dataset.corner!.split('|');
  set('lock-label', mq.matches ? L[5] : L[6]);

  const go = (e: PointerEvent) => flee(e.clientX, e.clientY, e.timeStamp);
  root.addEventListener('pointermove', go);
  root.addEventListener('pointerdown', go);   // a stab counts as an approach
}

/**
 * The sound player.
 *
 * Lazy. Nothing in here is fetched, and no audio file is requested, until the visitor has
 * chosen sound. That is non-negotiable 2 in CLAUDE.md and it is also just decent: a
 * portfolio that makes noise at someone before they ask is a portfolio they close.
 *
 * Web Audio rather than <audio> elements. An <audio> tag cannot overlap with itself, so a
 * fast click would cut off the previous click, and it carries enough latency that the
 * sound arrives after the thing it is meant to be describing. Decoding each file once
 * into a buffer and firing a fresh source node per play has neither problem.
 *
 * Two ways to make a sound:
 *   - click or hover anything matching the maps in src/data/sfx.ts, handled here
 *   - dispatch `new CustomEvent('sfx', { detail: 'win' })` on document, from anywhere
 * The event bus is what keeps lock.ts, dock-drag.ts, presence.ts and game.ts from having
 * to import this file. They ask for a sound; whether anything is listening is not their
 * problem.
 */
import { SOUNDS, CLICK, HOVER, GAIN, DEFAULT_GAIN, DIR, type Sound } from '../data/sfx';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<Sound, AudioBuffer>();

/** Hovers fire in bursts as the pointer crosses a row of icons. One every 90ms, and never
 *  twice for the same element, is the difference between playful and a swarm of bees. */
const HOVER_MS = 90;
let lastHover = 0;

let started = false;

/**
 * The stored volume as a gain, 0 to 1. The slider in the speaker panel writes it and
 * announces it; this is the only thing in here that knows a level exists at all.
 */
const level = () => {
  const n = Number(localStorage.vol);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n / 100)) : 1;
};

export function init() {
  document.addEventListener('vol', (e) => {
    // Dragging the slider has to change the click sounds under the pointer, not on the
    // next reload. Only when sound is on: zero already turned it off through `snd`.
    const d = (e as CustomEvent<number>).detail;
    if (master && localStorage.snd === 'on') master.gain.value = d;
  });
  if (started) return;
  started = true;

  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  /* Decoded once, in parallel, and kept. 21 files at about 4KB each is 132KB, which is
     less than one photograph and is only ever fetched by someone who asked for it.
     A file that fails to load is simply never played: no retry, no console noise, no
     reason to bother the visitor about a click sound. */
  SOUNDS.forEach(async (name) => {
    try {
      const res = await fetch(`${DIR}/${name}.m4a`);
      if (!res.ok) return;
      buffers.set(name, await ctx!.decodeAudioData(await res.arrayBuffer()));
    } catch { /* no sound for that one, and nothing else changes */ }
  });

  /* Capture phase, so a sound still happens when a handler further down calls
     stopPropagation, which the window chrome does. */
  document.addEventListener('click', onClick, true);

  // A pointer that cannot hover has nothing to play here, and touch would fire these on tap.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointerover', onHover, true);
  }

  document.addEventListener('sfx', ((e: CustomEvent) => play(e.detail)) as EventListener);

  /* The autoplay policy can hand back a suspended context, and a background tab should
     not be making noise into the void either. */
  document.addEventListener('pointerdown', resume, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx?.suspend();
    else resume();
  });

  /* Turning sound off has to silence what is already loaded, not just stop new fetches.
     src/scripts/snd.ts owns the setting and fires this. */
  document.addEventListener('snd', ((e: CustomEvent) => {
    if (master) master.gain.value = e.detail ? level() : 0;
    if (e.detail) resume();
  }) as EventListener);
}

const resume = () => { if (ctx?.state === 'suspended') ctx.resume(); };

/** First matching selector wins. */
function match(el: Element, map: [string, Sound][]): [Element, Sound] | null {
  for (const [sel, name] of map) {
    const control = el.closest(sel);
    if (control) return [control, name];
  }
  return null;
}

function onClick(e: Event) {
  const el = e.target as Element | null;
  if (!el?.closest) return;
  play(match(el, CLICK)?.[1] ?? 'tap');
}

function onHover(e: PointerEvent) {
  const el = e.target as Element | null;
  if (!el?.closest) return;
  const hit = match(el, HOVER);
  if (!hit) return;
  const [control, name] = hit;
  /* pointerover fires again at every child boundary. If the pointer came from another
     part of this same control, it never left the control and this is not a new hover. */
  const from = e.relatedTarget as Node | null;
  if (from && control.contains(from)) return;
  const now = performance.now();
  if (now - lastHover < HOVER_MS) return;
  lastHover = now;
  play(name);
}

export function play(name: Sound) {
  const buf = ctx && buffers.get(name);
  if (!ctx || !buf || !master) return;
  resume();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = GAIN[name] ?? DEFAULT_GAIN;
  src.connect(g).connect(master);
  src.start();
}

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
/** Where the slider was before the speaker was clicked, so unmuting can put it back. */
let beforeMute = 60;
/** Spotify's own controller, once its iframe API has handed one over. */
let spotify: { pause(): void; resume(): void } | null = null;
/** Whether Spotify is making noise right now, straight from its playback_update. */
let spotifyOn = false;

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
  const playing = spotifyOn || (!!current && !current.paused);

  for (const r of q<HTMLInputElement>('.vol__range')) {
    r.value = String(vol);
    // No cross-browser pseudo-element paints the filled half of a range, so the track is
    // a gradient and this is where it stops.
    r.style.setProperty('--fill', vol + '%');
  }
  for (const n of q<El>('.vol__pct')) n.textContent = String(vol);

  /* Spotify wins the label when it is playing, because it is the one the visitor
     started by hand. Saying "Nothing playing" over a track somebody can hear is worse
     than saying nothing at all. */
  const title = spotifyOn ? 'Spotify' : current ? current.dataset.title! : 'Nothing playing';
  const why = spotifyOn
    ? 'What Yves listens to'
    : current ? `Because ${current.dataset.label} is open` : 'Open Work, Feedback or Spotify';
  for (const n of q<El>('.np__title')) n.textContent = title;
  for (const n of q<El>('.np__why')) n.textContent = why;

  for (const b of q<HTMLButtonElement>('.np__toggle')) {
    b.disabled = !current && !spotifyOn;
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

/**
 * Stop Spotify, wherever it is. It is a cross origin iframe, so there is no pause to call
 * from here without loading Spotify's own iframe API, a third party script this page has
 * no other use for. Reloading the frame stops the audio and leaves a player sitting at
 * 00:00, which is friendlier than removing it: the Music window still has something in it
 * when the visitor goes back.
 */
function stopSpotify() {
  // A real pause now that there is a controller to ask. Reloading the frame was the only
  // lever before having one, and it threw away the visitor's place in the playlist.
  if (spotify) return spotify.pause();
  const f = document.querySelector<HTMLIFrameElement>('#cc-spotify iframe');
  if (f) f.src = f.src;
}

function start(a: HTMLAudioElement) {
  current = a;
  // Never two sources at once. The newest thing the visitor did wins, which is the only
  // rule that stays predictable in both directions.
  stopSpotify();
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

/**
 * Put the playlist in, through Spotify's own iframe API rather than as raw markup.
 *
 * The API is what makes Spotify a source this panel can talk about: the controller emits
 * playback_update, so the now playing row can say "Spotify" instead of lying about
 * nothing playing, and it takes pause(), so one source at a time is a real pause rather
 * than reloading the frame and losing the visitor's place.
 *
 * Third party, so it loads on the same terms as the embed it controls: the first time
 * Control Center opens, never for somebody who does not open it. If it fails to arrive,
 * the plain iframe goes in instead and everything except the label still works.
 */
function mountSpotify(host: HTMLElement) {
  const URI = 'spotify:playlist:6vjBKgpH5qrt7DW06uJYgL';
  const plain = () => {
    if (host.querySelector('iframe')) return;
    host.innerHTML = `<iframe title="Spotify playlist" width="100%" height="152" loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      src="https://open.spotify.com/embed/playlist/6vjBKgpH5qrt7DW06uJYgL?utm_source=generator"></iframe>`;
  };

  const w = window as unknown as Record<string, unknown>;
  w.onSpotifyIframeApiReady = (API: {
    createController(el: Element, opts: object, cb: (c: never) => void): void;
  }) => {
    const slot = document.createElement('div');
    host.replaceChildren(slot);
    API.createController(slot, { uri: URI, width: '100%', height: 152 }, (c) => {
      const ctl = c as unknown as {
        pause(): void; resume(): void;
        addListener(name: string, fn: (e: { data: { isPaused: boolean } }) => void): void;
      };
      spotify = ctl;
      ctl.addListener('playback_update', (e) => {
        const on = !e.data.isPaused;
        if (on === spotifyOn) return;
        spotifyOn = on;
        // One source at a time, decided by whichever started last. Spotify starting is a
        // deliberate press, so the window soundtrack is the one that steps aside.
        if (on) stop();
        paint();
      });
    });
  };

  const s = document.createElement('script');
  s.src = 'https://open.spotify.com/embed/iframe-api/v1';
  s.async = true;
  s.onerror = plain;
  document.head.appendChild(s);
  // If the API never calls back, fall back to the embed that at least plays.
  setTimeout(() => { if (!spotify) plain(); }, 4000);
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

  /* Clicking the speaker glyph mutes, and clicking it again restores the level it was at
     rather than a guessed one. Delegated, because the glyph exists in both panels. */
  document.addEventListener('click', (e) => {
    if (!(e.target as El).closest('[data-mute]')) return;
    if (vol > 0) { beforeMute = vol; vol = 0; } else { vol = beforeMute || 60; }
    applyVolume(true);
  });

  /* Pause. Also delegated, for the same reason: the button exists twice. */
  document.addEventListener('click', (e) => {
    const b = (e.target as El).closest<HTMLButtonElement>('.np__toggle');
    if (!b || b.disabled) return;
    // Whatever the row is naming is what this button controls.
    if (spotifyOn || (spotify && !current)) {
      if (spotifyOn) spotify?.pause(); else spotify?.resume();
      return;
    }
    if (!current) return;
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

  /* Theme. Two attributes on <html> are the whole mechanism; tokens.css does the rest.
     The inline script in Base.astro has already applied the stored pair before first
     paint, so all this does is keep the controls in step and write the answers down.

     Auto needs nothing here and nothing at load either. With no data-mode set, the
     prefers-color-scheme block in tokens.css is what applies, and it keeps applying when
     the system flips at sunset. A matchMedia listener would be a second, slower copy of
     something CSS already does. */
  const root = document.documentElement;
  const pick = (name: string, attr: 'mode' | 'accent', dflt: string) => {
    const on = $(`${name === 'mode' ? 'md' : 'ac'}-${root.dataset[attr] || dflt}`) as HTMLInputElement | null;
    if (on) on.checked = true;
    for (const r of q<HTMLInputElement>(`input[name="${name}"]`)) {
      r.addEventListener('change', () => {
        // The default carries no attribute, so the cleanest state is no state, and a
        // visitor who never touches this is served exactly what they were before.
        if (r.value === dflt) delete root.dataset[attr];
        else root.dataset[attr] = r.value;
        localStorage[attr] = r.value;
      });
    }
  };
  pick('mode', 'mode', 'auto');
  pick('accent', 'accent', 'teal');

  /* Spotify. Built the first time Control Center opens and never again: rule 1 says
     nothing loads that the visitor did not ask for, and opening the panel is the asking.
     After that it stays in the DOM, so it keeps its place in the playlist for the rest of
     the visit.

     The shape is parinazkassemi.com's, because that one is known to work: the compact 152
     player at full width, with autoplay delegated so its own button can start audio.

     No theme=0 on the URL, which is the difference that mattered. That parameter is not
     only a colour: with it Spotify draws a denser variant that, in a box this size, clips
     its own title and collapses the play button to a dot. Hers carries utm_source and
     nothing else, and lays out properly. */
  const spot = $('cc-spotify');
  let mounted = false;
  cc?.addEventListener('toggle', () => {
    if (!cc.open || !spot || mounted) return;
    mounted = true;
    /* After the panel has finished opening, not during. Spotify measures its frame once,
       on load, and lays itself out from that: built mid-animation it reads the scaled-down
       box, draws a smaller player with the title clipped, and never re-measures. --t-base
       is the animation, so this waits it out. Under reduced motion it is one tick. */
    const settle = parseFloat(getComputedStyle(document.body).getPropertyValue('--t-base')) || 0;
    setTimeout(() => mountSpotify(spot), settle + 60);
  });
}

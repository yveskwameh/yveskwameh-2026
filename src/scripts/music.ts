/**
 * The Music window: the Spotify embed, and play/pause for Yves's own excerpts.
 *
 * Nothing here is loaded until the window opens: not this file, and not the iframe. Then
 * one iframe is injected. The tracks are already in the page as <audio preload="none">, so
 * they cost nothing either until someone presses a button.
 *
 * Full Spotify playback needs the visitor logged in; otherwise previews play. Spotify does
 * not allow autoplay from a page, so the visitor presses play inside the embed.
 */
const PLAYLISTS: Record<string, string> = {
  // label: Spotify playlist ID (the part after /playlist/ in the share URL)
  // Just the id. Pasting the whole share URL leaves a "?si=..." on the end, which lands
  // mid-query in the embed URL and breaks it.
  focus: '6vjBKgpH5qrt7DW06uJYgL',
};

/**
 * Runs the first time the Music window opens, and only then. The delegated click listener
 * this used to carry for [data-open] is gone: the module is now fetched *because* of that
 * click, so a listener added here would be too late to ever see it. scripts/lazy.ts
 * guarantees this runs once, so there is nothing to guard against either.
 */
export function init() {
  const box = document.getElementById('spotify-box');
  if (box) {
    box.innerHTML = `<iframe style="border:0" width="100%" height="352" loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      src="https://open.spotify.com/embed/playlist/${PLAYLISTS.focus}?utm_source=generator&theme=0"></iframe>`;
  }

  const list = document.querySelector<HTMLElement>('.music__list');
  if (!list) return;

  const buttons = [...list.querySelectorAll<HTMLElement>('[data-play]')];
  const audioFor = (b: HTMLElement) =>
    document.getElementById(`a-${b.dataset.play}`) as HTMLAudioElement | null;

  /**
   * Read the state off the audio elements rather than tracking it, so the buttons stay
   * honest when a track ends by itself, or stalls, or the visitor pauses it from their
   * keyboard's media keys.
   */
  const sync = () => {
    for (const b of buttons) {
      const a = audioFor(b);
      const playing = !!a && !a.paused && !a.ended;
      b.setAttribute('aria-pressed', String(playing));
      b.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${b.dataset.title ?? ''}`.trim());
    }
  };

  for (const b of buttons) {
    const a = audioFor(b);
    if (!a) continue;
    for (const ev of ['play', 'pause', 'ended'] as const) a.addEventListener(ev, sync);
  }

  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-play]');
    if (!b) return;
    const a = audioFor(b);
    if (!a) return;
    if (!a.paused) { a.pause(); return; }
    // One at a time. Two themes over each other is noise, not a playlist.
    for (const other of buttons) {
      const o = audioFor(other);
      if (o && o !== a) { o.pause(); o.currentTime = 0; }
    }
    // A rejected play (no codec, a file that moved) must not leave the button saying it is
    // playing, so the state is re-read either way.
    a.play().catch(sync);
  });
}

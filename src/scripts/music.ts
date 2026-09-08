/**
 * Music via Spotify embed. Nothing is loaded until the Music window opens: not this
 * file, and not the iframe. Then one iframe is injected. That's the whole cost.
 * Full playback needs the visitor logged into Spotify in the browser; otherwise previews play.
 * Spotify does not allow autoplay from a page, so the visitor presses play inside the embed.
 */
const PLAYLISTS: Record<string, string> = {
  // label: Spotify playlist ID (the part after /playlist/ in the share URL)
  // Just the id. Pasting the whole share URL leaves a "?si=..." on the end, which lands
  // mid-query in the embed URL and breaks it.
  focus: '6vjBKgpH5qrt7DW06uJYgL',
};

/**
 * Runs the first time the Music window opens, and only then. The delegated click listener
 * this used to carry is gone: the module is now fetched *because* of that click, so a
 * listener added here would be too late to ever see it. scripts/lazy.ts guarantees this
 * runs once, so there is nothing to guard against either.
 */
export function init() {
  const box = document.getElementById('spotify-box');
  if (!box) return;
  box.innerHTML = `<iframe style="border:0" width="100%" height="352" loading="lazy"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    src="https://open.spotify.com/embed/playlist/${PLAYLISTS.focus}?utm_source=generator&theme=0"></iframe>`;
}

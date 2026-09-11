/**
 * Self-hosted tracks for the Music window, alongside the Spotify playlist.
 *
 * Files live in public/audio. Nothing is fetched until the visitor presses play, because
 * every <audio> carries preload="none", and nothing plays without a click, which is rule 2.
 *
 * Two formats each, which is the standard <source> pair rather than a preference. Opus is
 * about half the bytes of MP3 at the same perceived quality and every current browser takes
 * it, but older Safari does not, and audio that silently fails to play is worse than audio
 * that is bigger than it needed to be. The browser chooses; no script is involved.
 *
 * Both are 30 second excerpts with a fade at the end, cut from the full themes. An excerpt
 * that stops dead mid-phrase sounds like a bug rather than a decision.
 *
 * Only add audio you have the right to distribute. The Spotify embed already covers
 * listening and it is licensed, so this list is for Yves's own recordings and anything he
 * holds the rights to.
 */
export type Track = {
  /** Used for element ids, so it has to be unique and URL safe. */
  id: string;
  title: string;
  /** Composer or performer. Optional: better blank than guessed. */
  artist?: string;
  /** Both files share this stem, under /audio. */
  src: string;
};

export const tracks: Track[] = [
  { id: 'avengers', title: 'The Avengers', artist: 'Alan Silvestri', src: '/audio/avengers' },
  // Artist deliberately blank. There are several pieces called the Justice League theme by
  // different composers and the file carries no metadata, so naming one would be a guess.
  { id: 'justice-league', title: 'Justice League', src: '/audio/justice-league' },
];

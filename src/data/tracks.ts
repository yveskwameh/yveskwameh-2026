/**
 * The two window soundtracks.
 *
 * These are not a playlist. Opening Work starts one, opening Feedback starts the other,
 * and there is no way to pick between them: no next, no previous, no track list. Pause is
 * the only transport, and it lives in the speaker panel in the menu bar.
 *
 * Which track goes where was decided by measuring them rather than by ear alone. Justice
 * League opens quiet and builds, so it sits under a long read, which is what Work is. The
 * Avengers is busy from the first bar, which suits the short visit Feedback gets.
 *
 * Nothing is fetched until a window opens, because every <audio> carries preload="none",
 * and nothing plays unless the visitor already said yes to sound on the lock screen. That
 * is rule 2: no click, no sound.
 *
 * Both files run their full length and then repeat. The fade at each end is baked into the
 * file, not ramped by script: <audio loop> restarts instantly, so a file that fades out at
 * the end and fades back in at the top loops as a fade and repeat on its own. No timers,
 * no gain nodes, no bytes on the page. The fade in also means the music swells when the
 * window opens instead of slamming in. Re-cut them with tools/../make_audio_full.py.
 *
 * Two formats each, which is the standard <source> pair rather than a preference. Opus is
 * about half the bytes of MP3 at the same perceived quality and every current browser
 * takes it, but older Safari does not, and audio that silently fails to play is worse than
 * audio that is bigger than it needed to be. The browser chooses; no script is involved.
 *
 * Only add audio you have the right to distribute. That is Yves's call, not this file's.
 */
export type Track = {
  /** Used for element ids, so it has to be unique and URL safe. */
  id: string;
  title: string;
  /** Composer or performer. Optional: better blank than guessed. */
  artist?: string;
  /** Both files share this stem, under /audio. */
  src: string;
  /**
   * The window whose opening starts this track, matching [data-window] exactly. The panel
   * says "Because Work is open", and this is where that sentence gets its noun.
   */
  window: string;
  /** What the panel calls that window. Kept here so the copy is not built from an id. */
  windowLabel: string;
};

export const tracks: Track[] = [
  {
    id: 'justice-league',
    // Named for the window rather than for the record. The file is the Justice League
    // theme, and calling it that in the panel says nothing about why it is playing; a
    // visitor who opens Work is looking at a league of shipped work, so the title says
    // that and the nod survives. The source stays in this comment for the record.
    title: 'Design League',
    // Artist deliberately blank. There are several pieces called the Justice League theme
    // by different composers and the file carries no metadata, so naming one would be a
    // guess, and a guess with a composer's name on it is worse than a blank.
    src: '/audio/justice-league',
    window: 'projects',
    windowLabel: 'Work',
  },
  {
    id: 'avengers',
    // The Avengers theme, by Alan Silvestri. Same idea: the Feedback window is clients
    // gathered in one place, and "assemble" is the one word that whole film is known for,
    // so the title does the joke and names the window at the same time.
    title: 'Clients Assemble',
    artist: 'Alan Silvestri',
    src: '/audio/avengers',
    window: 'testimonials',
    windowLabel: 'Feedback',
  },
];

/** Window id to track, which is the lookup the soundtrack actually does. */
export const trackForWindow = (id: string) => tracks.find((t) => t.window === id);

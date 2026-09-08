/**
 * Self-hosted tracks for the Music window, alongside the Spotify playlist.
 *
 * Drop the files in public/audio and list them here. Nothing is fetched until the
 * visitor presses play, because <audio> carries preload="none".
 *
 * Only add audio you have the right to distribute. The Spotify embed in the Music window
 * already covers listening, and it is licensed, so this list is for your own recordings
 * and anything you hold the rights to.
 */
export type Track = { title: string; artist: string; src: string };

// Adding the first entry here also needs the player wiring back into scripts/music.ts.
// It was removed while this list was empty because unreachable code still costs bytes
// against the ~10KB budget. Copy the arm/play pattern from scripts/lock.ts: browsers
// only grant permission to play from a real click, once per page load.
export const tracks: Track[] = [
  // { title: 'The Avengers', artist: 'Alan Silvestri', src: '/audio/avengers.mp3' },
];

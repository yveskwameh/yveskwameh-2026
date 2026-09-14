/** Single place for identity + links, used by the lock screen, menu bar and About window. */
export const site = {
  name: 'Yves Kwameh',
  role: 'Strategic UX/UI Designer & No-code Developer',
  title: 'UX/UI DESIGNER',          // the short line under the name on the lock screen
  location: 'Port Harcourt',
  /* Sits next to the location on the lock screen. Says availability rather than
     geography, because "WAT" read as a limit and Yves works to his clients' hours. */
  availability: 'Any time zone',
  status: 'Available for work',
  email: 'hello@yveskwameh.com',
  avatar: '/images/avatar.avif',    // made by tools/make-avatar.sh. Falls back to initials if absent.

  /**
   * Cloudflare Web Analytics. Two separate facts, because they are separate.
   *
   * `analytics` is whether the site is counted at all. It is what the privacy note in
   * About this site reads, and it must be true whenever anything is counting, however the
   * beacon gets onto the page. Gating that note on the token instead was a bug: with
   * Cloudflare's automatic setup the token is never in this file, so the site would have
   * been counting visitors while telling them it was not.
   *
   * `analyticsToken` is only for manual setup, where we put the beacon on the page
   * ourselves. Cloudflare's automatic setup injects the same script at the edge instead,
   * and then this stays empty. Never do both: two beacons means every visit counted twice.
   *
   * Either way it is the only third party script on the site, 30,294 bytes and 10,125
   * gzipped, and a deliberate exception to non-negotiable rule 1 taken with the numbers in
   * front of us. See the note in CLAUDE.md.
   */
  analytics: true,
  analyticsToken: '',

  /** Round icon buttons on the lock screen. `glyph` is a Pixelarticons name. */
  /* Ordered by what a client or a recruiter opens first, not by when each was added.
     LinkedIn is the professional identity, GitHub is the proof that the build half of
     "design and build" is real, Instagram is the visual work, and X is commentary. The
     menu bar and the lock screen both read this list, so they cannot disagree. */
  socials: [
    { name: 'LinkedIn',  glyph: 'linkedin',     url: 'https://www.linkedin.com/in/yveskwameh/' },
    { name: 'GitHub',    glyph: 'github',       url: 'https://github.com/yveskwameh' },
    { name: 'Instagram', glyph: 'instagram',    url: 'https://www.instagram.com/yveskwameh/' },
    { name: 'X',         glyph: 'twitter-bird', url: 'https://x.com/yveskwameh' },
  ],
} as const;

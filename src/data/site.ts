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
   * Whether anything is counting visitors. True because Cloudflare Web Analytics is on,
   * with automatic setup, so Cloudflare injects the beacon at its edge and there is no
   * script for this repo to add. See the note in Base.astro for why the edge version is
   * the better one and what would stop it working.
   *
   * This is read in two places that must not disagree with reality: the "What it collects"
   * note in About this site, and tools/js-budget.py, which cannot see an edge injected
   * script in dist/ and would otherwise report a total that is true of the build and false
   * of the site.
   *
   * It is the only third party script on the site, 30,294 bytes and 10,125 gzipped, and a
   * deliberate exception to non-negotiable rule 1 taken with the numbers in front of us.
   */
  analytics: true,

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

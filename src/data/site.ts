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

  /** Round icon buttons on the lock screen. `glyph` is a Pixelarticons name. */
  socials: [
    { name: 'LinkedIn',  glyph: 'linkedin',     url: 'https://www.linkedin.com/in/yveskwameh/' },
    { name: 'Instagram', glyph: 'instagram',    url: 'https://www.instagram.com/yveskwameh/' },
    { name: 'X',         glyph: 'twitter-bird', url: 'https://x.com/yveskwameh' },
  ],
} as const;

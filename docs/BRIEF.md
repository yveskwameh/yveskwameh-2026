# Design brief

## The idea
A portfolio that behaves like an old operating system. Not macOS-glass like the references, but early-90s bitmap: hard 1px borders, solid offset shadows, striped title bars, pixel icons, one display font for chrome and a clean sans for body copy. Playful on the surface, fast and plain underneath.

## References (what to borrow, what to leave)
**parinazkassemi.com**
- Borrow: entry gate before the desktop, desktop icons that open "apps", menu bar with owner name + menus + clock, dock as tech stack, widget column on desktop that becomes a bottom sheet on mobile, theme switcher
- Leave: the frosted glass, blur, noise texture, modern macOS feel

**heyclicky.com**
- Borrow: traffic-light chrome on every content block, focused window dims everything else, file-name captions under windows (`usecase.mov`), draggable folders scattered on the desktop, testimonials as a grid of small windows, menu bar with wifi/battery/clock flavour and a CTA on the right
- Leave: the dot-grid background, the meme density

## The twist
- Boot sequence replaces the lock screen: "Yves Kwameh", stepped progress bar, click to skip, skipped on return visits
- Pixel icons (like the classic Mac computer icon), no anti-aliasing
- Menus as real dropdowns (File, View), "Clean Up Desktop" and "Change Theme" as actions
- Errors and empty states written like system dialogs ("Error: file not found.")
- Optional retro cursor set

## Content map
| Portfolio content | OS element |
|---|---|
| Who Yves is | "About Yves" window, open by default |
| Case studies | "Work" folder → file icons → each opens its own window and has a real URL `/work/<name>/` |
| Services / process | "Services" window styled like a control panel |
| Tools | Dock: Claude Code, Codex, Figma, Webflow, VS Code, Higgsfield |
| Testimonials / Upwork proof | "Feedback" window: grid of small windows, heyclicky style |
| Music | "Music" app: Spotify playlist embed, loaded on click |
| Contact | "Mail" window with one big button, plus "Hire me" in the menu bar |
| Fun | Trash with "things I don't do" |

## Mobile
Icons flow into a phone home-screen grid. Windows open as bottom sheets. Widgets (theme, clock, music) live in a pull-up sheet. Drag is off.

## Music
Spotify only. One or more playlists Yves curates. Embed is created when the Music app opens, never before. No autoplay anywhere.

Playback is limited and the limit is Spotify's, not ours. Full tracks need a logged-in
Premium account in a desktop browser, and the visitor must press play on Spotify's own
controls inside the iframe. Everyone else, free accounts, logged-out visitors and every
phone, gets the 30 second preview. Do not wire a custom play button to the iframe API:
calling play() from outside starts preview playback even for Premium listeners.

## Speed targets
- Lighthouse 100/100/100/100 on mobile
- Under 10KB client JS, under 100KB total first load before images
- One self-hosted display font, preloaded. Body uses system-ui until a second font earns its place

## Open decisions
- Desktop colour and theme palette (tokens.css has a placeholder teal-grey)
- Display font: Chicago-style bitmap vs a licensed pixel font
- Exact pixel icon set (draw in Figma, export PNG @2x)
- Which Upwork proof to show in Feedback

/**
 * The dock has two groups, split by a divider, the way macOS separates apps from
 * Finder items. Tools first, then the system items.
 */

/**
 * Tools, in the order they sit in the Figma file. `icon` is a file in src/icons/stack.
 *
 * `quip` is what the tool says when someone tries to drag it out of the dock. They never
 * actually can: it springs back and answers. The line lives here rather than in the script
 * because string literals are not minified, so copy in data rides along in the page while
 * copy in JS is charged against the budget.
 */
export const dockTools = [
  { name: 'Claude Code', icon: 'claude-code',        quip: 'Claude wrote half of this. It stays.' },
  { name: 'Codex',       icon: 'codex',              quip: 'Nice try. Codex is not going anywhere.' },
  { name: 'Figma',       icon: 'figma',              quip: 'You cannot take Figma out of my brain.' },
  { name: 'Webflow',     icon: 'webflow',            quip: 'Webflow pays the bills.' },
  { name: 'VS Code',     icon: 'visual-studio-code', quip: 'Put it back.' },
  { name: 'Higgsfield',  icon: 'higgsfield',         quip: 'Higgsfield stays. I am not explaining why.' },
];

/**
 * System items after the divider. `opens` names what each one launches, which need not be
 * a window: Images has no window at all, and the window manager hands an unknown id to the
 * APPS map in scripts/lazy.ts, where `images` is the pile of prints on the desktop.
 *
 * `icon` is a drawn PNG in public/icons. `glyph` is a Pixelarticons fallback, kept for
 * any future item Yves has not drawn yet.
 *
 * Trash is out. It sat here opening nothing, which is worse than not being there: a dock
 * icon is a promise that pressing it does something. Yves's call, and it comes back the
 * day it has a window. Its artwork is still public/icons/trash.png, the glyph is still in
 * tools/sync-icons.mjs, and docs/BRIEF.md still carries the idea for it, "things I don't
 * do", so nothing has to be redrawn or rethought to put it back.
 */
export const dockSystem = [
  { name: 'Images', icon: '/icons/images.png', opens: 'images', quip: 'That is where I keep everything.' },
] as { name: string; opens: string; icon?: string; glyph?: string; quip?: string }[];

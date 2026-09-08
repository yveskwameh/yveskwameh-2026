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
 * System items after the divider. `opens` names the window each should open. Neither
 * window exists yet, and the window manager ignores an id it cannot find, so these are
 * inert clicks until they do.
 *
 * `icon` is a drawn PNG in public/icons. `glyph` is a Pixelarticons fallback, kept for
 * any future item Yves has not drawn yet.
 */
export const dockSystem = [
  { name: 'Images', icon: '/icons/images.png', opens: 'images', quip: 'That is where I keep everything.' },
  { name: 'Trash',  icon: '/icons/trash.png',  opens: 'trash',  quip: 'You want to bin the bin?' },
] as { name: string; opens: string; icon?: string; glyph?: string; quip?: string }[];

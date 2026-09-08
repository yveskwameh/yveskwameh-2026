/**
 * Copies the Pixelarticons glyphs this site uses from node_modules into public/icons/ui.
 * Run: node tools/sync-icons.mjs
 * Add a name to the list, run again, commit the SVGs. The icons become project assets,
 * so a clean install can never remove them.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ICONS = [
  // menu bar
  'clock', 'sun', 'moon',
  // window chrome + actions
  'close', 'minus', 'plus', 'zoom-in', 'external-link', 'arrow-right', 'chevron-down',
  'drag-and-drop', 'lock', 'power',
  // apps
  'folder', 'file-text', 'notes', 'mail', 'music', 'play', 'pause', 'trash', 'user', 'briefcase',
  'image', 'search', 'reload', 'check',
  // brands available in the free set
  'figma', 'github', 'linkedin', 'twitter-bird', 'instagram',
  // lock screen + menu actions + games
  'unlock', 'circle-info', 'gamepad', 'volume-x',
];

const src = resolve('node_modules/pixelarticons/svg');
const out = resolve('public/icons/ui');
mkdirSync(out, { recursive: true });

for (const name of ICONS) {
  copyFileSync(`${src}/${name}.svg`, `${out}/${name}.svg`);
}
console.log(`Synced ${ICONS.length} icons to public/icons/ui`);

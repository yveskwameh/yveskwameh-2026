/**
 * What the site sounds like. Data only, so changing a sound never means reading the
 * player, and Yves can retune the whole thing from this one file.
 *
 * Every file is CC0 from Kenney (kenney.nl): soft clicks and pops from Interface Sounds
 * for the shell, 8-bit blips from Digital Audio for the game and the chase. Swapping a
 * sound means dropping a new .m4a into public/audio/sfx with the same name. See
 * docs/SOUNDS.md for the conversion line.
 *
 * This file is only ever reached through the lazy sfx chunk, so none of it counts against
 * the on-load JS budget.
 */

/** Every sound the site can make. The key is the name used everywhere else. */
export const SOUNDS = [
  // Shell
  'tap', 'button', 'open', 'close', 'menu', 'dock', 'dockDrop',
  'hoverBtn', 'hoverIcon', 'hoverDock', 'hoverMenu',
  // Chase and game
  'flee', 'stuck', 'unlock', 'place', 'house', 'cheat', 'win', 'deny', 'reset', 'react',
] as const;

export type Sound = (typeof SOUNDS)[number];

/**
 * Which sound a click makes, by what was clicked. First match wins, so the order is the
 * rule: the most specific selector has to come first or the generic one swallows it.
 * Anything that matches nothing still makes `tap`, because Yves asked for a sound on
 * every click and silence on an unstyled link would read as a bug.
 */
export const CLICK: [string, Sound][] = [
  ['[data-close], .window__light--close', 'close'],
  ['[data-open], .icon, .dock__item', 'open'],
  ['.menu summary, .menubar__link, .ctx button', 'menu'],
  ['.btn, button, a[href]', 'button'],
];

/**
 * The same idea for hover. Deliberately shorter: only the things that look pressable get
 * a hover sound, because a noise following the pointer everywhere is exhausting rather
 * than playful.
 */
export const HOVER: [string, Sound][] = [
  ['.dock__item', 'hoverDock'],
  ['.icon', 'hoverIcon'],
  ['.menu summary, .menubar__link', 'hoverMenu'],
  ['.btn, .window__light', 'hoverBtn'],
];

/**
 * Per-sound volume, 0 to 1. Hovers sit well under clicks because they fire far more
 * often, and the game sits above both because it is the thing you are looking at.
 * Anything not named here plays at 0.5.
 */
export const GAIN: Partial<Record<Sound, number>> = {
  hoverBtn: 0.22, hoverIcon: 0.22, hoverDock: 0.22, hoverMenu: 0.18,
  tap: 0.35, button: 0.5, open: 0.5, close: 0.5, menu: 0.4, dock: 0.5, dockDrop: 0.6,
  flee: 0.5, stuck: 0.8, unlock: 0.7,
  place: 0.7, house: 0.7, cheat: 0.85, win: 0.9, deny: 0.85, reset: 0.6, react: 0.6,
};

export const DEFAULT_GAIN = 0.5;

/** Where the files live. */
export const DIR = '/audio/sfx';

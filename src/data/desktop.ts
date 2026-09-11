/**
 * Desktop icons. x/y are the starting positions (px from top-left of the desktop);
 * the visitor can drag them anywhere after that.
 *
 * Filled column by column, top down, the way a desktop fills: the first column holds the
 * four that matter, the second starts again at the top. Music used to sit at the head of
 * the second column, and taking it out left a hole there, so the rest moved up.
 *
 * Trash is deliberately not here. It lives in the dock only, the way macOS keeps it,
 * so the desktop stays for the things worth opening. Its window id is still 'trash'.
 */
export type DesktopItem = {
  id: string;
  label: string;
  icon: string;
  opens: 'about' | 'projects' | 'services' | 'testimonials' | 'contact' | 'trash' | 'game';
  x: number;
  y: number;
};

export const desktopItems: DesktopItem[] = [
  { id: 'about',        label: 'About Yves', icon: '/icons/computer.png', opens: 'about',        x: 24,  y: 24 },
  { id: 'projects',     label: 'Work',       icon: '/icons/folder.png',   opens: 'projects',     x: 24,  y: 124 },
  { id: 'services',     label: 'Services',   icon: '/icons/prefs.png',    opens: 'services',     x: 24,  y: 224 },
  { id: 'testimonials', label: 'Feedback',   icon: '/icons/notes.png',    opens: 'testimonials', x: 24,  y: 324 },
  { id: 'contact',      label: 'Mail',       icon: '/icons/mail.png',     opens: 'contact',      x: 124, y: 24 },
  { id: 'game',         label: 'Tic Tac Toe', icon: '/icons/game.png',    opens: 'game',         x: 124, y: 124 },
];

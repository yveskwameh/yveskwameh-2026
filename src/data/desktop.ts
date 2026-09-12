/**
 * Desktop icons. x/y are the starting positions (px from top-left of the desktop);
 * the visitor can drag them anywhere after that.
 *
 * Filled column by column, top down, the way a desktop fills: the first column holds the
 * four that matter, the second starts again at the top. Music used to sit at the head of
 * the second column, and taking it out left a hole there, so the rest moved up.
 *
 * Labels say what opening the icon gets you, not the name of a category. "Work" made a
 * visitor guess; "Yves's projects" does not. They wrap to two or three lines under an
 * 88px icon, which is how a desktop label has always looked, and they stay short enough
 * that the third line is the exception. The window titles behind them stay short: the
 * label is the invitation, the title is the name of the room.
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
  { id: 'about',        label: 'Meet Yves',                 icon: '/icons/computer.png', opens: 'about',        x: 24,  y: 24 },
  { id: 'projects',     label: "Yves's projects",           icon: '/icons/folder.png',   opens: 'projects',     x: 24,  y: 124 },
  { id: 'services',     label: 'What Yves offers',          icon: '/icons/prefs.png',    opens: 'services',     x: 24,  y: 224 },
  { id: 'testimonials', label: 'What clients say',          icon: '/icons/notes.png',    opens: 'testimonials', x: 24,  y: 324 },
  { id: 'contact',      label: 'Send Yves a message',       icon: '/icons/mail.png',     opens: 'contact',      x: 124, y: 24 },
  { id: 'game',         label: 'Play Yves at Tic Tac Toe',  icon: '/icons/game.png',     opens: 'game',         x: 124, y: 124 },
];

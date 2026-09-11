/** Menu bar menus behave like macOS: one open at a time, any outside click closes them. */
const Q = 'details[data-menu]';
/* What counts as inside. The speaker panel and Control Center are siblings of their
   <details> rather than its content, so that they can be positioned without Chrome's
   ::details-content pseudo becoming their containing block. Without this, dragging the
   volume slider would read as a click outside its own menu and shut the panel. */
const IN = Q + ', .tray';

export function initMenus() {
  const menus = Array.from(document.querySelectorAll<HTMLDetailsElement>(Q));
  const closeAll = (except?: HTMLDetailsElement) => menus.forEach((m) => m !== except && (m.open = false));

  menus.forEach((m) => m.addEventListener('toggle', () => m.open && closeAll(m)));

  /**
   * macOS: the click opens the first menu, and after that the bar behaves like one strip.
   * Slide the pointer from File to View and the menu follows you, rather than leaving File
   * hanging open until you click again.
   *
   * Gated on something already being open, so a plain hover over an idle bar still does
   * nothing. Setting `open` fires the toggle listener above, which closes the other one,
   * so switching needs no extra bookkeeping.
   */
  document.addEventListener('pointerover', (e) => {
    if (!menus.some((m) => m.open)) return;
    const m = (e.target as HTMLElement).closest?.<HTMLDetailsElement>(Q);
    if (m && !m.open) m.open = true;
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    if (!(e.target as HTMLElement).closest(IN)) closeAll();
  });
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest(Q + ' button')) closeAll();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeAll());
}

/**
 * Services: one open at a time.
 *
 * The rows are labels for checkboxes, because a checkbox closes when it is pressed again
 * and a radio does not. What a checkbox cannot do is close the others when it opens, so
 * this does: on any change, if the one that changed is now checked, every other one is
 * unchecked. The open and close animations are still entirely CSS on :checked.
 *
 * Fetched the first time the Services window opens (see lazy.ts), never on page load.
 */
export function init() {
  const card = document.querySelector<HTMLElement>('#win-services .svc');
  if (!card) return;
  card.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    if (!box.checked) return;
    card.querySelectorAll<HTMLInputElement>('.svc__radio').forEach((o) => {
      if (o !== box) o.checked = false;
    });
  });
}

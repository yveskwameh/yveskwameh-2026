/**
 * The Mail window.
 *
 * The form is real HTML with a real action, so with this file blocked the browser posts
 * it the ordinary way and the visitor lands on the form service's own confirmation. All
 * this adds is: post in the background and stay on the desktop. That is why it is safe to
 * fetch late, and why there is no validation here. The form is not marked novalidate, so
 * an invalid one never fires submit at all and the browser has already checked everything
 * by the time any of this runs.
 *
 * Fetched the first time the Mail window opens. See scripts/lazy.ts.
 */
export function init() {
  const form = document.querySelector<HTMLFormElement>('.compose');
  if (!form) return;

  /**
   * A readable message for a half-written address.
   *
   * The field carries a pattern as well as type="email", because the spec's own rule for
   * type="email" accepts `test@test`. What the browser then says about it is "Please match
   * the format requested", which tells the visitor nothing about what is wrong or how to
   * fix it. This replaces that one sentence.
   *
   * Cleared first on every keystroke, because a custom message sticks: leave it set and
   * the field stays invalid after it has been corrected. Only the pattern is handled here.
   * Empty, missing @ and a space all get the browser's own wording, which is already
   * specific and already translated into the visitor's language.
   *
   * On input and change, not on submit: a submit event never fires on an invalid form, so
   * a listener there would be the one place this could never run. By the time anyone
   * presses Send they have typed, and autofill fires change.
   */
  const email = form.querySelector<HTMLInputElement>('[name="email"]');
  if (email) {
    const check = () => {
      email.setCustomValidity('');
      // typeMismatch as well, or this steals the better message from an address that is
      // wrong in some other way: "no-at-sign" fails the pattern too, and being told it is
      // missing a .com is worse than being told it is missing an @.
      if (email.value && !email.validity.typeMismatch && email.validity.patternMismatch) {
        email.setCustomValidity('Add the ending, like gmail.com');
      }
    };
    email.addEventListener('input', check);
    email.addEventListener('change', check);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.dataset.state === 'sending') return;
    form.dataset.state = 'sending';
    try {
      // FormData plus only an Accept header keeps this a simple cross-origin request, so
      // there is no preflight for the form service to have to answer.
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw res;
      form.dataset.state = 'sent';
      form.reset();
    } catch {
      // Never swallow the message. The failed state shows the address to write to.
      form.dataset.state = 'failed';
    }
  });

  form.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-compose-again]')) delete form.dataset.state;
  });
}

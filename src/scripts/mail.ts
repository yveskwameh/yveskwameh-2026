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

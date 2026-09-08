/** Menu bar clock: "Sun 6 Sep  10:42" style, updates every minute. */
export function startClock(el: HTMLElement | null) {
  if (!el) return;
  const tick = () => {
    const d = new Date();
    el.textContent = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
      + '  ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 60_000);
}

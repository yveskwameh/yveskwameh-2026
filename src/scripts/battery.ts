/**
 * The visitor's real battery in the menu bar.
 *
 * Chrome and Edge only. Firefox removed this API and Safari never shipped it, both
 * because it is a fingerprinting vector. Where it is missing this returns immediately and
 * the markup's default full battery stands, which is what Yves asked for. No percentage
 * is written in that case: inventing a number for someone else's device is worse than
 * showing none.
 */
export function initBattery() {
  const el = document.getElementById('batt');
  const nav = navigator as any;
  if (!el || !nav.getBattery) return;

  nav.getBattery().then((b: any) => {
    const draw = () => {
      const p = Math.round(b.level * 100);
      // The number rides on a data attribute and CSS prints it with content: attr().
      // Cheaper than a second element and a second lookup.
      el.dataset.pct = p + '%';
      el.style.setProperty('--lvl', p + '%');
      el.classList.toggle('is-charging', b.charging);
      el.classList.toggle('is-low', p < 21 && !b.charging);
    };
    // Property handlers rather than addEventListener, purely because two of those cost
    // more than the whole rest of this function.
    b.onlevelchange = b.onchargingchange = draw;
    draw();
  }).catch(() => {});
}

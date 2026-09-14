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
  const pct = document.getElementById('batt-pct');
  const nav = navigator as any;
  if (!el || !nav.getBattery) return;

  nav.getBattery().then((b: any) => {
    const draw = () => {
      const p = Math.round(b.level * 100);
      // A real element rather than content: attr() on ::after. The battery carries a
      // tooltip now, and that also lives on ::after, so the two were fighting over one
      // pseudo-element and the tooltip won. The number simply vanished.
      if (pct) pct.textContent = p + '%';
      // The element is role="img", which makes everything inside it presentational, so
      // the number a sighted visitor reads would otherwise not exist for anyone using a
      // screen reader. The label is the only place left to put it. Free: this file is
      // fetched on the first pointer move, not on load.
      el.setAttribute('aria-label', b.charging ? `Battery ${p}%, charging` : `Battery ${p}%`);
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

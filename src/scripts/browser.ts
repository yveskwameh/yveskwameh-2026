/**
 * The Browser window: loads an app from the shelf into a frame.
 *
 * Which app to show arrives as data-arg on the window. window-manager.ts copies it there
 * from whatever was clicked, a shelf item or anything else carrying data-open="browser"
 * data-arg="<id>", before it opens the window. That is read once on launch, then watched,
 * because the module launches only once and later clicks only change the attribute.
 *
 * Closing the window throws the frame away rather than hiding it. A hidden frame keeps
 * running, and a game left playing sound behind a closed window is exactly what rule 2
 * exists to prevent. Reopening loads it fresh.
 *
 * The frame is sandboxed. It keeps scripts and its own origin, which an app needs to
 * work, but it cannot navigate this page or open things without a click. Cross-origin, the
 * pair allow-scripts and allow-same-origin gives it no reach into this site.
 *
 * Fetched the first time the Browser window opens (see lazy.ts), never on page load.
 */
import { products, productIcon } from '../data/products';

export function init() {
  const win = document.getElementById('win-browser');
  const br = document.getElementById('br');
  if (!win || !br) return;
  const host = document.getElementById('br-frame')!;
  const url = document.getElementById('br-url')!;
  const out = document.getElementById('br-out') as HTMLAnchorElement;
  const outName = document.getElementById('br-out-name')!;
  const outIcon = document.getElementById('br-out-icon') as HTMLImageElement;
  const outGo = document.getElementById('br-out-go') as HTMLAnchorElement;
  const marks = br.querySelectorAll<HTMLElement>('.br__mark');

  const show = (state: 'home' | 'app' | 'out') => { br.dataset.state = state; };

  /**
   * Lay the site out at a laptop's width, then scale it down to the window. A site decides
   * its layout from the width it is given, and a frame in a 960 window got a tablet layout.
   * At 1280 or wider nothing is scaled and the site simply fills the window.
   */
  const DESKTOP = 1280;
  function fit() {
    const f = host.querySelector('iframe');
    if (!f || !host.clientWidth) return;
    const s = Math.min(1, host.clientWidth / DESKTOP);
    f.style.width = `${host.clientWidth / s}px`;
    f.style.height = `${host.clientHeight / s}px`;
    f.style.transform = s < 1 ? `scale(${s})` : '';
  }
  new ResizeObserver(fit).observe(host);

  // The search on the Chrome home filters the tiles and cards as you type.
  const search = document.getElementById('br-search') as HTMLInputElement | null;
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    br.querySelectorAll<HTMLElement>('[data-find]').forEach((el) => { el.hidden = !!q && !el.dataset.find!.includes(q); });
  });

  function home() {
    host.replaceChildren();
    marks.forEach((m) => m.removeAttribute('aria-current'));
    url.textContent = 'Apps Yves built';
    show('home');
  }

  function go(id: string | undefined) {
    const p = products.find((x) => x.id === id);
    if (!p) return home();
    marks.forEach((m) => {
      if (m.dataset.go === id) m.setAttribute('aria-current', 'page');
      else m.removeAttribute('aria-current');
    });
    url.textContent = new URL(p.url).host;
    out.href = p.url;

    if (!p.embed) {
      host.replaceChildren();
      outName.textContent = p.name;
      outIcon.src = productIcon(p.id); outIcon.hidden = false;
      outGo.href = p.url;
      return show('out');
    }

    const f = document.createElement('iframe');
    f.src = p.url;
    f.title = p.name;
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    f.setAttribute('allow', 'fullscreen');
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    host.replaceChildren(f);
    show('app');
    fit();
  }

  br.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-go], [data-br]');
    if (!t) return;
    if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); return; }
    if (t.dataset.br === 'home') home();
    if (t.dataset.br === 'reload') {
      const f = host.querySelector('iframe');
      if (f) f.src = f.src;
    }
  });

  new MutationObserver((records) => {
    for (const r of records) {
      if (r.attributeName === 'data-arg') go(win.dataset.arg);
      if (r.attributeName === 'class' && !win.classList.contains('is-open')) { home(); delete win.dataset.arg; }
    }
  }).observe(win, { attributes: true, attributeFilter: ['data-arg', 'class'] });

  go(win.dataset.arg);
}

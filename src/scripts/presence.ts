/**
 * Live cursors. Everyone with the site open sees everyone else move.
 *
 * Fetched on the first mouse movement, never on page load, so the socket only opens for
 * someone who actually has a cursor to share. Touch and coarse pointers never load it at
 * all: there is nothing to show, and opening a connection for them would be pure cost.
 *
 * Positions travel as fractions of the viewport rather than pixels, because two people are
 * never looking at the same size window. Everything else is one small JSON message per
 * event. The server (worker/index.ts) stamps identity, so a client can only ever move or
 * rename itself.
 *
 * If the socket cannot be reached, nothing happens and nothing is said. The site works the
 * same alone, which is how it will be most of the time.
 */
const SEND_MS = 45;          // ~22 updates a second is smooth and cheap
const MAX_RETRY = 4;

type Peer = { id: string; name: string; hue: number; at?: [number, number] };

const $ = (id: string) => document.getElementById(id);

export function init() {
  // No pointer, no cursor to share.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const layer = $('peers'), tpl = $('peer-tpl') as HTMLTemplateElement | null;
  const meEl = $('me'), meChip = $('me-chip'), meEdit = $('me-edit') as HTMLInputElement | null;
  const react = $('react');
  if (!layer || !tpl || !meEl || !meChip || !meEdit || !react) return;

  /** id -> the element showing that person, plus where they are. */
  const peers = new Map<string, { el: HTMLElement; chip: HTMLElement }>();
  let ws: WebSocket | null = null;
  let myId = '';
  let hovering = '';           // whose chip the reaction palette is currently attached to
  let retries = 0;

  const place = (el: HTMLElement, x: number, y: number) => {
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  /* ---------------------------------------------------------------- peers */
  function add(p: Peer) {
    if (p.id === myId || peers.has(p.id)) return;
    const el = tpl!.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const chip = el.querySelector<HTMLElement>('.peer__chip')!;
    el.style.color = `hsl(${p.hue} 72% 46%)`;
    el.style.setProperty('--peer', `hsl(${p.hue} 62% 38%)`);
    chip.textContent = p.name;
    chip.dataset.peer = p.id;
    // Off screen until their first move, so a joiner does not flash in the top corner.
    place(el, -100, -100);
    layer!.appendChild(el);
    peers.set(p.id, { el, chip });
    if (p.at) move(p.id, p.at[0], p.at[1]);
  }

  function move(id: string, fx: number, fy: number) {
    const p = peers.get(id);
    if (p) place(p.el, fx * innerWidth, fy * innerHeight);
  }

  function drop(id: string) {
    peers.get(id)?.el.remove();
    peers.delete(id);
    if (hovering === id) hideReact();
  }

  /* ------------------------------------------------------------ reactions */
  function hideReact() { react!.hidden = true; hovering = ''; }

  function showReact(chip: HTMLElement, id: string) {
    hovering = id;
    react!.hidden = false;
    const r = chip.getBoundingClientRect(), box = react!.getBoundingClientRect();
    react!.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - box.width / 2), innerWidth - box.width - 8)}px`;
    react!.style.top = `${Math.max(8, r.top - box.height - 8)}px`;
  }

  /** Float an emoji up from wherever that person is standing. */
  function pop(id: string, emoji: string) {
    const el = id === myId ? meEl! : peers.get(id)?.el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const node = document.createElement('span');
    node.className = 'pop';
    node.textContent = emoji;
    node.style.left = `${r.left}px`;
    node.style.top = `${r.top - 8}px`;
    document.body.appendChild(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }

  /* --------------------------------------------------------------- socket */
  const send = (m: unknown) => ws?.readyState === 1 && ws.send(JSON.stringify(m));

  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);

    ws.addEventListener('message', (e) => {
      let m: any;
      try { m = JSON.parse(e.data); } catch { return; }
      switch (m.t) {
        case 'hello':
          retries = 0;
          myId = m.you.id;
          meEl!.hidden = false;
          meEl!.style.setProperty('--peer', `hsl(${m.you.hue} 62% 38%)`);
          m.peers.forEach(add);
          break;
        case 'join': add(m); break;
        case 'move': move(m.id, m.x, m.y); break;
        case 'name': {
          const p = peers.get(m.id);
          if (p) p.chip.textContent = m.name;
          break;
        }
        case 'react': pop(m.id, m.e); break;
        case 'bye': drop(m.id); break;
      }
    });

    // Everyone else's cursors are stale the moment the connection drops, so clear them.
    ws.addEventListener('close', () => {
      peers.forEach((_, id) => drop(id));
      meEl!.hidden = true;
      if (retries < MAX_RETRY) setTimeout(connect, 1000 * 2 ** retries++);
    });
    ws.addEventListener('error', () => ws?.close());
  }

  /* ---------------------------------------------------------------- input */
  let px = 0, py = 0, sentAt = 0, queued = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    // The chip follows even while disconnected, so it never looks frozen.
    if (!meEdit!.hidden) return;   // pinned while renaming
    place(meEl!, px, py);
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      send({ t: 'move', x: px / innerWidth, y: py / innerHeight });
      sentAt = performance.now();
    }, Math.max(0, SEND_MS - (performance.now() - sentAt)));
  }, { passive: true });

  // Hovering a chip offers a reaction; leaving the pair of them takes it away.
  document.addEventListener('pointerover', (e) => {
    const chip = (e.target as HTMLElement).closest?.<HTMLElement>('.peer__chip');
    if (chip?.dataset.peer) showReact(chip, chip.dataset.peer);
    else if (!(e.target as HTMLElement).closest?.('.react')) hideReact();
  }, { passive: true });

  react.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-e]');
    if (!b || !hovering) return;
    send({ t: 'react', to: hovering, e: b.dataset.e });
    pop(myId, b.dataset.e!);   // show it immediately rather than waiting for the round trip
    hideReact();
  });

  /* ----------------------------------------------------------- your name */
  meChip.addEventListener('click', () => {
    const r = meChip.getBoundingClientRect();
    meEdit.value = meChip.textContent === 'you' ? '' : meChip.textContent || '';
    meEdit.hidden = false;
    meEdit.style.left = `${r.left}px`;
    meEdit.style.top = `${r.top}px`;
    meEdit.focus();
    meEdit.select();
  });

  const commit = (keep: boolean) => {
    if (meEdit.hidden) return;
    const name = meEdit.value.trim().slice(0, 24);
    meEdit.hidden = true;
    if (!keep || !name) return;
    meChip.textContent = name;
    send({ t: 'name', name });
  };
  meEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
    e.stopPropagation();     // Escape here must not also close a window
  });
  meEdit.addEventListener('blur', () => commit(true));

  connect();
}

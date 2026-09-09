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

  /** id -> the element showing that person, plus where and how big they are on screen.
   *  x/y/w/h are cached rather than measured, because they are used on every pointer move
   *  to work out who you are pointing at, and reading a rect there would mean a layout on
   *  every frame. We placed the cursor, so we already know where it is; w/h only change
   *  when a name does. */
  type Cursor = { el: HTMLElement; chip: HTMLElement; x: number; y: number; w: number; h: number };
  const peers = new Map<string, Cursor>();

  /** Remeasure one cursor's box. Called when it appears and whenever its name changes. */
  const size = (p: Cursor) => { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; };
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
    const cur: Cursor = { el, chip, x: -100, y: -100, w: 0, h: 0 };
    peers.set(p.id, cur);
    size(cur);
    if (p.at) move(p.id, p.at[0], p.at[1]);
  }

  function move(id: string, fx: number, fy: number) {
    const p = peers.get(id);
    if (!p) return;
    p.x = fx * innerWidth;
    p.y = fy * innerHeight;
    place(p.el, p.x, p.y);
    // The picker rides along with whoever it is attached to, rather than being left
    // hanging over the spot they used to be standing in.
    if (hovering === id) anchor(id);
  }

  function drop(id: string) {
    peers.get(id)?.el.remove();
    peers.delete(id);
    if (hovering === id) hideReact();
  }

  /* ------------------------------------------------------------ reactions
     Hover intent, the same shape every hover menu uses: leaving the trigger starts a
     timer rather than closing, and entering either the trigger or the menu cancels it.
     Travelling from a name chip to the picker takes a moment and passes over ground that
     belongs to neither, and closing on that was the bug. The CSS halo on .react covers
     the geometry; this covers the intent. */
  const CLOSE_MS = 260;
  let closeTimer = 0;
  /** Where the picker last landed, so the pointer can be tested against it without a
   *  layout read on every move. Refreshed by anchor(). */
  let box: DOMRect | null = null;

  const cancelClose = () => { clearTimeout(closeTimer); closeTimer = 0; };
  function hideReact() { cancelClose(); react!.hidden = true; hovering = ''; }
  function armClose() {
    if (!hovering || closeTimer) return;
    closeTimer = window.setTimeout(hideReact, CLOSE_MS);
  }

  /** Place the picker over a peer's chip. Called again on every move while it is open. */
  function anchor(id: string) {
    const p = peers.get(id);
    if (!p) return hideReact();
    const r = p.chip.getBoundingClientRect(), b = react!.getBoundingClientRect();
    const left = r.left + r.width / 2 - b.width / 2;
    react!.style.left = `${Math.min(Math.max(8, left), innerWidth - b.width - 8)}px`;
    /* Above the chip, unless that would put it under the menu bar, in which case it goes
       below instead. A picker hiding behind the clock cannot be clicked. */
    const above = r.top - b.height - 6;
    react!.style.top = `${above < 34 ? r.bottom + 6 : above}px`;
    box = react!.getBoundingClientRect();
  }

  function showReact(id: string) {
    cancelClose();
    if (hovering === id) return;     // already open on this person, leave it where it is
    hovering = id;
    react!.hidden = false;
    anchor(id);
  }

  /**
   * Who is the pointer on, if anyone. Arithmetic against the positions we already hold,
   * rather than asking the browser what is under the pointer.
   *
   * Hit testing cannot work here and it is worth writing down why: your own cursor chip
   * is drawn at your pointer and sits above this layer, so the moment you point at
   * somebody, your own "you" pill is the thing under the pointer, not them. That is the
   * bug behind "the picker only opens sometimes". It also means nobody else's cursor
   * needs to be pointer-interactive at all, so none of them can block a button any more.
   *
   * PAD is slop in every direction: these are moving targets, and a few pixels of
   * generosity is the difference between pointing at somebody and chasing them.
   */
  const PAD = 8;
  function peerAt(x: number, y: number): string {
    for (const [id, p] of peers) {
      if (x >= p.x - PAD && x <= p.x + p.w + PAD && y >= p.y - PAD && y <= p.y + p.h + PAD) {
        return id;
      }
    }
    return '';
  }

  /** Is the pointer on the open picker, counting a margin around it as still on it? */
  function onPicker(x: number, y: number) {
    if (react!.hidden || !box) return false;
    return x >= box.left - 14 && x <= box.right + 14
        && y >= box.top - 14 && y <= box.bottom + 14;
  }

  /**
   * A reaction lands as a small crowd of emoji rising off that person's cursor and
   * drifting apart. One node was a notification; ten is a reaction.
   *
   * They are DOM nodes with a CSS animation and per-node custom properties rather than
   * anything canvas-shaped, because ten spans for two seconds is nothing and it keeps the
   * whole effect in the stylesheet where it can be tuned by eye.
   */
  const RAIN = 10;
  function pop(id: string, emoji: string) {
    const el = id === myId ? meEl! : peers.get(id)?.el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // One node, one second, no drift: the same information without the movement.
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = calm ? 1 : RAIN;

    for (let i = 0; i < n; i++) {
      const node = document.createElement('span');
      node.className = 'pop';
      node.textContent = emoji;
      node.style.left = `${r.left + 6}px`;
      node.style.top = `${r.top - 8}px`;
      if (!calm) {
        const rnd = (a: number, b: number) => a + Math.random() * (b - a);
        node.style.setProperty('--dx', `${rnd(-46, 46)}px`);
        node.style.setProperty('--rise', `${-rnd(160, 250)}px`);
        node.style.setProperty('--s', `${rnd(0.8, 1.35)}`);
        node.style.setProperty('--r', `${rnd(-28, 28)}deg`);
        node.style.setProperty('--dur', `${rnd(1.4, 2.2)}s`);
        // Staggered over half a second, so they leave in a stream rather than a block.
        node.style.animationDelay = `${(i / n) * 460}ms`;
      }
      document.body.appendChild(node);
      node.addEventListener('animationend', () => node.remove(), { once: true });
    }
    document.dispatchEvent(new CustomEvent('sfx', { detail: 'react' }));
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
          if (p) { p.chip.textContent = m.name; size(p); }   // a longer name is a wider target
          break;
        }
        /* At the person it was aimed at, not at whoever sent it. `to` has always been
           relayed and was never read, so every reaction rained on the sender. Older
           clients that send no `to` fall back to the sender, which is what it used to do. */
        case 'react': pop(m.to || m.id, m.e); break;
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

    /* Who are you pointing at. Cheap enough to run on every move: a handful of number
       comparisons over at most 30 cursors, no DOM reads. Leaving somebody starts the
       close timer rather than closing, so travelling into the picker keeps it open. */
    const on = peerAt(px, py);
    if (on) showReact(on);
    else if (onPicker(px, py)) cancelClose();
    else armClose();

    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      send({ t: 'move', x: px / innerWidth, y: py / innerHeight });
      sentAt = performance.now();
    }, Math.max(0, SEND_MS - (performance.now() - sentAt)));
  }, { passive: true });

  // Escape closes it, like every other menu on the desktop.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideReact(); });

  react.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-e]');
    if (!b || !hovering) return;
    send({ t: 'react', to: hovering, e: b.dataset.e });
    // Shown at the target immediately rather than waiting for the round trip, and at the
    // target rather than at us, so both people see the same thing in the same place.
    pop(hovering, b.dataset.e!);
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

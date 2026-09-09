/**
 * The presence room: one Durable Object holding every open tab on the site.
 *
 * This is the only server-side code in the project, and it exists because live cursors
 * cannot be done without one. Everything else is still static files: Cloudflare serves an
 * asset if the path matches one, and only falls through to this Worker when it does not,
 * so the site itself is untouched and there is no Astro adapter and no SSR.
 *
 * It uses the WebSocket Hibernation API rather than holding sockets open in memory:
 * acceptWebSocket hands the connection to the runtime, which evicts this object while
 * nothing is being said and wakes it on the next message. That is what keeps an idle room
 * free rather than billing for wall-clock time.
 *
 * Positions live in memory on purpose. Hibernation can throw them away, and that costs
 * nothing: a cursor that has not moved since the eviction reappears the moment it does.
 * Identity survives instead, on the socket's own attachment.
 */

const MAX_PEERS = 30;      // a portfolio, not a chat room
const MAX_NAME = 24;
/** Must match the list rendered in src/components/os/Desktop.astro. */
const EMOJI = ['👋', '💗', '😂', '⭐', '👀', '🎉', '🥂'];
/** One reaction per person per 400ms. Fast enough to feel free, slow enough to not spam. */
const REACT_MS = 400;

/* Kept in the room rather than the browser so two people cannot arrive as the same one.
   The noun stays "visitor" and the adjective does the telling apart, which reads better
   than a number and does not invent a personality for a stranger. */
const ADJECTIVES = [
  'a curious', 'a passing', 'a quiet', 'a new', 'an early', 'a late',
  'a friendly', 'a nosy', 'a lost', 'a patient', 'a restless', 'a distant',
];

type Peer = { id: string; name: string; hue: number };

export class Room {
  ctx: any;
  pos = new Map<string, [number, number]>();
  /* When a reaction was last accepted from each person. One reaction is now a burst of
     ten animated nodes on every screen in the room, so holding the button down would be
     other people's problem rather than the sender's. Kept in memory on purpose: it is
     worth nothing after a hibernation, and the worst a reset allows is one extra emoji. */
  react = new Map<string, number>();

  constructor(ctx: any) {
    this.ctx = ctx;
  }

  /** Everyone except the socket that caused this, since the sender already knows. */
  private send(msg: unknown, except?: any) {
    const text = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try { ws.send(text); } catch { /* a closing socket is not an error worth logging */ }
    }
  }

  private who(ws: any): Peer | null {
    try { return ws.deserializeAttachment(); } catch { return null; }
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a websocket', { status: 426 });
    }
    if (this.ctx.getWebSockets().length >= MAX_PEERS) {
      return new Response('Room full', { status: 503 });
    }

    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];

    const me: Peer = {
      id: crypto.randomUUID().slice(0, 8),
      name: ADJECTIVES[(Math.random() * ADJECTIVES.length) | 0] + ' visitor',
      hue: (Math.random() * 360) | 0,
    };

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(me);

    // Tell the newcomer who is already here, then tell everyone else about them.
    const peers = this.ctx.getWebSockets()
      .map((ws: any) => this.who(ws))
      .filter((p: Peer | null): p is Peer => !!p && p.id !== me.id)
      .map((p: Peer) => ({ ...p, at: this.pos.get(p.id) }));

    server.send(JSON.stringify({ t: 'hello', you: me, peers }));
    this.send({ t: 'join', ...me }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: any, raw: string) {
    const me = this.who(ws);
    if (!me || typeof raw !== 'string' || raw.length > 512) return;

    let m: any;
    try { m = JSON.parse(raw); } catch { return; }

    // The id is always taken from the socket, never from the message, so nobody can move
    // or rename somebody else's cursor.
    if (m.t === 'move') {
      const x = +m.x, y = +m.y;
      if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return;
      this.pos.set(me.id, [x, y]);
      this.send({ t: 'move', id: me.id, x, y }, ws);
      return;
    }

    if (m.t === 'name') {
      const name = String(m.name ?? '').trim().slice(0, MAX_NAME);
      if (!name) return;
      const next = { ...me, name };
      ws.serializeAttachment(next);
      this.send({ t: 'name', id: me.id, name });
      return;
    }

    if (m.t === 'react' && EMOJI.includes(m.e)) {
      const now = Date.now();
      if (now - (this.react.get(me.id) ?? 0) < REACT_MS) return;
      this.react.set(me.id, now);
      // Not back to the sender: their own client already showed it the instant they
      // clicked, rather than waiting for the round trip, so echoing would double it.
      this.send({ t: 'react', id: me.id, to: String(m.to ?? '').slice(0, 8), e: m.e }, ws);
    }
  }

  private gone(ws: any) {
    const me = this.who(ws);
    if (!me) return;
    this.pos.delete(me.id);
    this.react.delete(me.id);
    this.send({ t: 'bye', id: me.id }, ws);
  }

  webSocketClose(ws: any) { this.gone(ws); }
  webSocketError(ws: any) { this.gone(ws); }
}

export default {
  async fetch(request: Request, env: any) {
    if (new URL(request.url).pathname === '/ws') {
      // One room for the whole site. idFromName is stable, so every visitor lands in the
      // same object no matter which edge location they hit.
      return env.ROOM.get(env.ROOM.idFromName('desktop')).fetch(request);
    }
    // Static assets are matched before this Worker ever runs, so anything arriving here
    // is genuinely not a file we have.
    return new Response('Not found', { status: 404 });
  },
};

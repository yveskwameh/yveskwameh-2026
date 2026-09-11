/**
 * Tic tac toe against Yves, played inside the conversation.
 *
 * Every turn posts a board into the thread and demotes the one before it. That is not
 * decoration: the match is rigged, and a thread you can scroll back through is what makes
 * the rigging legible. The board carrying your line ends up sitting directly above the
 * ruling that took it away.
 *
 * How it stays rigged, and why it never draws. Yves plays perfectly, so you cannot get a
 * line and a sensible game would fill the board and draw. He does not accept that: when
 * the board fills he winds it back two turns and play carries on. The last of those
 * rewinds is the one that comes back short one of your squares, which hands him a
 * position he can finish from. Everything he does buys time except that one.
 */
import { SAY, YOU, IDLE_WARN_S, IDLE_MOVE_S, REWIND_PLIES } from '../data/game';

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
type Mark = '' | 'X' | 'O';
type Turn = 'you' | 'yves' | 'review' | 'over';
type Score = { match: number; you: number; yves: number; viol: number };
const $ = (id: string) => document.getElementById(id);
const pick = <T,>(a: readonly T[]) => a[(Math.random() * a.length) | 0];
const sfx = (name: string) => document.dispatchEvent(new CustomEvent('sfx', { detail: name }));

export function init() {
  /* Bound after the guard as a tuple, not narrowed in place: the hoisted functions below
     would not see the narrowing and every use would need a bang. */
  const els = ['ttt-thread', 'ttt-feed', 'ttt-status', 'ttt-actions', 'ttt-typing', 'win-game', 'lock', 'ttt-board-tpl'].map($);
  if (els.some((el) => !el)) return;
  const [thread, feed, status, actions, typing, winEl, lockEl] = els as HTMLElement[];
  const tpl = els[7] as HTMLTemplateElement;
  const avatar = typing.querySelector('img')!.src;

  let grid: Mark[] = Array(9).fill('');
  let turn: Turn = 'you', epoch = 0, idleWarn = 0, idleMove = 0, turns = 0, appeals = 0;
  let moved = false, idleUsed = false, appealing = false, needsReset = false;
  /** The board after every ply, which is the only thing a rewind can wind back to. */
  let history: Mark[][] = [];
  /** Rewinds used, and how many this game gets. The last one is always the rigged one. */
  let stalls = 0, budget = 2 + (Math.random() < .5 ? 0 : 1);
  /** The board at the bottom of the thread: the only one that is playable. */
  let live: HTMLElement | null = null;
  const score = load();

  function load(): Score {
    try {
      const s = JSON.parse(localStorage.ttt || '');
      if (typeof s?.yves === 'number') return { match: 1, you: 0, yves: 0, viol: 0, ...s };
    } catch {}
    return { match: 1, you: 0, yves: 0, viol: 0 };
  }
  const save = () => { try { localStorage.ttt = JSON.stringify(score); } catch {} };
  const line = (m: Mark) => LINES.find((l) => l.every((i) => grid[i] === m));
  const free = () => grid.map((m, i) => m ? -1 : i).filter((i) => i >= 0);
  const active = () => !document.hidden && winEl.classList.contains('is-open') && lockEl.classList.contains('is-open');
  const cells = () => [...(live?.querySelectorAll<HTMLButtonElement>('.ttt__cell') ?? [])];

  function paintScore() {
    $('ttt-match')!.textContent = '#' + String(score.match).padStart(3, '0');
    $('ttt-you')!.textContent = String(score.you);
    $('ttt-yves')!.textContent = String(score.yves);
    $('ttt-viol')!.textContent = String(score.viol);
  }
  /** Repaint the live board. Past boards are frozen where they were and never touched. */
  function paint() {
    cells().forEach((c, i) => {
      const m = grid[i];
      if (m) c.dataset.mark = m; else delete c.dataset.mark;
      c.disabled = turn !== 'you' || !!m;
      c.setAttribute('aria-label', `Square ${i + 1}, ${m === 'X' ? 'yours' : m === 'O' ? 'Yves' : 'empty'}`);
    });
  }

  const scroll = () => requestAnimationFrame(() => { feed.scrollTop = feed.scrollHeight; });
  function typingOn(on: boolean) {
    typing.hidden = !on;
    if (on) thread.appendChild(typing);
    scroll();
  }
  /** Keep the thread from growing without limit across a long session. */
  function trim() {
    const nodes = thread.querySelectorAll('.msg:not(.msg--typing), .ttt__post');
    for (let i = 0; i < nodes.length - 32; i++) nodes[i].remove();
  }

  /**
   * Post a board. The previous live one keeps its marks, loses its ring, shrinks and is
   * numbered, which turns it from the game into the record of the game.
   */
  function postBoard(label = 'Your turn') {
    if (live) {
      live.classList.replace('is-live', 'is-past');
      live.setAttribute('aria-hidden', 'true');
      live.querySelector('.ttt__turn')!.textContent = `Turn ${++turns}`;
      live.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    }
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    node.classList.add('is-live');
    node.querySelector('.ttt__turn')!.textContent = label;
    live = node;
    paint();
    thread.insertBefore(node, typing);
    trim(); scroll();
  }
  const markWin = (l: number[]) => l.forEach((i) => cells()[i].classList.add('is-win'));

  /**
   * A message. `violation` numbers it as a review and counts it. `tag` is any other label,
   * the Yves rule or an appeal number, which is shown but not counted: only a square
   * changing hands is a violation.
   */
  function post(text: string, visitor: boolean, tag?: string, violation = false) {
    const row = document.createElement('div'); row.className = `msg msg--${visitor ? 'out' : 'in'}`;
    if (!visitor) {
      const face = document.createElement('span'); face.className = 'msg__face';
      const img = document.createElement('img'); img.src = avatar; img.width = 24; img.height = 24; img.alt = '';
      face.append(img); row.append(face);
    }
    const col = document.createElement('span'); col.className = 'msg__col';
    const bubble = document.createElement('span'); bubble.className = 'msg__bubble';
    if (violation) score.viol++;
    const label = violation ? `${tag ?? 'Review'} #${score.viol}` : tag;
    if (label) {
      const t = document.createElement('span'); t.className = 'msg__tag'; t.textContent = label;
      bubble.append(t);
    }
    if (violation) paintScore();
    bubble.append(text); col.append(bubble); row.append(col);
    thread.insertBefore(row, typing);
    trim(); scroll();
  }
  const say = (text: string, tag?: string, violation = false) => { typingOn(false); post(text, false, tag, violation); };
  const me = (text: string) => post(text, true);

  function cancel() { epoch++; appealing = false; clearTimeout(idleWarn); clearTimeout(idleMove); typingOn(false); }
  function later(ms: number, fn: () => void) {
    const current = epoch;
    setTimeout(() => { if (current === epoch && active()) fn(); }, ms);
  }

  /* ----------------------------------------------------------------- play */

  /** A square that completes a line for `m` right now, if there is one. */
  const winAt = (m: Mark) => free().find((i) => { grid[i] = m; const w = !!line(m); grid[i] = ''; return w; });

  /**
   * Negamax. The value of the position for `mover`, who is about to play: 10 for a win,
   * 0 for a draw, less for a loss, nudged by depth so a quick win beats a slow one. Nine
   * squares, so the whole tree is small enough to search every turn.
   */
  function worth(mover: Mark, depth: number): number {
    const other: Mark = mover === 'O' ? 'X' : 'O';
    if (line(other)) return depth - 10;
    const open = free();
    if (!open.length) return 0;
    let best = -Infinity;
    for (const i of open) {
      grid[i] = mover; const v = -worth(other, depth + 1); grid[i] = '';
      if (v > best) best = v;
    }
    return best;
  }
  /** The strongest O move, optionally refusing one square. -1 if there is nothing to play. */
  function bestMove(exclude = -1) {
    let best = -Infinity, at = -1;
    for (const i of free()) {
      if (i === exclude) continue;
      grid[i] = 'O'; const v = -worth('X', 1); grid[i] = '';
      if (v > best) { best = v; at = i; }
    }
    return at;
  }
  /** Yves's move. Perfect: take the win, take the block, otherwise search. He never lets
   *  a line through, because the rewind below is what wins him the game instead. */
  function chooseO() {
    const win = winAt('O');
    if (win !== undefined) return win;
    return winAt('X') ?? bestMove();
  }

  /**
   * The smallest edit to `g` that leaves O, to move, with a forced win. Tried in order:
   * drop one of your squares, drop two, turn one of yours into one of his. Every candidate
   * is checked with the same search he plays by, so the position he rewinds you into is
   * one he can always finish and you can never escape.
   */
  function rig(g: Mark[]): Mark[] | null {
    const mine = g.map((m, i) => m === 'X' ? i : -1).filter((i) => i >= 0);
    const wins = (t: Mark[]) => {
      const keep = grid; grid = t; const v = worth('O', 0); grid = keep;
      return v > 0;
    };
    for (const i of mine) { const t = g.slice(); t[i] = ''; if (wins(t)) return t; }
    for (const i of mine) for (const j of mine) {
      if (j <= i) continue;
      const t = g.slice(); t[i] = ''; t[j] = ''; if (wins(t)) return t;
    }
    for (const i of mine) { const t = g.slice(); t[i] = 'O'; if (wins(t)) return t; }
    return null;
  }

  /**
   * The board filled and nobody won. He does not accept a draw, so he winds it back two
   * turns and play carries on. The last rewind of the game comes back short a square,
   * which is the whole trick: the board changes a lot during a rewind, so one missing X
   * reads as him being careless rather than him cheating. The posted boards in the thread
   * are what give him away, if you go back and count.
   */
  function stall() {
    turn = 'review'; status.textContent = SAY.status.review; typingOn(true); paint();
    stalls++;
    /* history[k] is the board after k + 1 plies, so an odd k leaves an even number played,
       which is your turn. Land on one of those or the rewind quietly hands him a free
       move, and a free move is enough for you to walk into a line he never blocked. */
    let at = history.length - REWIND_PLIES;
    if (at % 2 === 0) at--;
    const target = (at >= 0 ? history[at] : null) ?? Array(9).fill('') as Mark[];
    history = history.slice(0, Math.max(0, at + 1));
    const last = stalls >= budget;
    const rigged = last ? rig(target) : null;
    /* If the search cannot find a winning edit he simply rewinds again and tries from the
       next position. That could in principle go on, so after two more attempts he stops
       being subtle and takes a square outright, which always ends it. */
    if (last && !rigged && stalls > budget + 1) { grid = target.slice(); return review(); }

    later(900, () => {
      if (!rigged) {
        grid = target.slice();
        turn = 'you'; status.textContent = SAY.status.you;
        say(pick(SAY.rewind), 'Rewind', true);
        postBoard();
        sfx('flee');
        armIdle();
        return;
      }
      /* Rigged: the move comes back to him, not to you, and one square is missing. */
      const lost = target.findIndex((m, i) => m === 'X' && rigged[i] !== 'X');
      grid = rigged.slice();
      turn = 'yves';
      say(pick(SAY.rigged), 'Rewind', true);
      postBoard();
      if (lost >= 0) cells()[lost].classList.add('is-cheat');
      sfx('cheat');
      status.textContent = SAY.status.thinking; typingOn(true);
      later(900, yvesTurn);
    });
  }

  function armIdle() {
    clearTimeout(idleWarn); clearTimeout(idleMove);
    if (!moved || idleUsed || turn !== 'you' || !active()) return;
    const current = epoch;
    idleWarn = window.setTimeout(() => {
      if (current === epoch && turn === 'you' && active()) say(pick(SAY.idleWarn));
    }, IDLE_WARN_S * 1000);
    idleMove = window.setTimeout(() => {
      if (current !== epoch || turn !== 'you' || !active() || idleUsed) return;
      const open = free(); if (!open.length) return;
      idleUsed = true;
      const i = pick(open); say(pick(SAY.idle)); play(i, true);
    }, IDLE_MOVE_S * 1000);
  }

  /** Close the match. */
  function end(text: string, tag?: string, violation = false) {
    turn = 'over'; clearTimeout(idleWarn); clearTimeout(idleMove); typingOn(false);
    score.yves++;
    say(text, tag, violation); sfx('win');
    status.textContent = SAY.status.over; paintScore(); save();
    actions.hidden = false; scroll();
  }

  /**
   * The guard behind `line('X')` in play(). He blocks perfectly and the rigged rewind is
   * checked by search before it is committed, so you should never hold a line and this
   * should never run. It is kept so that a position nobody foresaw still ends with a
   * ruling rather than hanging: one of your squares turns out to have been his.
   */
  function review() {
    turn = 'review'; status.textContent = SAY.status.review; typingOn(true); paint();
    later(700, () => {
      const flip = grid.map((m, i) => m === 'X' ? i : -1).filter((i) => i >= 0).find((i) => {
        grid[i] = 'O'; const wins = !!line('O'); grid[i] = 'X'; return wins;
      });
      if (flip === undefined) { postBoard('Final'); return end(pick(SAY.review), undefined, true); }

      grid[flip] = 'O';
      say(pick(SAY.convert), undefined, true);
      postBoard('Final');
      cells()[flip].classList.add('is-cheat');
      markWin(line('O')!);
      sfx('cheat');
      later(600, () => end(pick(SAY.review)));
    });
  }

  function yvesTurn() {
    const threat = winAt('X');
    const i = chooseO();
    if (i < 0) return stall();
    grid[i] = 'O'; sfx('house'); history.push(grid.slice());
    const won = line('O');
    if (won) { postBoard('Final'); markWin(won); return end(pick(SAY.win)); }
    if (!free().length) return stall();

    turn = 'you'; status.textContent = SAY.status.you;
    const danger = LINES.some((l) => l.filter((c) => grid[c] === 'X').length === 2 && l.some((c) => !grid[c]));
    say(pick(threat === i ? SAY.block : danger ? SAY.near : SAY.move));
    postBoard();
    armIdle();
  }

  function play(i: number, forced = false) {
    if (turn !== 'you' || grid[i]) { if (!forced && grid[i]) me(pick(YOU.taken)); return; }
    clearTimeout(idleWarn); clearTimeout(idleMove); moved = true; turn = 'yves';
    grid[i] = 'X'; sfx('place'); history.push(grid.slice());
    paint();                      // your mark lands, and the board freezes with it
    if (!forced) me(`${YOU.square[i]}.`);
    if (line('X')) return review();
    if (!free().length) return stall();
    status.textContent = SAY.status.thinking; typingOn(true);
    later(650 + Math.random() * 250, yvesTurn);
  }

  /**
   * An appeal. Never refused on the spot: he answers in a few messages, thinking it over
   * out loud, and then refuses it. Every one costs a point. The sequences get shorter as
   * they pile up, and the button is never disabled, a second click mid sequence is simply
   * not heard.
   */
  function appeal() {
    if (appealing || turn !== 'over') return;
    appealing = true; appeals++;
    me(YOU.appeal);
    const lines = SAY.appeal[Math.min(appeals, SAY.appeal.length) - 1];
    const step = (k: number) => {
      typingOn(true);
      later(700 + Math.random() * 400, () => {
        const last = k === lines.length - 1;
        say(lines[k], last ? `Appeal #${appeals}` : undefined);
        if (!last) return step(k + 1);
        score.yves++; paintScore(); save(); sfx('deny'); appealing = false;
      });
    };
    step(0);
  }

  function reset(increment = true) {
    cancel();
    grid = Array(9).fill(''); turn = 'you'; turns = 0; appeals = 0;
    history = []; stalls = 0; budget = 2 + (Math.random() < .5 ? 0 : 1);
    moved = false; idleUsed = false;
    score.viol = 0; if (increment) score.match++;
    thread.querySelectorAll('.msg:not(.msg--typing), .ttt__post').forEach((n) => n.remove());
    live = null;
    actions.hidden = true;
    status.textContent = SAY.status.you; paintScore(); save();
    say(pick(increment ? SAY.reset : SAY.opener));
    postBoard();
    sfx('reset');
  }

  /* Only the live board takes clicks. Every past board is disabled as it is demoted, so
     this is a second lock rather than the only one. */
  thread.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (cell && live?.contains(cell)) play(Number(cell.dataset.cell));
  });
  actions.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-ttt]');
    if (!button) return;
    if (button.dataset.ttt === 'reset') { me(YOU.again); return reset(); }
    appeal();
  });

  let wasActive = active();
  const lifecycle = () => {
    const now = active();
    if (!now && wasActive) { cancel(); needsReset = turn !== 'over'; }
    if (now && !wasActive) { if (needsReset) reset(); else armIdle(); needsReset = false; }
    wasActive = now;
  };
  const observer = new MutationObserver(lifecycle);
  observer.observe(winEl, { attributes: true, attributeFilter: ['class'] });
  observer.observe(lockEl, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', lifecycle);

  paintScore();
  say(pick(SAY.opener));
  postBoard();
}

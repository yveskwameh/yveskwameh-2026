/**
 * Tic tac toe against Yves, played inside the conversation.
 *
 * Every turn posts a board into the thread and demotes the one before it. That is not
 * decoration: the match is rigged, and a thread you can scroll back through is what makes
 * the rigging legible. The board carrying your line ends up sitting directly above the
 * ruling that took it away.
 */
import { SAY, YOU, IDLE_WARN_S, IDLE_MOVE_S } from '../data/game';

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
  let turn: Turn = 'you', epoch = 0, idleWarn = 0, idleMove = 0, turns = 0;
  let moved = false, idleUsed = false, appealed = false, needsReset = false;
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
    for (let i = 0; i < nodes.length - 20; i++) nodes[i].remove();
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

  function post(text: string, visitor: boolean, violation = false) {
    const row = document.createElement('div'); row.className = `msg msg--${visitor ? 'out' : 'in'}`;
    if (!visitor) {
      const face = document.createElement('span'); face.className = 'msg__face';
      const img = document.createElement('img'); img.src = avatar; img.width = 24; img.height = 24; img.alt = '';
      face.append(img); row.append(face);
    }
    const col = document.createElement('span'); col.className = 'msg__col';
    const bubble = document.createElement('span'); bubble.className = 'msg__bubble';
    if (violation) {
      score.viol++;
      const tag = document.createElement('span'); tag.className = 'msg__tag'; tag.textContent = `Review #${score.viol}`;
      bubble.append(tag); paintScore();
    }
    bubble.append(text); col.append(bubble); row.append(col);
    thread.insertBefore(row, typing);
    trim(); scroll();
  }
  const say = (text: string, violation = false) => { typingOn(false); post(text, false, violation); };
  const me = (text: string) => post(text, true);

  function cancel() { epoch++; clearTimeout(idleWarn); clearTimeout(idleMove); typingOn(false); }
  function later(ms: number, fn: () => void) {
    const current = epoch;
    setTimeout(() => { if (current === epoch && active()) fn(); }, ms);
  }

  /** Normal priorities: win, block, centre, corners, then edges. */
  function chooseO() {
    const open = free();
    for (const mark of ['O', 'X'] as Mark[]) {
      const square = open.find((i) => {
        grid[i] = mark; const wins = !!line(mark); grid[i] = ''; return wins;
      });
      if (square !== undefined) return square;
    }
    const order = [4, ...[0,2,6,8].sort(() => Math.random() - .5), ...[1,3,5,7].sort(() => Math.random() - .5)];
    return order.find((i) => !grid[i]) ?? -1;
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

  /** Close the match. `violation` numbers the ruling, which a conversion has already
   *  done for itself. */
  function end(text: string, violation: boolean) {
    turn = 'over'; clearTimeout(idleWarn); clearTimeout(idleMove); typingOn(false);
    score.yves++;
    say(text, violation); sfx('win');
    status.textContent = SAY.status.over; paintScore(); save();
    actions.hidden = false; scroll();
  }

  /**
   * The House review. One of your squares turns out to have been his all along, but only
   * when that hands him a line. The corrected board posts as its own entry, so the board
   * before it and the board after it can be read one above the other.
   */
  function review() {
    turn = 'review'; status.textContent = SAY.status.review; typingOn(true); paint();
    later(700, () => {
      const flip = grid.map((m, i) => m === 'X' ? i : -1).filter((i) => i >= 0).find((i) => {
        grid[i] = 'O'; const wins = !!line('O'); grid[i] = 'X'; return wins;
      });
      if (flip === undefined) { postBoard('Final'); return end(pick(SAY.review), true); }

      grid[flip] = 'O';
      say(pick(SAY.convert), true);
      postBoard('Final');
      cells()[flip].classList.add('is-cheat');
      markWin(line('O')!);
      sfx('cheat');
      later(600, () => end(pick(SAY.review), false));
    });
  }

  function houseTurn() {
    const i = chooseO();
    if (i < 0) return review();
    grid[i] = 'O'; sfx('house');
    const won = line('O');
    if (won) { postBoard('Final'); markWin(won); return end(pick(SAY.win), false); }
    if (!free().length) return review();

    turn = 'you'; status.textContent = SAY.status.you;
    const danger = LINES.some((l) => l.filter((c) => grid[c] === 'X').length === 2 && l.some((c) => !grid[c]));
    say(pick(danger ? SAY.near : SAY.move));
    postBoard();
    armIdle();
  }

  function play(i: number, forced = false) {
    if (turn !== 'you' || grid[i]) { if (!forced && grid[i]) me(pick(YOU.taken)); return; }
    clearTimeout(idleWarn); clearTimeout(idleMove); moved = true; turn = 'yves';
    grid[i] = 'X'; sfx('place');
    paint();                      // your mark lands, and the board freezes with it
    if (!forced) me(`${YOU.square[i]}.`);
    if (line('X') || !free().length) return review();
    status.textContent = SAY.status.thinking; typingOn(true);
    later(650 + Math.random() * 250, houseTurn);
  }

  function reset(increment = true) {
    cancel();
    grid = Array(9).fill(''); turn = 'you'; turns = 0;
    moved = false; idleUsed = false; appealed = false;
    score.viol = 0; if (increment) score.match++;
    thread.querySelectorAll('.msg:not(.msg--typing), .ttt__post').forEach((n) => n.remove());
    live = null;
    actions.hidden = true; actions.querySelector<HTMLButtonElement>('[data-ttt="appeal"]')!.disabled = false;
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
    if (appealed) return;
    appealed = true; (button as HTMLButtonElement).disabled = true; score.yves++;
    me(YOU.appeal); say(pick(SAY.appeal), true); paintScore(); save(); sfx('deny');
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

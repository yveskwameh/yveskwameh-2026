/**
 * Tic tac toe against Yves. You cannot win, and the interesting part is how.
 *
 * The rules are not "the computer plays well". A perfect opponent draws, and a draw is
 * still not a win for him. So he does not play better than you, he edits the board and
 * tells you why. Every edit is announced in the panel and counted as a violation, because
 * a cheat you cannot see is just a bug.
 *
 * Two invariants hold the whole thing together:
 *   1. A win of yours never paints. The moment your move completes a line, one of your
 *      marks in that line is removed in the same tick, before anything renders.
 *   2. Every house turn ends with at least one more O on the board and never removes one,
 *      so a match always finishes. PATIENCE caps it if the board somehow does not.
 *
 * Fetched the first time the game window opens. See scripts/lazy.ts.
 */
import { SAY, YOU, WEIGHTS, PHASE, IDLE_S, PATIENCE, type Trick } from '../data/game';

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
/** Squares reachable from each square, for `slide`. */
const NEXT_TO = [[1,3],[0,2,4],[1,5],[0,4,6],[1,3,5,7],[2,4,8],[3,7],[4,6,8],[5,7]];

type Mark = '' | 'X' | 'O';
type Score = { match: number; you: number; yves: number; viol: number };

const $ = (id: string) => document.getElementById(id);
const sfx = (name: string) => document.dispatchEvent(new CustomEvent('sfx', { detail: name }));
const pick = <T,>(a: readonly T[]): T => a[(Math.random() * a.length) | 0];

export function init() {
  const board = $('ttt-board'), feed = $('ttt-feed'), status = $('ttt-status');
  const actions = $('ttt-actions'), typing = $('ttt-typing');
  if (!board || !feed || !status || !actions || !typing) return;

  /* Read off the markup rather than imported, so his face in the thread is the same file
     the header already loaded and there is no second request. */
  const avatar = typing.querySelector('img')!.src;

  const cells = [...board.querySelectorAll<HTMLButtonElement>('.ttt__cell')];

  let grid: Mark[] = Array(9).fill('');
  let locked = -1;          // square closed for maintenance this turn, or -1
  let turns = 0;            // house turns played this match
  let over = false;
  let appealed = false;
  let lastTrick: Trick | 'honest' | '' = '';
  /** Bumped on every reset. A pending step from the old match checks it and gives up,
   *  which is cheaper and safer than tracking and clearing individual timers. */
  let epoch = 0;
  let idleTimer = 0;

  /* ------------------------------------------------------------------ score */
  const score: Score = load();

  function load(): Score {
    try {
      const s = JSON.parse(localStorage.ttt || '');
      // A hand-edited or half-written value should reset, not throw on every render.
      if (typeof s?.yves === 'number') return { match: 1, you: 0, yves: 0, viol: 0, ...s };
    } catch { /* first visit, or somebody has been in the console */ }
    return { match: 1, you: 0, yves: 0, viol: 0 };
  }
  const save = () => { try { localStorage.ttt = JSON.stringify(score); } catch { /* private mode */ } };

  function paintScore() {
    $('ttt-match')!.textContent = '#' + String(score.match).padStart(3, '0');
    $('ttt-you')!.textContent = String(score.you);
    $('ttt-yves')!.textContent = String(score.yves);
    $('ttt-viol')!.textContent = String(score.viol);
  }

  /* ------------------------------------------------------------------- talk */
  /* On the next frame, not this one. The panel is a grid, and showing the Play again
     buttons shrinks the feed row, so a scroll set before that lands in the wrong place
     and leaves the last thing he said half hidden behind the scoreboard. */
  const scrollFeed = () =>
    requestAnimationFrame(() => { feed.scrollTop = feed.scrollHeight; });

  /**
   * Put a message in the thread.
   *
   * `mine` decides the side, which is the whole point of the panel: your moves go out on
   * the right, his replies come in on the left, and the two of you are having a
   * conversation about a game he is rigging. The avatar and the bubble tail are handled in
   * CSS off the position in a run, so nothing here has to know what came before.
   */
  function post(line: string, out: boolean, violation = false) {
    const row = document.createElement('div');
    row.className = `msg msg--${out ? 'out' : 'in'}`;

    if (!out) {
      const face = document.createElement('span');
      face.className = 'msg__face';
      const img = document.createElement('img');
      img.src = avatar; img.width = 24; img.height = 24; img.alt = '';
      face.appendChild(img);
      row.appendChild(face);
    }

    const col = document.createElement('span');
    col.className = 'msg__col';
    if (!out) {
      // His name on the message itself. CSS hides it on the rest of a run.
      const name = document.createElement('span');
      name.className = 'msg__name';
      name.textContent = 'Yves';
      col.appendChild(name);
    }

    const bubble = document.createElement('span');
    bubble.className = 'msg__bubble';
    if (violation) {
      score.viol++;
      const tag = document.createElement('span');
      tag.className = 'msg__tag';
      tag.textContent = `Violation #${score.viol}`;
      bubble.appendChild(tag);
      paintScore();
    }
    bubble.append(line);
    col.appendChild(bubble);
    row.appendChild(col);

    // Always before the typing indicator, which lives at the end of the thread.
    feed.insertBefore(row, typing);
    // Trim the oldest, never the typing row.
    let msgs = feed.querySelectorAll('.msg:not(.msg--typing)');
    while (msgs.length > 40) { msgs[0].remove(); msgs = feed.querySelectorAll('.msg:not(.msg--typing)'); }
    scrollFeed();
  }

  const say = (line: string, violation = false) => { setTyping(false); post(line, false, violation); };
  /** Your side. You do not type, you play, so your moves are your messages. */
  const me = (line: string) => post(line, true);

  /** The three dots. Shown while he is deciding what to do to you. */
  function setTyping(on: boolean) {
    typing.hidden = !on;
    if (on) { feed.appendChild(typing); scrollFeed(); }
  }

  /* ------------------------------------------------------------------ board */
  const winner = (g: Mark[], m: Mark) =>
    LINES.find((l) => l.every((i) => g[i] === m));

  /**
   * Never let a line of yours reach the screen.
   *
   * play() handles the ordinary case, where you complete a line with your own click. This
   * is the safety net for every other way one can appear: `slide` moves an X and can land
   * it on the end of a row, and any trick added later could do the same. It lives inside
   * paint() because paint() is the only way anything reaches the board, so putting the
   * check here makes the invariant structural instead of something each trick has to
   * remember.
   */
  function denyLine(): boolean {
    const line = winner(grid, 'X');
    if (!line) return false;
    const drop = pick(line);
    grid[drop] = '';
    /* Silently once the match is over. The mark still cannot stay, but a fresh violation
       announced after the final whistle reads as a bug rather than as him. */
    if (!over) {
      say(pick(SAY.offside), true);
      sfx('cheat');
      // After this repaint, or the flash would be cleared by it.
      setTimeout(() => flag(drop, true), 0);
    }
    return true;
  }

  function paint() {
    denyLine();
    cells.forEach((c, i) => {
      const m = grid[i];
      if (m) c.dataset.mark = m; else delete c.dataset.mark;
      c.classList.toggle('is-locked', i === locked);
      c.disabled = !!m || over || i === locked;
      c.setAttribute('aria-label',
        `Square ${i + 1}, ${m === 'X' ? 'yours' : m === 'O' ? 'Yves' : i === locked ? 'closed' : 'empty'}`);
    });
  }

  const empties = () => grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0 && i !== locked);
  const mine = () => grid.map((v, i) => (v === 'X' ? i : -1)).filter((i) => i >= 0);
  const his = () => grid.map((v, i) => (v === 'O' ? i : -1)).filter((i) => i >= 0);

  /** Flash a square as interfered with. */
  function flag(i: number, gone = false) {
    const c = cells[i];
    c.classList.remove('is-cheat', 'is-gone');
    void c.offsetWidth;                    // restart the animation on a repeat offender
    c.classList.add(gone ? 'is-gone' : 'is-cheat');
    setTimeout(() => c.classList.remove('is-gone', 'is-cheat'), 320);
  }

  /* ------------------------------------------------------------------ steps
     A house turn is a list of things that happen a beat apart, so you can watch it being
     done to you. Each step checks the epoch, so a reset mid-turn cancels the rest. */
  function run(steps: [number, () => void][]) {
    const mine = epoch;
    let t = 0;
    for (const [wait, fn] of steps) {
      t += wait;
      /* `over` as well as the epoch. A turn is several steps a beat apart, and one of them
         can end the match, which used to leave the rest of the turn still queued: he would
         say "I win", then carry on committing violations and talking about how well you
         were doing, after the match was over. */
      setTimeout(() => { if (epoch === mine && !over) fn(); }, t);
    }
  }

  /* ------------------------------------------------------------------- rig */
  /**
   * Which phase of the match we are in. This is the pacing, and it is the difference
   * between a joke you hear once and a game you stay in.
   *
   *   opening   he plays it straight and stays out of your way
   *   tease     light tricks, but he still will not take a win or block yours
   *   pressure  heavier tricks, he starts blocking, still declines his own win
   *   closing   he actually tries
   */
  const phase = () =>
    turns < PHASE.tease ? 'opening'
    : turns < PHASE.pressure ? 'tease'
    : turns < PHASE.closing ? 'pressure'
    : 'closing';

  /** Weighted pick, never the same trick twice running, nothing impossible right now. */
  function chooseTrick(): Trick | 'honest' {
    // The first house turn of a match is always clean. It has to look like a game first.
    if (turns === 0) return 'honest';
    const ph = phase();
    const band = ph === 'opening' || ph === 'tease' ? 'early' : ph === 'pressure' ? 'mid' : 'late';
    const pool: (Trick | 'honest')[] = [];
    for (const [name, w] of Object.entries(WEIGHTS) as [Trick | 'honest', typeof WEIGHTS['honest']][]) {
      if (name === 'offside' || name === 'misclick') continue;   // not chosen here
      if (name === lastTrick) continue;                          // no repeats back to back
      if ((name === 'swap' || name === 'slide' || name === 'expire') && !mine().length) continue;
      if (name === 'mercy' && !his().length) continue;
      for (let i = 0; i < w[band]; i++) pool.push(name);
    }
    return pool.length ? pick(pool) : 'honest';
  }

  /**
   * Where to put an O.
   *
   * `mode` is the whole pacing story:
   *   'loose'  never completes his own line, and never blocks yours. This is what gives
   *            you room: your two in a row survives, you go for the third, and the offside
   *            rule takes it off you. That is the loop.
   *   'block'  stops your immediate win, but still declines his own.
   *   'win'    takes it.
   *
   * Returns -1 when there is nowhere sensible, which the caller treats as a pass.
   */
  function best(mode: 'loose' | 'block' | 'win'): number {
    const free = empties();
    if (!free.length) return -1;

    const wins = free.filter((i) => { const g = [...grid]; g[i] = 'O'; return !!winner(g, 'O'); });
    const blocks = free.filter((i) => { const g = [...grid]; g[i] = 'X'; return !!winner(g, 'X'); });

    if (mode === 'win' && wins.length) return pick(wins);
    if ((mode === 'win' || mode === 'block') && blocks.length) return pick(blocks);

    /* Anything that is not a winning square for him. Under 'loose' the blocking squares
       come off the list too, so your threat is left standing on purpose. */
    let quiet = free.filter((i) => !wins.includes(i));
    if (mode === 'loose') {
      const roomy = quiet.filter((i) => !blocks.includes(i));
      if (roomy.length) quiet = roomy;
    }
    const from = quiet.length ? quiet : free;
    return [4, 0, 2, 6, 8, 1, 3, 5, 7].find((i) => from.includes(i)) ?? from[0];
  }

  /** True when he had a winning square in front of him and walked past it. */
  let passedUp = false;

  function placeO(): boolean {
    const ph = phase();
    const mode = ph === 'closing' ? 'win' : ph === 'pressure' ? 'block' : 'loose';
    const free = empties();
    passedUp = mode !== 'win'
      && free.some((i) => { const g = [...grid]; g[i] = 'O'; return !!winner(g, 'O'); });
    const i = best(mode);
    if (i < 0) return false;
    grid[i] = 'O';
    sfx('house');
    return true;
  }

  /** Every so often, tell you he let you off. Not every time, or it stops landing. */
  function maybeNearMiss() {
    if (passedUp && Math.random() < 0.55) say(pick(SAY.nearMiss));
  }

  /* ------------------------------------------------------------- the house */
  function houseTurn() {
    if (over) return;
    status.textContent = SAY.status.thinking;
    setTyping(true);

    const trick = chooseTrick();
    lastTrick = trick;
    locked = -1;

    /* Out of patience. He clears a line and takes it, so a long match still ends. */
    if (turns >= PATIENCE - 1) {
      return run([[660, () => {
        const line = LINES.find((l) => l.filter((i) => grid[i] !== 'X').length >= 2) ?? LINES[0];
        line.forEach((i) => { grid[i] = 'O'; });
        say(pick(SAY.time), true);
        sfx('cheat');
        paint();
        finish(line);
      }]]);
    }

    /* How long the three dots are readable for. The steps below already pause before he
       acts, but only by about 400ms, which is long enough to feel like thinking and too
       short to see a typing indicator. This buys the dots a beat without making a turn
       feel slow. */
    const THINK = 240;
    const steps: [number, () => void][] = [];

    switch (trick) {
      case 'honest':
        steps.push([420, () => {
          placeO();
          /* Early on he is not cheating, so there is nothing to announce. A loose line
             keeps him present without pretending something happened. */
          say(pick(phase() === 'opening' || phase() === 'tease' ? SAY.loose : SAY.honest));
          maybeNearMiss();
          paint(); after();
        }]);
        break;

      /* He gives a square back. The only trick that helps you, and the reason a match can
         go long enough to feel like one. */
      case 'mercy': {
        const gift = pick(his());
        steps.push([420, () => { flag(gift, true); say(pick(SAY.mercy)); sfx('house'); }]);
        steps.push([320, () => { grid[gift] = ''; placeO(); paint(); after(); }]);
        break;
      }

      case 'expire': {
        const victim = pick(mine());
        steps.push([360, () => { flag(victim, true); say(pick(SAY.expire), true); sfx('cheat'); }]);
        steps.push([300, () => { grid[victim] = ''; placeO(); maybeNearMiss(); paint(); after(); }]);
        break;
      }

      case 'maintenance': {
        const free = empties();
        const shut = free.length ? pick(free) : pick(mine());
        steps.push([360, () => {
          flag(shut, !!grid[shut]);
          say(pick(SAY.maintenance).replace('{n}', String(shut + 1)), true);
          sfx('cheat');
        }]);
        steps.push([300, () => { grid[shut] = ''; locked = shut; placeO(); paint(); after(); }]);
        break;
      }

      case 'double':
        steps.push([380, () => { placeO(); paint(); say(pick(SAY.double), true); sfx('cheat'); }]);
        steps.push([850, () => { placeO(); paint(); after(); }]);
        break;

      case 'swap': {
        const victim = pick(mine());
        steps.push([360, () => { flag(victim); say(pick(SAY.swap), true); sfx('cheat'); }]);
        steps.push([300, () => { grid[victim] = 'O'; placeO(); maybeNearMiss(); paint(); after(); }]);
        break;
      }

      case 'slide': {
        const from = pick(mine());
        /* Not onto the end of one of your own rows. The guard in paint() would catch it,
           but landing your mark on a winning square only to take it straight back reads as
           a glitch rather than as him. */
        const to = NEXT_TO[from].filter((i) => {
          if (grid[i] || i === locked) return false;
          const g = [...grid]; g[from] = ''; g[i] = 'X';
          return !winner(g, 'X');
        });
        if (!to.length) { steps.push([420, () => { placeO(); say(pick(SAY.honest)); paint(); after(); }]); break; }
        const dest = pick(to);
        steps.push([360, () => { flag(from); say(pick(SAY.slide), true); sfx('cheat'); }]);
        steps.push([300, () => { grid[from] = ''; grid[dest] = 'X'; placeO(); paint(); after(); }]);
        break;
      }

      default:
        steps.push([420, () => { placeO(); say(pick(SAY.honest)); paint(); after(); }]);
    }

    if (steps.length) steps[0][0] += THINK;
    run(steps);
  }

  /** After the house has moved: has he won, is the board full, otherwise your turn. */
  function after() {
    turns++;
    const line = winner(grid, 'O');
    if (line) return finish(line);

    if (!empties().length) {
      /* The board is full and he has no line. Before, that ended the match: one of yours
         went and he took the square. That made every game short, which is the thing Yves
         asked to fix. Now, until he is nearly out of patience, a full board is just a full
         board, and he clears room so the match carries on. He only converts it into a win
         once CLOSING has arrived. */
      const victims = mine();
      if (!victims.length) return finish(undefined);

      if (turns < PHASE.closing) {
        // Three of yours go. Rude, but it is the reason you get to keep playing.
        const gone = [...victims].sort(() => Math.random() - 0.5).slice(0, 3);
        return run([[520, () => {
          gone.forEach((i) => flag(i, true));
          say(pick(SAY.sweep), true);
          sfx('cheat');
        }], [340, () => {
          gone.forEach((i) => { grid[i] = ''; });
          paint();
          status.textContent = SAY.status.again;
          armIdle();
        }]]);
      }

      const i = pick(victims);
      return run([[420, () => {
        flag(i, true);
        say(pick(SAY.draw), true);
        sfx('cheat');
      }], [320, () => {
        grid[i] = 'O';
        paint();
        const l = winner(grid, 'O');
        if (l) finish(l); else finish(undefined);
      }]]);
    }

    status.textContent = SAY.status.again;
    paint();
    armIdle();
  }

  /* ------------------------------------------------------------------ ends */
  function finish(line: number[] | undefined) {
    over = true;
    clearTimeout(idleTimer);
    setTyping(false);
    line?.forEach((i) => cells[i].classList.add('is-win'));

    const style = Math.random() < 0.25;
    score.yves += style ? 2 : 1;
    say(pick(SAY.win));
    if (style) say(SAY.style);
    sfx('win');

    status.textContent = SAY.status.over;
    paintScore();
    save();
    paint();
    actions.hidden = false;
    scrollFeed();          // the buttons just took the feed's space, so scroll again
  }

  function reset() {
    epoch++;
    clearTimeout(idleTimer);
    grid = Array(9).fill('');
    locked = -1; turns = 0; over = false; appealed = false; lastTrick = '';
    score.match++;
    cells.forEach((c) => c.classList.remove('is-win', 'is-cheat', 'is-gone'));
    feed.querySelectorAll('.msg:not(.msg--typing)').forEach((n) => n.remove());
    setTyping(false);
    actions.hidden = true;
    // One appeal per match, so a new match gets a fresh one.
    actions.querySelector<HTMLButtonElement>('[data-ttt="appeal"]')!.disabled = false;
    status.textContent = SAY.status.you;
    say(pick(SAY.reset));
    paintScore();
    save();
    paint();
    sfx('reset');
  }

  /* ------------------------------------------------------------- your turn */
  function armIdle() {
    clearTimeout(idleTimer);
    const mine = epoch;
    idleTimer = window.setTimeout(() => {
      if (epoch !== mine || over) return;
      const free = empties();
      if (!free.length) return;
      // The worst square available, naturally.
      const worst = free[free.length - 1];
      say(pick(SAY.idle), true);
      play(worst, true);
    }, IDLE_S * 1000);
  }

  function play(i: number, forced = false) {
    if (over) return;
    /* A square that will not take your mark still gets a reply, so the thread never goes
       quiet on a click that did something. */
    if (grid[i] || i === locked) {
      if (!forced) me(pick(YOU.taken));
      return;
    }
    clearTimeout(idleTimer);

    /* You say the square you actually clicked, before any drift, so when he moves it you
       are on record having called the other one. */
    if (!forced) me(`${YOU.square[i]}.`);

    /* Your click drifts one square over. Never on your first move of a match, because it
       would read as a broken board rather than as him. */
    let target = i;
    if (!forced && turns > 0 && lastTrick !== 'misclick' && Math.random() < 0.12) {
      const near = NEXT_TO[i].filter((n) => !grid[n] && n !== locked);
      if (near.length) {
        target = pick(near);
        lastTrick = 'misclick';
        say(pick(SAY.misclick), true);
        flag(target);
        sfx('cheat');
      }
    }

    grid[target] = 'X';
    sfx('place');

    /* Invariant 1: your line never gets to paint. Checked and corrected before the
       repaint below, so the winning row is never on screen for even one frame. */
    const line = winner(grid, 'X');
    if (line) {
      const drop = pick(line);
      grid[drop] = '';
      say(pick(SAY.offside), true);
      paint();
      flag(drop, true);
      sfx('cheat');
      return run([[560, houseTurn]]);
    }

    paint();
    run([[260, houseTurn]]);
  }

  /* --------------------------------------------------------------- listeners */
  board.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (cell) play(Number(cell.dataset.cell));
  });

  actions.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ttt]');
    if (!b) return;
    if (b.dataset.ttt === 'reset') { me(YOU.again); return reset(); }
    // Appeal. Once per match, and it costs you.
    if (appealed) return;
    appealed = true;
    (b as HTMLButtonElement).disabled = true;
    score.yves++;
    me(YOU.appeal);
    say(pick(SAY.appeal), true);
    sfx('deny');
    paintScore();
    save();
  });

  paintScore();
  paint();
  say(pick(SAY.opener));
  armIdle();
}

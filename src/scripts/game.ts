/** Tic tac toe. You are X, the computer is O and plays a simple best-effort move.
    Fetched the first time the game window opens. See scripts/lazy.ts. */
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

type Mark = 'X' | 'O' | '';

export function init() {
  const board = document.getElementById('ttt-board');
  const status = document.getElementById('ttt-status');
  if (!board || !status) return;
  const cells = [...board.querySelectorAll<HTMLButtonElement>('.ttt__cell')];
  let grid: Mark[] = Array(9).fill('');
  let over = false;

  const winner = (g: Mark[]) => LINES.find((l) => g[l[0]] && g[l[0]] === g[l[1]] && g[l[1]] === g[l[2]]);

  const paint = () => cells.forEach((c, i) => { c.textContent = grid[i]; c.disabled = !!grid[i] || over; });

  const finish = (line: number[] | undefined, text: string) => {
    over = true;
    status.textContent = text;
    line?.forEach((i) => cells[i].classList.add('is-win'));
    paint();
  };

  /** Win if you can, block if you must, otherwise take centre, a corner, then anything. */
  const pick = (): number => {
    const free = grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    for (const mark of ['O', 'X'] as Mark[]) {
      for (const i of free) {
        const test = [...grid]; test[i] = mark;
        if (winner(test)) return i;
      }
    }
    return [4, 0, 2, 6, 8, 1, 3, 5, 7].find((i) => free.includes(i)) ?? free[0];
  };

  const turn = (i: number) => {
    if (over || grid[i]) return;
    grid[i] = 'X'; paint();
    let line = winner(grid);
    if (line) return finish(line, 'You win.');
    if (!grid.includes('')) return finish(undefined, 'A draw.');

    grid[pick()] = 'O'; paint();
    line = winner(grid);
    if (line) return finish(line, 'The computer wins.');
    if (!grid.includes('')) return finish(undefined, 'A draw.');
    status.textContent = 'Your move.';
  };

  board.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (cell) turn(Number(cell.dataset.cell));
  });

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-ttt-reset]')) return;
    grid = Array(9).fill(''); over = false;
    cells.forEach((c) => c.classList.remove('is-win'));
    status.textContent = 'Your move. You are X.';
    paint();
  });

  paint();
}

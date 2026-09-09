/**
 * Everything Yves says while cheating at tic tac toe, and how often he cheats.
 *
 * Separate from the logic on purpose: this is the part worth editing, and editing it
 * should never mean reading a rules engine. Every line is his, deadpan, never gloating,
 * always with a reason. He is not pretending to be fair. He is pretending the rules agree
 * with him.
 *
 * Writing rules from CLAUDE.md apply here like anywhere else: standard English, no em
 * dashes, short. Two sentences beats five, and one beats two.
 *
 * This file is only reached through the lazy game chunk, so none of it is on the page
 * load. Add lines freely.
 */

/** Each trick, its weight, and what he says while doing it. */
export type Trick =
  | 'expire' | 'maintenance' | 'double' | 'swap' | 'slide' | 'misclick' | 'offside'
  | 'mercy';

/**
 * Your side of the conversation.
 *
 * The panel is a chat, so it needs two people in it. You do not type, you play, and these
 * are your moves said out loud: you name the square you took, he replies with what he has
 * done about it. Short, because nobody narrates their own tic tac toe at length.
 */
export const YOU = {
  /** Squares 0 to 8, named the way a person would say them out loud. */
  square: [
    'Top left', 'Top middle', 'Top right',
    'Middle left', 'Centre', 'Middle right',
    'Bottom left', 'Bottom middle', 'Bottom right',
  ],
  /** When a square will not take your mark. */
  taken: ['That one is taken.', 'Cannot click that.'],
  appeal: 'I would like to appeal.',
  again: 'Again.',
} as const;

export const SAY = {
  /** The line under his name. */
  status: {
    you: 'Your move. You are X.',
    thinking: 'Thinking.',
    again: 'Your move.',
    over: 'Match over.',
  },

  /** The first thing he says, so the chat is never an empty box. */
  opener: [
    'You are X. Go first, I insist.',
    'X is you. I will keep score.',
    'Your move. I am not going anywhere.',
  ],

  /** He plays it straight. Always the first move of a match, sometimes later. */
  honest: [
    'Fine. A normal move.',
    'No tricks. This one is clean.',
    'Nothing to see here.',
  ],

  /** An X vanishes before his O lands. */
  expire: [
    'That X has expired.',
    'Housekeeping.',
    'That square was never yours.',
    'It was there. Now it is not.',
  ],

  /** A square closes for one turn. Anything on it is removed. */
  maintenance: [
    'Square {n} is under maintenance.',
    'Closed for cleaning. Try again later.',
    'Square {n} is being resurfaced.',
  ],

  /** He plays twice. The first line, then the second. */
  double: [
    'Your turn. Actually, one more.',
    'That was a practice move. This one counts.',
    'Two for one. My board, my rules.',
  ],

  /** One of your X marks becomes an O. */
  swap: [
    'That X was an O the whole time.',
    'Typo. I fixed it for you.',
    'Look again. It has always been mine.',
  ],

  /** An X moves to a neighbouring empty square. */
  slide: [
    'The board shifted. Not my fault.',
    'Your X moved. Blame the wind.',
    'Things settle. It happens.',
  ],

  /** Your click lands one square over. */
  misclick: [
    'Your click drifted. I put it where it landed.',
    'That is where you clicked. I watched you.',
  ],

  /** You completed a line, so one of yours is removed in the same tick. */
  offside: [
    'Three in a row? One of those was offside.',
    'Nice line. One of them does not count.',
    'New rule: four in a row wins. You have three.',
    'That would have been a win last season.',
  ],

  /** He hands one of his own squares back. Generosity, and a way to keep you in it. */
  mercy: [
    'Have that one back. I am feeling generous.',
    'Take it. I was not using it.',
    'A gift. Do not read anything into it.',
    'I am giving you a chance. One.',
  ],

  /** He had the winning square and did not take it. You should notice, and worry. */
  nearMiss: [
    'I could have taken that. I am not finished with you yet.',
    'I saw it. I am enjoying myself too much.',
    'That would have ended it. Where is the fun.',
    'Not yet. You are doing so well.',
  ],

  /** Filler while he is playing it straight and letting you build. */
  loose: [
    'Go on then.',
    'Take your time.',
    'Interesting. Carry on.',
    'I am watching.',
    'You are getting somewhere. Probably.',
  ],

  /** The board filled and he is making room rather than ending it. */
  sweep: [
    'The board was getting crowded. I have tidied it.',
    'Spring cleaning. Play on.',
    'Too full. I have opened it up for you.',
  ],

  /** You left it too long and he moved for you. */
  idle: [
    'You took too long, so I moved for you.',
    'I got bored and played your turn.',
  ],

  /** The board filled with no line for him. */
  draw: [
    'A draw. I do not do draws.',
    'Draws are not in the rules. I checked just now.',
  ],

  /** The mercy rule: he has run out of patience and wins on time. */
  time: [
    'We are out of time. I win on time.',
    'Time. That is the whole game, and I was ahead.',
  ],

  /** He wins. */
  win: [
    'I win. Again.',
    'A fair result, checked by me.',
    'Talent, plus some editing.',
    'I would like to thank the referee. Me.',
    'That went well. For me.',
  ],

  /** Occasionally the win is worth two. */
  style: 'One extra point, for style.',

  /** You appealed. */
  appeal: [
    'Appeal denied. Processing fee, one point, to me.',
    'Your appeal was read. By me. Denied.',
    'Denied. You can appeal the denial, for a fee.',
  ],

  /** A new match. */
  reset: [
    'Again. Same rules.',
    'New board. Same outcome.',
    'Go on then.',
  ],
} as const;

/**
 * How likely each trick is, and how that changes as the match goes on.
 *
 * Three phases, read off the house turn count against PHASE below. Early he is mostly
 * honest, because a game that cheats immediately is not a game. Mid he starts helping
 * himself. Late he stops pretending. `mercy` is the opposite of the others, and it is
 * deliberately an early and mid thing: handing a square back is how you stay in it.
 *
 * `offside` is not here because it is never chosen. It fires the moment you complete a
 * line, every time, because letting your win paint for even one frame gives it away.
 * `misclick` is not chosen here either, it is rolled on your click.
 */
export const WEIGHTS: Record<Trick | 'honest', { early: number; mid: number; late: number }> = {
  honest:      { early: 9, mid: 3, late: 1 },
  /* Nothing that takes one of your marks in the early band. The offside rule already does
     that every time you get three, and stacking `expire` on top of it left you with one X
     on the board, which is the opposite of feeling close to winning. */
  expire:      { early: 0, mid: 3, late: 4 },
  maintenance: { early: 1, mid: 2, late: 3 },
  double:      { early: 0, mid: 2, late: 4 },
  swap:        { early: 0, mid: 1, late: 3 },
  slide:       { early: 1, mid: 2, late: 2 },
  mercy:       { early: 3, mid: 2, late: 0 },
  misclick:    { early: 0, mid: 0, late: 0 },
  offside:     { early: 0, mid: 0, late: 0 },
};

/**
 * How the match is paced.
 *
 * The old version had him winning in about three turns, which is a joke you hear once.
 * Now he takes his time. Through OPENING and TEASE he will not take a winning square and
 * will not block yours, so you build threats, get to three in a row, and have it taken off
 * you. That is the loop worth staying for. Only in CLOSING does he actually try, and
 * PATIENCE is the backstop so a match cannot run forever.
 */
export const PHASE = { tease: 2, pressure: 6, closing: 11 };

/** Seconds of no move before he plays your turn for you. */
export const IDLE_S = 20;

/** He wins by this house turn at the latest, whatever the board says. */
export const PATIENCE = 15;

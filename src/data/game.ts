/** Copy for the lazy tic tac toe app. Kept away from the rules so it can be edited alone. */
export const YOU = {
  square: [
    'Top left', 'Top middle', 'Top right',
    'Middle left', 'Centre', 'Middle right',
    'Bottom left', 'Bottom middle', 'Bottom right',
  ],
  taken: ['That one is taken.', 'Pick another square.'],
  appeal: 'I would like to appeal.',
  again: 'Again.',
} as const;

export const SAY = {
  status: { you: 'Your move. You are X.', thinking: 'Thinking.', review: 'Reviewing the result.', over: 'Match over.' },
  opener: [
    'You are X. Go first. It will not help.',
    'Your move. I keep the score, so relax.',
    'You can start. Take your time. It changes nothing.',
  ],
  move: [
    'Your move.',
    'Go on.',
    'I see what you are doing. It is not working.',
    'Next.',
    'Interesting. Wrong, but interesting.',
    'Take your time. I have all day and all the points.',
  ],
  near: ['You nearly had me. Nearly.', 'I saw that. I am choosing not to worry.', 'That is close. Close is not a point.'],
  /* Said when he has just blocked your line. */
  block: ['No.', 'I saw that from the first square.', 'Nice try. I mean that. It was a try.'],
  /* A full board with no winner. The Yves rule: draws go to Yves. */
  draw: [
    'Draw. Draws go to Yves. Those are the rules.',
    'Nine squares, no winner. That is mine, then.',
    'A draw. Under the Yves rule that is a point to Yves. I am Yves.',
  ],
  convert: [
    'That square was mine. I checked.',
    'Small correction. That one is an O.',
    'I found an error on the board. Fixed.',
    'You put an X on my square. I have moved it for you.',
  ],
  review: [
    'I have reviewed the result. I win.',
    'That line needs a second look. I win.',
    'The result has been corrected. I win.',
    'Reviewed. Upheld. Mine.',
  ],
  win: ['I win.', 'That went well. For me.', 'Fair result, checked by me.', 'You left that open. I did not.', 'Three in a row. Count them.'],
  idleWarn: ['Still there?', 'I am waiting. I can wait.', 'Ten seconds. Then I play for you.'],
  idle: ['You took too long, so I placed your X. Badly.', 'I made one move for you. You are welcome.'],
  /* One sequence per appeal, sent as separate messages with a pause between. The last
     entry serves every appeal after it. They get shorter, which is the point. */
  appeal: [
    ['Appeal received.', 'Why? Is it the square? The square was mine.', 'I have thought about it.', 'Denied. One point to me for the paperwork.'],
    ['Another one.', 'Is this about the same square? It is still mine.', 'Denied. Same fee.'],
    ['You can keep doing this. Each one costs a point.', 'Denied.'],
    ['I did not read it.', 'Denied.'],
  ],
  reset: ['Again. Same rules.', 'New board. Your move. Same ending.', 'Go on then.'],
} as const;

export const IDLE_WARN_S = 50;
export const IDLE_MOVE_S = 60;
/** How often, per game, Yves lets a line through on purpose so he has something to review. */
export const SLIP_RATE = 0.25;

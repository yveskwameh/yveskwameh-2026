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
  opener: ['You are X. Go first.', 'Your move. I will keep score.', 'You can start. I am ready.'],
  move: ['Your move.', 'Go on.', 'I see what you are doing.', 'That was close.'],
  near: ['You nearly had me.', 'I saw that.', 'That is getting close.'],
  review: [
    'I have reviewed the result. I win.',
    'That line needs a second look. I win.',
    'The result has been corrected. I win.',
  ],
  convert: [
    'That square was mine. I checked.',
    'Small correction. That one is an O.',
    'I found an error on the board. Fixed.',
  ],
  win: ['I win.', 'That went well. For me.', 'Fair result, checked by me.'],
  idleWarn: ['Still there?', 'I am waiting.', 'You have ten seconds.'],
  idle: ['You took too long, so I placed your X.', 'I made one move for you. Carry on.'],
  appeal: ['Appeal denied. One point to me.', 'I read the appeal. Denied.'],
  reset: ['Again. Same rules.', 'New board. Your move.', 'Go on then.'],
} as const;

export const IDLE_WARN_S = 50;
export const IDLE_MOVE_S = 60;

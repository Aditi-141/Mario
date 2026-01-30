export const WORLD = {
  w: 960,
  h: 540,
  gravity: 2400,
  maxFall: 2200,
  moveSpeed: 320,
  airMoveSpeed: 280,
  jumpVel: 800,
  friction: 0.86,
  airFriction: 0.96,
  deathY: 600,

} as const;

export const MAX_DT = 0.033;
export const COYOTE_TIME = 0.12;
export const MAX_JUMPS = 2;

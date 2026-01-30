import type { Level } from "./types";
import { WORLD } from "./constants";

export const GROUND_Y = 470;
const TILE = 40;

/**
 * Creates Map for game
 * @returns returns map
 */
export function createLevel(): Level {
  const pipe = {
    x: 820,
    y: GROUND_Y - 120,
    w: 64,
    h: 120,
    kind: "pipe" as const,
  };

  return {
    platforms: [
      { x: 0, y: GROUND_Y, w: WORLD.w, h: WORLD.h - GROUND_Y },
      ...row(300, 300, 3),
      pipe,
    ],
    blocks: [
      block(40, 300),
      block(340, 300),
      block(420, 300),
      block(460, 80),
    ],
    coins: coinsRow(320, 240, 4),
  };
}

const row = (x: number, y: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    x: x + i * TILE * 2,
    y,
    w: TILE,
    h: TILE,
  }));

const block = (x: number, y: number) => ({
  x,
  y,
  w: TILE,
  h: TILE,
  hit: false,
});

const coinsRow = (x: number, y: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    x: x + i * 60,
    y,
    r: 10,
    taken: false,
  }));

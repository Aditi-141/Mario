import type { Rect } from "./types";

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const aabbOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

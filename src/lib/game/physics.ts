import { clamp } from "./math";
import { WORLD } from "./constants";
import type { Rect } from "./types";

export function applyGravity(body: { vy: number }, dt: number) {
  body.vy = clamp(body.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);
}

export function integrateX(body: Rect & { vx: number }, dt: number) {
  body.x += body.vx * dt;
  body.x = clamp(body.x, 0, WORLD.w - body.w);
}

export function integrateY(body: Rect & { vy: number }, dt: number) {
  body.y += body.vy * dt;
  body.y = clamp(body.y, -2000, WORLD.h - body.h);
}

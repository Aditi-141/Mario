import { clamp } from "./math";
import { WORLD } from "./constants";
import type { Rect } from "./types";

/**
 * This fucntion applies gravity to object
 * @param body coordinates of object
 * @param dt time of object moving.
 */
export function applyGravity(body: { vy: number }, dt: number) {
  body.vy = clamp(body.vy + WORLD.gravity * dt, -9999, WORLD.maxFall);
}

/**
 * Moves a rectangle horizontally according to its velocity and the elapsed time.
 * @param body Coordinates of object
 * @param dt time of object moving
 */
export function integrateX(body: Rect & { vx: number }, dt: number) {
  body.x += body.vx * dt;
  body.x = clamp(body.x, 0, WORLD.w - body.w);
}

/**
 * Moves a rectangle vertically according to its velocity and the elapsed time.
 * @param body Coordinates of Object
 * @param dt time of object moving
 */
export function integrateY(body: Rect & { vy: number }, dt: number) {
  body.y += body.vy * dt;
  body.y = clamp(body.y, -2000, WORLD.h - body.h);
}

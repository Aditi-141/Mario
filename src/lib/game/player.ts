import type { Player, Level, AudioHandle, PlayerInput } from "./types";
import { WORLD, MAX_JUMPS, COYOTE_TIME } from "./constants";
import { resolveX, resolveY } from "./collision";
import { applyGravity, integrateX, integrateY } from "./physics";

export type PlayerAudio = Pick<AudioHandle, "jump" | "land" | "coin" | "bump"|"ensure"|"resume">;

export function createPlayer(): Player {
  return {
    x: 60,
    y: 400,
    w: 34,
    h: 44,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    coyote: 0,
    jumpsLeft: MAX_JUMPS,
  };
}

export function respawnPlayer(p: Player) {
  Object.assign(p, createPlayer());
}

export function updatePlayer(
  player: Player,
  level: Level,
  input: PlayerInput,
  audio: PlayerAudio,
  dt: number
) {
  const accel = player.grounded ? WORLD.moveSpeed : WORLD.airMoveSpeed;
  const targetVx = input.left ? -accel : input.right ? accel : 0;
  const smoothing = player.grounded ? 0.2 : 0.1;

  player.vx += (targetVx - player.vx) * smoothing;
  player.vx *= Math.pow(
    player.grounded ? WORLD.friction : WORLD.airFriction,
    dt / (1 / 60)
  );
  if (Math.abs(player.vx) < 1) player.vx = 0;

  if (input.left) player.facing = -1;
  if (input.right) player.facing = 1;

  applyGravity(player, dt);

  player.coyote = player.grounded
    ? COYOTE_TIME
    : Math.max(0, player.coyote - dt);

  if (input.jumpPressedThisFrame) {
    input.jumpPressedThisFrame = false;
    if (player.grounded || player.coyote > 0 || player.jumpsLeft > 0) {
      player.vy = -WORLD.jumpVel;
      player.grounded = false;
      player.coyote = 0;
      player.jumpsLeft--;
      audio.jump();
    }
  }

  integrateX(player, dt);
  resolveX(player, level);

  integrateY(player, dt);
  resolveY(player, level, audio);
}

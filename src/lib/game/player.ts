import type { Player, Level, AudioHandle, PlayerInput } from "./types";
import { WORLD, MAX_JUMPS, COYOTE_TIME } from "./constants";
import { resolveX, resolveY } from "./collision";
import { applyGravity, integrateX, integrateY } from "./physics";

export type PlayerAudio = Pick<AudioHandle, "jump" | "land" | "coin" | "bump"|"ensure"|"resume">;

/**
 * This function helps to create.
 * @returns returns players attributes.
 */
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
    lives: 3,
    invincible:0
  };
}

/**
 * This function helps to spawn the Player
 * @param p players attributes
 */
export function respawnPlayer(p: Player) {
  
  Object.assign(p, createPlayer());
}


/**
 * This function helps to updates coordinates of players movement
 * @param player player attributes
 * @param level map coordinates
 * @param input input from the user to move player
 * @param audio sound created upon different actions
 * @param dt delta time which is difference between from last updated frame
 */
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

  // Gravity
  applyGravity(player, dt);

  // Coyote time
  player.coyote = player.grounded
    ? COYOTE_TIME
    : Math.max(0, player.coyote - dt);

  // Jumping
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

  if (player.invincible > 0) {
    player.invincible -= dt;
    if (player.invincible < 0) player.invincible = 0;
  }


  // Physics integration
  integrateX(player, dt);
  resolveX(player, level);

  integrateY(player, dt);
  resolveY(player, level, audio);

  // Refill jumps on landing
  if (player.grounded) {
    player.jumpsLeft = MAX_JUMPS;
  }
}


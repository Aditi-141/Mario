import React, { useCallback, useRef } from "react";
import { GameCanvas } from "./ui/card";
import { GameOverlay } from "./game-overlay";
import type { GameShellProps} from "../lib/game/types";
import { Button } from "./ui/button";


const isLeft = (code: string) => code === "ArrowLeft" || code === "KeyA";
const isRight = (code: string) => code === "ArrowRight" || code === "KeyD";
const isJump = (code: string) => code === "Space" || code === "ArrowUp" || code === "KeyW";

export function GameShell({
  running,
  canvasRef,
  onSurface,
  onStart,
  onReset,
  onStop,
  onInput,
}: GameShellProps) {
  const focusRef = useRef<HTMLDivElement | null>(null);

  const focusGame = useCallback(() => {
    focusRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.repeat) return;
      onInput((s) => {
        if (isLeft(e.code)) return { ...s, left: true };
        if (isRight(e.code)) return { ...s, right: true };
        if (isJump(e.code)) return { ...s, jumpHeld: true, jumpPressedThisFrame: true };
        return s;
      });
    },
    [onInput]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      onInput((s) => {
        if (isLeft(e.code)) return { ...s, left: false };
        if (isRight(e.code)) return { ...s, right: false };
        if (isJump(e.code)) return { ...s, jumpHeld: false };
        return s;
      });
    },
    [onInput]
  );

  const handleStart = useCallback(() => {
    onStart();
    focusGame();
  }, [onStart, focusGame]);

  const handleReset = useCallback(() => {
    onReset();
    focusGame();
  }, [onReset, focusGame]);

  return (
    <div className="grid h-full place-items-center p-4">
      <div
        ref={focusRef}
        tabIndex={0}
        onPointerDown={focusGame}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className="relative w-[min(1000px,96vw)] aspect-video overflow-hidden rounded-[18px] border-2 border-white/10 bg-[#0b1020] shadow-[0_10px_30px_rgba(0,0,0,0.35)] outline-none"
      >
        <GameCanvas canvasRef={canvasRef} onSurface={onSurface} />

        {!running ? <GameOverlay onStart={handleStart} onReset={handleReset} /> : null}

        {running ? (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button onClick={onStop} className="cursor-pointer rounded-xl border border-white/20 bg-transparent px-3 py-2.5 font-bold text-white">
              Pause
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

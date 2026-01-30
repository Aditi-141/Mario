import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GameShell } from "./components/game-shell";
import { createEngine } from "./lib/game/engine";
import type { EngineHandle, InputState, RenderSurface } from "./lib/game/types";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineHandle | null>(null);

  const surfaceRef = useRef<RenderSurface | null>(null);

  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState({ coins: 0, grounded: false });

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressedThisFrame: false,
    jump: false,
    attack: false,
    moveX: 0,
    moveY: 0,
  });

  const handleSurface = useCallback((s: RenderSurface | null) => {
    surfaceRef.current = s;
  }, []);

  const engine = useMemo(() => {
    if (!engineRef.current) {
      engineRef.current = createEngine({
        getSurface: () => surfaceRef.current,
        getInput: () => inputRef.current,
        onHud: (next) => setHud(next),
        onRunning: (r) => setRunning(r),
      });
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    return () => engine.stop();
  }, [engine]);

  return (
    <GameShell
      running={running}
      hud={hud}
      canvasRef={canvasRef}
      onSurface={handleSurface}
      onStart={() => {
        engine.reset();
        engine.start();
      }}
      onReset={() => engine.reset()}
      onStop={() => engine.stop()}
      onInput={(updater) => {
        inputRef.current = updater(inputRef.current);
      }}
    />
  );
}

import { useMemo, useRef, useState } from "react";
import { GameShell } from "./components/game-shell";
import { createEngine, type EngineHandle } from "./lib/game/engine";
import type { InputState } from "./lib/game/types";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineHandle | null>(null);

  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState({ coins: 0, grounded: false });

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressedThisFrame: false,
  });

  const engine = useMemo(() => {
    // Create engine once
    if (!engineRef.current) {
      engineRef.current = createEngine({
        getCanvas: () => canvasRef.current,
        getInput: () => inputRef.current,
        onHud: (next) => setHud(next),
        onRunning: (r) => setRunning(r),
      });
    }
    return engineRef.current;
  }, []);

  return (
    <GameShell
      running={running}
      hud={hud}
      canvasRef={canvasRef}
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

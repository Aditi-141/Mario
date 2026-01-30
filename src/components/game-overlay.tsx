//Start Screen Component
import { Button } from "./ui/button";

type GameOverlayProps = {
  onStart: () => void;
  onReset: () => void;
};

export function GameOverlay({ onStart}: GameOverlayProps) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/45 p-4 text-center backdrop-blur-[2px]">
      <div className="max-w-[520px]">
        <div className="mb-2.5 text-[28px] font-extrabold text-white">
          Mario
        </div>

        <div className="flex justify-center gap-2.5">
          <Button
            onClick={onStart}
          >
            Start
          </Button>
        </div>
      </div>
    </div>
  );
}

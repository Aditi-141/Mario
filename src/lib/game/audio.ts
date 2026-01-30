import type { AudioHandle,Window } from "./types";



export function createAudio(): AudioHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ready = false;

  /**
   * Initializes the web audio system if it hasn't been initialized yet, setting up an AudioContext with a master gain node at 25% volume, and returns true if successful or false if the browser doesn't support audio.
   * @returns boolean value
   */
  function ensure() {
    if (ready) return true;
    const AudioCtx =
      window.AudioContext || (window as Window).webkitAudioContext;
    if (!AudioCtx) return false;

    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    ready = true;
    return true;
  }

  function resume() {
    ctx?.resume?.();
  }

  function playTone(opts: {
    type?: OscillatorType;
    freq: number;
    dur: number;
    gain: number;
    sweepTo?: number;
  }) {
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, now);

    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opts.sweepTo),
        now + opts.dur
      );
    }

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(opts.gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + opts.dur);

    osc.connect(g);
    g.connect(master);

    osc.start(now);
    osc.stop(now + opts.dur + 0.02);
  }

  return {
    ensure,
    resume,
    jump: () =>
      playTone({ type: "square", freq: 320, sweepTo: 820, dur: 0.12, gain: 0.45 }),
    land: () =>
      playTone({ type: "triangle", freq: 140, sweepTo: 90, dur: 0.08, gain: 0.35 }),
    coin: () => {
      playTone({ freq: 880, sweepTo: 1320, dur: 0.1, gain: 0.4 });
      playTone({ freq: 1320, sweepTo: 1760, dur: 0.08, gain: 0.25 });
    },
    bump: () =>
      playTone({ type: "square", freq: 520, sweepTo: 260, dur: 0.06, gain: 0.25 }),
  };
}

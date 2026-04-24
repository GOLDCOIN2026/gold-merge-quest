// Lightweight WebAudio SFX — no asset downloads required.
// Generates short tones for merge, spawn, reward, error.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.15, slide = 0) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const SFX = {
  merge(level: number) {
    const base = 380 + level * 70;
    tone(base, 0.09, "triangle", 0.18, 220);
    setTimeout(() => tone(base * 1.5, 0.1, "sine", 0.14, 180), 50);
  },
  spawn() { tone(520, 0.07, "square", 0.08, -80); },
  pickup() { tone(680, 0.05, "sine", 0.1); },
  drop() { tone(280, 0.06, "sine", 0.08); },
  coin() { tone(880, 0.06, "triangle", 0.12); setTimeout(() => tone(1320, 0.08, "triangle", 0.1), 40); },
  reward() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, "triangle", 0.16), i * 80));
  },
  error() { tone(180, 0.18, "sawtooth", 0.1, -60); },
  levelUp() {
    [523, 659, 784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.13, "triangle", 0.18), i * 70));
  },
};

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }
/** Required to unlock audio on iOS/Android — call from a user gesture. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

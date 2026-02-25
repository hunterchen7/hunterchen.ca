let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Create a short burst of filtered noise (thud-like) */
function noiseThud(
  ctx: AudioContext,
  duration: number,
  volume: number,
  frequency: number,
  q: number,
) {
  const t = ctx.currentTime;
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency, t);
  filter.Q.setValueAtTime(q, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(t);
  source.stop(t + duration);
}

/** Soft thud — piece placed on vinyl mat */
export function playMoveSound() {
  const ctx = getContext();
  noiseThud(ctx, 0.08, 0.15, 300, 1);
}

/** Heavier thud — piece slapped down on capture */
export function playCaptureSound() {
  const ctx = getContext();
  noiseThud(ctx, 0.12, 0.25, 400, 1.5);
}

/** Double knock — check alert */
export function playCheckSound() {
  const ctx = getContext();
  noiseThud(ctx, 0.06, 0.2, 500, 2);
  setTimeout(() => {
    noiseThud(ctx, 0.06, 0.2, 600, 2);
  }, 80);
}

export function playSoundForMove(captured: boolean, inCheck: boolean) {
  if (inCheck) playCheckSound();
  else if (captured) playCaptureSound();
  else playMoveSound();
}

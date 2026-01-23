type AudioContextCtor = typeof AudioContext;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioCtor: AudioContextCtor | undefined =
    window.AudioContext ||
    (window as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

  if (!AudioCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => undefined);
  }

  return audioContext;
}

type ToneOptions = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  offset?: number;
};

function playTone({ frequency, duration, type, gain, offset }: ToneOptions): void {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + (offset ?? 0);
  const peakGain = gain ?? 0.12;

  oscillator.type = type ?? "sine";
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

export function playThud(offset = 0): void {
  playTone({
    frequency: 140,
    duration: 0.12,
    type: "triangle",
    gain: 0.15,
    offset,
  });
}

export function playWin(): void {
  playTone({ frequency: 440, duration: 0.12, type: "sine", gain: 0.12 });
  playTone({ frequency: 660, duration: 0.14, type: "sine", gain: 0.12, offset: 0.12 });
  playTone({ frequency: 880, duration: 0.18, type: "sine", gain: 0.12, offset: 0.26 });
}

export function playLose(): void {
  playTone({ frequency: 260, duration: 0.18, type: "sawtooth", gain: 0.12 });
  playTone({ frequency: 196, duration: 0.2, type: "sawtooth", gain: 0.12, offset: 0.16 });
  playTone({ frequency: 164, duration: 0.22, type: "sawtooth", gain: 0.12, offset: 0.34 });
}

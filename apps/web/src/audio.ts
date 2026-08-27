export type AudioCue = 'move' | 'win' | 'loss';

let audioContext: AudioContext | null = null;

const frequencies: Record<AudioCue, readonly number[]> = {
  move: [110],
  win: [523.25, 659.25, 783.99],
  loss: [293.66, 246.94, 196],
};

export const playAudioCue = async (cue: AudioCue): Promise<boolean> => {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const start = audioContext.currentTime;
    const duration = cue === 'move' ? 0.09 : 0.2;

    frequencies[cue].forEach((frequency, index) => {
      const oscillator = audioContext?.createOscillator();
      const gain = audioContext?.createGain();
      if (!oscillator || !gain || !audioContext) return;

      const offset = cue === 'move' ? 0 : index * 0.13;
      oscillator.type = cue === 'move' ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(cue === 'move' ? 0.14 : 0.1, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + duration);
    });

    return true;
  } catch {
    return false;
  }
};


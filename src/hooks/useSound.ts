import { useCallback, useRef } from 'react'

type SoundKind = 'thud' | 'win' | 'lose'

type SoundConfig = {
  type: OscillatorType
  frequency: number
  duration: number
  gain: number
  sweep?: number
}

const SOUND_MAP: Record<SoundKind, SoundConfig> = {
  thud: { type: 'triangle', frequency: 180, duration: 0.08, gain: 0.12 },
  win: { type: 'sine', frequency: 440, duration: 0.25, gain: 0.18, sweep: 240 },
  lose: { type: 'sawtooth', frequency: 260, duration: 0.22, gain: 0.16, sweep: -140 },
}

const createContext = () => new AudioContext()

const useSound = (kind: SoundKind) => {
  const ctxRef = useRef<AudioContext | null>(null)

  return useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createContext()
    }

    const ctx = ctxRef.current
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const { type, frequency, duration, gain, sweep } = SOUND_MAP[kind]
    const oscillator = ctx.createOscillator()
    const envelope = ctx.createGain()
    const now = ctx.currentTime

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    if (sweep) {
      oscillator.frequency.linearRampToValueAtTime(frequency + sweep, now + duration)
    }

    envelope.gain.setValueAtTime(gain, now)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    oscillator.connect(envelope)
    envelope.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }, [kind])
}

export default useSound

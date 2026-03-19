declare module 'canvas-confetti' {
  type ConfettiOptions = {
    particleCount?: number
    spread?: number
    origin?: {
      x?: number
      y?: number
    }
  }

  type Confetti = (options?: ConfettiOptions) => Promise<null> | null

  const confetti: Confetti

  export default confetti
}

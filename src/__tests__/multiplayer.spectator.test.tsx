import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MultiplayerGamePage from '../pages/MultiplayerGamePage'
import * as multiplayerModule from '../multiplayer'

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}

describe('MultiplayerGamePage spectator mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders player names and keeps the board read-only for spectators', async () => {
    vi.spyOn(multiplayerModule, 'subscribeToGame').mockReturnValue(() => {})

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

    await act(async () => {
      root.render(
        <MultiplayerGamePage
          initialGame={{
            id: 'spectator-game',
            status: 'active',
            name: 'Live Match',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            players: { X: 'misty_m1nx', O: 'zesty_potato3' },
            state: {
              board: [
                [null, null, 'X'],
                ['X', 'O', null],
                ['O', null, null],
              ],
              currentPlayer: 'X',
              winner: null,
              isDraw: false,
              endReason: null,
              moveHistory: [
                { row: 0, col: 2, player: 'X' },
                { row: 1, col: 1, player: 'O' },
              ],
            },
          }}
          mode="spectator"
          onQuit={vi.fn()}
          showApiLog={false}
          onLogApiMessage={vi.fn()}
        />,
      )
    })

    expect(container.textContent).toContain('misty_m1nx')
    expect(container.textContent).toContain('zesty_potato3')
    expect(container.textContent).toContain('misty_m1nx to move.')
    expect(container.textContent).not.toContain('Resign')
    expect(container.querySelectorAll('.square--interactive')).toHaveLength(0)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import LandingPage from '../pages/LandingPage'

const findButtonByText = (container: HTMLElement, text: string) =>
  Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === text,
  )

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('LandingPage multiplayer modal', () => {
  it('opens the modal and enables create when required fields are filled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    globalThis.IS_REACT_ACT_ENVIRONMENT = true

    await act(async () => {
      root.render(
        <LandingPage
          onStartSingle={vi.fn()}
          onCreateMultiplayer={vi.fn()}
          onJoinMultiplayer={vi.fn()}
          showApiLog={false}
          onToggleApiLog={vi.fn()}
          onLogApiMessage={vi.fn()}
        />,
      )
    })

    const openButton = findButtonByText(container, 'New Multiplayer')
    expect(openButton).toBeTruthy()

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.querySelector('.modal')).toBeTruthy()

    const modalPanel = container.querySelector('.modal__panel')
    const inputs = modalPanel
      ? Array.from(modalPanel.querySelectorAll('input'))
      : []
    expect(inputs).toHaveLength(2)

    await act(async () => {
      setInputValue(inputs[0], 'Host')
      setInputValue(inputs[1], 'Battle')
    })

    await act(async () => {
      await Promise.resolve()
    })

    const createButton = findButtonByText(container, 'Create Game')
    expect(createButton).toBeTruthy()
    expect(createButton?.hasAttribute('disabled')).toBe(false)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('shows the join empty state with refresh control', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    globalThis.IS_REACT_ACT_ENVIRONMENT = true

    await act(async () => {
      root.render(
        <LandingPage
          onStartSingle={vi.fn()}
          onCreateMultiplayer={vi.fn()}
          onJoinMultiplayer={vi.fn()}
          showApiLog={false}
          onToggleApiLog={vi.fn()}
          onLogApiMessage={vi.fn()}
        />,
      )
    })

    const openButton = findButtonByText(container, 'New Multiplayer')
    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const joinTab = findButtonByText(container, 'Join')
    await act(async () => {
      joinTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.textContent).toContain('No games available yet')
    expect(findButtonByText(container, 'Refresh')).toBeTruthy()

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import { makeStore } from './app/store';

test('renders landing page prompt for multiplayer game', () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  expect(screen.getByRole('button', { name: /single player/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /multiplayer/i })).toBeInTheDocument();
  expect(
    screen.getByText((_, element) => {
      if (!element || !element.classList.contains('landing-greeting-main')) {
        return false;
      }
      return /multiplayer\s*tic-tac-toe/i.test(element.textContent ?? '');
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /host new game/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /join game/i })).toBeInTheDocument();
});

test('renders join game id input on landing', () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect(screen.getByRole('textbox', { name: /game id/i })).toBeInTheDocument();
});

test('allows switching to single player mode', () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  fireEvent.click(screen.getByRole('button', { name: /single player/i }));

  expect(
    screen.getByText((_, element) => {
      if (!element || !element.classList.contains('landing-greeting-main')) {
        return false;
      }
      return /single player\s*tic-tac-toe/i.test(element.textContent ?? '');
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start single player/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /host new game/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /game id/i })).not.toBeInTheDocument();
});

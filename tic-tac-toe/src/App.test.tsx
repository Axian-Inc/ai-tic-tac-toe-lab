import React from 'react';
import { render, screen } from '@testing-library/react';
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
  expect(screen.getByText(/multiplayer tic-tac-toe/i)).toBeInTheDocument();
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

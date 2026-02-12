import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import App from './App';
import { makeStore } from './app/store';

test('renders landing page prompt for CPU game', () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /play vs\. cpu/i })).toBeInTheDocument();
});

test('navigates to game page after starting a new game', () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  userEvent.click(screen.getByRole('button', { name: /play vs\. cpu/i }));

  expect(screen.getByText(/your turn \(x\)/i)).toBeInTheDocument();
  expect(screen.getByRole('grid', { name: /tic-tac-toe board/i })).toBeInTheDocument();
});

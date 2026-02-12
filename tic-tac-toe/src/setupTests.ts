// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const originalConsoleError = console.error;

console.error = (...args: unknown[]) => {
  const [firstArg] = args;
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('Could not parse CSS stylesheet')
  ) {
    return;
  }

  originalConsoleError(...args);
};

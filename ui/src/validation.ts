export const MAX_PLAYER_NAME_LENGTH = 24;
export const PLAYER_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

export const getPlayerNameError = (value: string): string | null => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "Enter your name to start a game.";
  }

  if (!PLAYER_NAME_PATTERN.test(trimmedValue)) {
    return "Use letters, numbers, underscores, or hyphens only.";
  }

  return null;
};

export const getGameIdError = (value: string): string | null =>
  value.trim().length === 0 ? "Enter a game id." : null;

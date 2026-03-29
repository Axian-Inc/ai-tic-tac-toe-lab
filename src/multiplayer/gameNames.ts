const ANIMALS = [
  'Otter',
  'Panda',
  'Falcon',
  'Badger',
  'Pelican',
  'Lynx',
  'Fox',
  'Cougar',
  'Heron',
  'Cobra',
  'Moose',
  'Raven',
] as const;

const CITIES = [
  'Austin',
  'Boston',
  'Denver',
  'Lisbon',
  'Oslo',
  'Portland',
  'Salem',
  'Seattle',
  'Savannah',
  'Tokyo',
  'Valencia',
  'Zurich',
] as const;

function pickRandom<TValue>(values: readonly TValue[]) {
  return values[Math.floor(Math.random() * values.length)];
}

export function createSuggestedGameName() {
  return `${pickRandom(ANIMALS)} ${pickRandom(CITIES)}`;
}

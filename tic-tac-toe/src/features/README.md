# Features

This folder groups domain features and their Redux logic.

What belongs here:
- Feature folders (e.g. `game/`) that contain slices, selectors, and tests.
- Feature-specific types and helper logic that are tightly coupled to the feature.
- Any feature wiring that is not shared across the entire app.

What does not belong here:
- Route-level pages (those live under `src/pages`).
- Shared app setup (store configuration, hooks) which live under `src/app`.
- Generic utilities that are used across multiple features.

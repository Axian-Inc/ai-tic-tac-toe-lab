# Pages

This folder holds route-level React components that render full screens for the app.

What belongs here:
- Top-level page components used by the router (one file per screen).
- Page-only layout and UI orchestration logic (state selection, navigation, effects).
- Lightweight page-specific helpers that are not reused elsewhere.

What does not belong here:
- Shared UI components (place those in a components folder if added later).
- State slices, reducers, or selectors (those live under `src/features`).
- Generic utilities (place under a utils folder if added later).

# Technical Documentation

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* canvas-confetti
* HTML5 Audio API

### Testing

* To run locally
  * If developing in the browser: `npm run dev -- --host 0.0.0.0 --port 5173`
* Unit: Vitest (recommended with Vite)
  * Run: npm run test:run
* E2E: Playwright
  * Run: npm run test:e2e
  * First time: npx playwright install

### Infrastructure

* Terraform
* AWS S3 (static hosting)
* AWS CLI (authenticated to Axian LnD account)

---

## Architecture

### High-Level Architecture

```
UI (React Components)
        ↓
Game Module (Pure TypeScript)
        ↓
Deterministic CPU Logic
```

The **Game module is completely decoupled from React**.

---

## Project Structure

```
/src
  /game
    Game.ts
    cpu.ts
    types.ts
    Game.test.ts

  /components
    Board.tsx
    Square.tsx
    GameDetail.tsx

  /pages
    LandingPage.tsx
    GamePage.tsx

  /hooks
    useSound.ts

/tests
  e2e.spec.ts

/terraform
  main.tf
  variables.tf
  outputs.tf

README-Overview.md
README-Technical.md
User-Stories.md
```

---

## Game Module Responsibilities

The `Game` module manages:

* Board state
* Move order
* Current player
* Win detection
* Game over state
* Move validation
* Deterministic CPU move selection

It must:

* Prevent illegal moves
* Be fully testable without React
* Provide deterministic output given the same board

---

## CPU Design

CPU behavior:

* Always plays `"O"`
* Deterministic random selection (seeded logic)
* Does NOT move automatically
* Moves only when user presses `"CPU Move"` button

This ensures:

* Test predictability
* Playwright reliability
* Reproducibility

---

## Sound Design

Audio files placed in `/public/sounds`.

Triggered via a custom hook:

```
useSound("thud")
useSound("win")
useSound("lose")
```

Uses:

* HTMLAudioElement
* No external sound libraries

---

## Confetti

Uses:

* `canvas-confetti`

Triggered only when:

* Player completes a winning move

---

## Testing Strategy

### Unit Tests

Test:

* Board initialization
* Valid move
* Invalid move
* Turn switching
* Win detection
* Draw detection
* CPU determinism
* Game reset

Run via:

```
npm run test
```

---

### Playwright E2E

Test:

1. Load landing page
2. Click Play
3. Make moves
4. Trigger CPU moves
5. Reach winning state
6. Assert confetti
7. Assert win message

Run via:

```
npm run test:e2e
```

---

## Infrastructure (Terraform)

Terraform provisions:

* S3 bucket
* Static hosting configuration
* Public read policy
* Output: website URL

Deployment flow:

```
npm run build
terraform apply
aws s3 sync dist/ s3://bucket-name
```

---

## Deployment Workflow

1. Build app
2. Apply Terraform
3. Sync build output to S3
4. Validate URL

---

## CLI-First Philosophy

All major actions should be executable via CLI:

* `npm run dev`
* `npm run test`
* `npm run test:e2e`
* `npm run build`
* `terraform apply`

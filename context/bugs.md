# Bugs

Last updated: 2026-03-30

This file tracks active and resolved product defects discovered during development and testing.

## Phase 1

### Active

- None.

### Resolved

#### BUG-003 Play Again Visible Before Game Over
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-09, US-14
- Root cause: Gameplay controls always rendered the `Play Again` button without checking game status.
- Resolution: Updated gameplay controls to render `Play Again` only when `gameState.status.isOver` is true.

#### BUG-002 CPU Does Not Select Winning-Path Moves
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-05, US-15
- Root cause: CPU move selection returned the first valid open cell, which ignored winning opportunities and defensive blocks.
- Resolution: Replaced first-open-cell selection with a deterministic minimax strategy that evaluates all available moves and chooses the strongest outcome for the CPU.
- Rule constraint: Move choice remains deterministic via fixed position tie-break priority and still uses `canPlaceMove`/`placeMove` validation for legal placements.

#### BUG-001 CPU Move Requires User Interaction
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-04, US-11, US-15
- Root cause: Gameplay UI accepted manual clicks during CPU turn and did not trigger CPU move logic when `currentPlayer` switched to `O`.
- Resolution: Added CPU-turn side effect to programmatically place a deterministic valid move and disabled board interaction when it is the CPU turn.
- Rule constraint: CPU move selection continues to use existing move validation rules (`canPlaceMove` and `placeMove`), so only valid moves are applied and no moves occur after game over.

## Phase 2

### Active

- None.

### Resolved

#### BUG-014 Active Game List Match ID Overflows Column Layout
- Reported: 2026-03-29
- Resolved: 2026-03-30
- Related stories: US-31, US-36, US-40
- Root cause: Active game discovery cards reused the same horizontal card layout as waiting games, which forced long match IDs into the main content column alongside the rest of the entry details.
- Resolution: Updated active game discovery cards so the match ID renders on its own line and the remaining active-card content stacks in rows beneath it, while preserving the existing waiting-game layout.

#### BUG-013 Backend Deploy Health Check Fails During Normal Startup Delay
- Reported: 2026-03-24
- Resolved: 2026-03-24
- Related stories: US-42
- Root cause: `scripts/aws/lib/backend-deploy.ts` performed a single immediate `curl` to `/health` right after `systemctl restart`, so a normal short startup delay could mark an otherwise healthy release as failed.
- Resolution: Updated the deployment health verification step to retry the local `/health` check for a short bounded window before failing the release.

#### BUG-012 Backend Deploy Writes Non-Executable systemd `ExecStart`
- Reported: 2026-03-24
- Resolved: 2026-03-24
- Related stories: US-42
- Root cause: `scripts/aws/lib/backend-deploy.ts` wrote `ExecStart=${NPM_BIN} start` into the systemd unit, but the unit file was created from a literal heredoc and systemd does not expand that shell variable.
- Resolution: Updated the generated unit to use `/usr/bin/env npm start`, which systemd can execute directly without relying on shell-variable interpolation.

#### BUG-011 Backend Deploy Fails On Root Lockfile Drift
- Reported: 2026-03-24
- Resolved: 2026-03-24
- Related stories: US-42
- Root cause: `scripts/aws/lib/backend-deploy.ts` bundled the repo root `package.json` and `package-lock.json`, so backend-only releases still depended on the full app dependency graph and could fail when frontend/test lockfile state drifted.
- Resolution: Updated the backend deploy bundle to write a backend-only `package.json` containing just the runtime `start` script and backend dependency set, and changed the instance-side install step to install that backend-specific dependency set during deployment.

#### BUG-010 Backend Deploy Fails On Existing Instance Bootstrap Drift
- Reported: 2026-03-23
- Resolved: 2026-03-23
- Related stories: US-42
- Root cause: `scripts/aws/lib/backend-deploy.ts` assumed the target EC2 instance already had `/etc/ttt-multiplayer.env` and `ttt-multiplayer.service` from initial `UserData`, but CloudFormation updates do not rerun `UserData` on an existing instance.
- Resolution: Updated the Systems Manager deployment payload to recreate the backend environment file and systemd unit on every release before restart, so deployments no longer depend on first-boot bootstrap state.

#### BUG-009 AWS Deploy Scripts Resolve `infra/dev.yaml` from `dist-scripts`
- Reported: 2026-03-23
- Resolved: 2026-03-23
- Related stories: US-42
- Root cause: `scripts/aws/lib/config.ts` derived the repository root from a fixed relative path off `import.meta.url`, which resolved to `dist-scripts/` after TypeScript compilation and caused AWS scripts to look for `dev.yaml` in the wrong tree.
- Resolution: Replaced the fixed relative-path logic with repository root discovery that walks upward for `package.json` and `infra/dev.yaml`, so all compiled and source AWS setup/deploy scripts resolve `infra/dev.yaml` from the repo root.

#### BUG-008 Backend Deploy Fails When Instance Lacks npm
- Reported: 2026-03-23
- Resolved: 2026-03-23
- Related stories: US-42
- Root cause: The EC2 bootstrap installed `nodejs` but did not guarantee an `npm` binary, while `scripts/aws/deploy-multiplayer-service.sh` executed `npm ci --omit=dev` through Systems Manager.
- Resolution: Updated the infrastructure bootstrap to install `npm` explicitly and made the backend deploy command resolve or install `npm` on the instance before running the release install step.

#### BUG-007 Backend Deploy Depends on Missing Instance Helper
- Reported: 2026-03-23
- Resolved: 2026-03-23
- Related stories: US-42
- Root cause: `scripts/aws/deploy-multiplayer-service.sh` invoked `/usr/local/bin/deploy-ttt-multiplayer.sh` through Systems Manager, but that helper existed only when EC2 bootstrap `UserData` had created it on the current instance.
- Resolution: Updated the backend deploy script to send the full release install and restart steps directly through Systems Manager so releases no longer depend on the preinstalled helper file being present.

#### BUG-006 Backend Deploy Script AWS CLI Parameter Formatting
- Reported: 2026-03-23
- Resolved: 2026-03-23
- Related stories: US-42
- Root cause: `scripts/aws/deploy-multiplayer-service.sh` passed the Systems Manager `commands` payload through AWS CLI shorthand syntax, which was fragile and could fail with parameter format parsing errors even though the shell script itself parsed correctly.
- Resolution: Replaced the inline `--parameters` shorthand with a generated JSON parameter file passed via `file://`, matching the intended command payload without relying on brittle nested quoting.

#### BUG-005 Joinable Games Missing Spectate Action
- Reported: 2026-03-16
- Resolved: 2026-03-16
- Related stories: US-36, US-40
- Root cause: The multiplayer modal discovery view rendered the waiting-games action area with only the join control, even though the existing spectate flow already supported opening any game by ID.
- Resolution: Added a `Spectate` action next to `Join` for waiting games and reused the existing spectate handler so waiting matches can be observed without claiming the open player seat.

#### BUG-004 Multiplayer Shows Quit Alongside Resign
- Reported: 2026-03-16
- Resolved: 2026-03-16
- Related stories: US-13, US-35
- Root cause: The shared gameplay secondary control rendered `Quit` for active player sessions without excluding the multiplayer flow that already exposed `Resign`.
- Resolution: Updated gameplay controls so active multiplayer player sessions show only `Resign`, while the shared `Quit`/`Home` control remains unchanged for single-player and other non-active multiplayer states.

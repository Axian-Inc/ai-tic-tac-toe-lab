# Contract Questions for the Coordinator

Executable tests must not guess the following public decisions.

## Game and CPU

1. What coordinate names/order and player marks are canonical?
2. Who moves first, and can that vary on rematch?
3. Is draw a distinct terminal status, and what are the exact status values?
4. What deterministic, beatable CPU priority produces the golden human-win and
   CPU-win sequences?
5. What observable/application boundary signals sound and confetti in tests,
   and what accessibility behavior is required when sound is unavailable?
6. Does quit create a terminal game record or navigate away without retaining
   the local game?

## HTTP commands and identity-free seats

7. What are the finalized paths, request/response bodies, status codes, and
   error envelope for create, list, join, move, resign, and abandonment check?
8. With no user authentication, what unforgeable value identifies player X/O
   for later commands, and where may a browser persist it?
9. Are retries identified by a client command ID? What does replaying an
   accepted command return, and what happens when an ID is reused with a
   different payload?
10. What version/sequence precondition must a move carry, and which response
    represents a stale command?
11. Which statuses count toward the 25-game limit: waiting, active, or both?
    At what atomic transition is capacity released?
12. Is the 26th request required to receive `Retry-After`, and may waiting-list
    reads be eventually consistent?
13. What response and event follow simultaneous joins, moves, resignations, or
    abandonment probes?

## Time, history, and WebSockets

14. Is abandonment eligible at elapsed time `>= 3:00` or only `> 3:00`; which
    activity resets the clock; can a waiting game be abandoned; and which
    player wins?
15. What is the authoritative server timestamp precision/timezone?
16. Are event sequence numbers per game, where does numbering start, and what
    defines the snapshot-to-live synchronization marker?
17. What is the WebSocket envelope/version, subscription acknowledgement,
    reconnect cursor, ordering guarantee, and duplicate-delivery guarantee?
18. When history is replayed, is it a snapshot plus tail, all events, or a
    paginated resource, and what retention is guaranteed?
19. How are connection loss, expired player seats, missing cursors, and events
    older than retained history represented?

## Spectators, delivery, and evidence

20. Does spectating use a dedicated HTTP action, a WebSocket subscription, or
    both, and what server-side authorization/role prevents spectator commands?
21. What active-game fields are public, and what ordering/pagination is used?
22. What are the ratified coverage thresholds and exclusions?
23. Which browser/viewport/accessibility matrix is required in CI?
24. What named AWS region/account evidence proves deployment to the LnD account,
    and which post-merge environments may CI deploy automatically?
25. What exact “Codex CLI getting started” completion artifact is acceptable?

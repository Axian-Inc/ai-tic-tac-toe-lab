# Response

Here are concrete suggestions for each open item; I can bake these into context once you confirm.

- Error codes + HTTP mapping
  - INVALID_INPUT -> 400 (schema/body shape errors)
  - INVALID_MOVE -> 400 (occupied cell, out of range, wrong turn)
  - TERMINAL_STATE -> 409 (attempt to move after win/draw)
  - INCONSISTENT_STATE -> 400 (move counts/nextPlayer/winner mismatch)
  - AI_INVALID_OUTPUT -> 502 (bad model output after retries)
  - AI_TIMEOUT -> 504 (model timeout after retries)
  - AI_UNAVAILABLE -> 503 (Bedrock errors)

- State consistency rules (validate on every /move)
  - Board length 9, values only X/O/null.
  - Count(X) == Count(O) or Count(X) == Count(O)+1; otherwise INCONSISTENT_STATE.
  - nextPlayer == X when Count(X) == Count(O); nextPlayer == O when Count(X) == Count(O)+1.
  - If gameStatus == win then winner in {X,O} and board reflects a win line for winner.
  - If gameStatus == draw then no winner and board full (no nulls).
  - If gameStatus == in_progress then winner == null and no win lines exist.

- /v1/new-game behavior
  - Always returns empty board, gameStatus=in_progress, winner=null.
  - nextPlayer = startingPlayer passed in.
  - sessionId generated server-side (uuid), moveHistory omitted or empty array (choose one; I prefer omit until first move).
  - startingPlayer=O does NOT auto-trigger AI; client calls /move with playerMoveIndex for O if user starts, or for AI-first flow the UI triggers /move with playerMoveIndex=null? (If we want AI-first, we need a separate endpoint or allow playerMoveIndex to be optional.)
  - Recommendation: keep /move with mandatory playerMoveIndex; AI-first is handled by UI sending a dummy “player move” is wrong. So prefer: startingPlayer=O means user is O; user still plays first. If you want AI-first, add a query flag or new endpoint later.

- Opponent profiles + deterministic must-do scenarios
  - IDs: "balanced", "aggressive", "defensive".
  - Must-do fixtures (same for all profiles):
    - Win-in-1: AI has immediate win -> must take it.
    - Block-in-1: player has immediate win -> must block.
    - Fork block: player threatens fork -> must choose one of a limited set of blocking moves.
  - If you want profiles to differ: aggressive prioritizes center/corner on neutral boards; defensive prioritizes block over center even when non-forced.

- AI output parsing
  - Require strict JSON with only {moveIndex, rationale} and no extra keys.
  - moveIndex integer 0..8 required; rationale optional string (accept empty string).
  - Reject if moveIndex points to occupied cell or terminal state.

If these look good, say “accept” or edit any item, and I’ll update context and proceed test-first on Story 001/002.

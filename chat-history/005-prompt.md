# Prompt
We are only in the planning phase, working through the initial architecture and project overview.  This is the initial back of the napkin idea: Participants will build a single-player Tic-Tac-Toe game, where:

The human player plays via a simple react UI (recommendation: consider using Loveable)

The AI opponent is powered by an LLM hosted in AWS Bedrock

The AI makes move decisions based on:

Current board state

Game rules

Prompted strategy constraints  Architecture (High-Level)
Frontend: CLI or lightweight web UI (participant choice)

Backend:

Game engine (rules, board state, win detection)

AI move service (Bedrock integration)

Testing:

Unit tests (game logic)

AI behavior tests (prompt + response validation)

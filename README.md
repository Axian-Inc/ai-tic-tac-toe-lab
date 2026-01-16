# ai-tic-tac-toe-lab

This branch demonstrates using AGENTS.md to guide the agent through creating and maintaining context files during the planning phase of a project.

## AGENTS.md

AGENTS.md contains important guidelines for AI coding agents working on this project. 

In this example AGENTS.md instructs the AI coding agent to always refer to the `context/` directory as the source of truth for the project. It emphasizes that context is canon and should never be overridden with assumptions.

As you work through the planning phase with the agent the context files will be generated and updated as needed. The agent is guided to follow specific workflows before, during, and after completing tasks, ensuring adherence to documented standards and constraints.

### Example Prompts to get started

```
We are going to start the planning phase for a new POC of a single player vs AI tic-tac-toe game.  Starting from the basic concept walk me though step by step creating an implemenation plan.  Build up the context directory files as we make decisions.
```

```
I want to create the following, lets focus on planning for now, no implementation:
Participants will build a single-player Tic-Tac-Toe game, where:
The human player plays via a simple UI
The AI opponent is powered by an LLM hosted in AWS Bedrock
The AI makes move decisions based on:
 Current board state
 Game rules
 Prompted strategy (at least the following two)
  balanced (mix of defensive and offensive)
  aggressive (always go for the win)
  ```
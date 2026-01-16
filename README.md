# ai-tic-tac-toe-lab

This branch demonstrates using custom promps within Codex to provide consitency and reusablity when using AI agents.

In codex custom prompts are not stored in the project repository, but rather in the user's local file system. This allows users to create and manage their own set of prompts that can be reused across different projects.

This is different from other Agent tools like Cline, Claude Code, Gemini, etc. which typically store prompts within the project repository itself.

The .codex/prompts directory in this repository contains example prompt files that can be used with Codex AI agents.

Codex users can copy these example prompts to their own local .codex/prompts directory to use them in their projects.

To view the users .codex directory, run the following command in the devcontainer terminal:

```
code ~/.codex
```

## devcontainer Copy Script
A script is provided to copy the example prompts from this repository to the user's local .codex/prompts directory.

This script will run when the container is created.

It is recommended when working in a devcontainer to use this type of process to store the Codex prompts in the repository, then copy them to the user's local .codex directory when the container is created.  Otherwise, all prompts will be removed when the container is deleted or recreated.


## Example Prompts
- `story-creation.md`: A prompt for creating technical user stories from initial ideas.
- `story-evaluate.md`: A prompt for evaluating and decomposing user stories based on size and complexity.
- `next-steps.md`: A prompt for determining logical next steps in a project based on current progress and goals.
- `visualize-docs.md`: A prompt for generating visual diagrams from project documentation.
- `test-analyzer.md`: A prompt for analyzing code modules to identify test coverage gaps and quality issues.

## Prompt Creation
AI is a great way to generate initial versions of custom prompts.  Users can create their own custom prompts by using AI to generate an initial version, then iteratively refining the prompt until it meets their needs.

Claude was used to generate the initial versions of the example prompts in this repository. 

Example prompt used to generate the `test-analyzer.md` prompt:

```
Generate a simple concise reusable custom ai prompt that is less than 100 lines.  This prompt should focus on examaning existing test coverage and test design.  Looking for validity of tests, completness, edge-cases, missing code branches, etc.  It will start by generating a list of all top level code modules, then working one module at a time to review the tests, or breaking the module into smaller sub modules if needed before reviewing the tests. For each module/submodule a md file report will be generatated with findings and recommendations.  this prompt will not attempt to fix, add or remove any tests or code.
```